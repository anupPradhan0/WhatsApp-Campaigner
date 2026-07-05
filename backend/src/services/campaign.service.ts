import mongoose from "mongoose";
import type { ICampaign } from "../models/campaign.model.js";
import type { IUser } from "../models/user.model.js";
import { userCanViewCampaign } from "../utils/campaign-access.utils.js";
import {
  CampaignStats,
  MobileNumberEntryType,
} from "../models/campaign.model.js";
import {
  createCampaigns,
  findCampaignById,
} from "../repositories/campaign.repository.js";
import { isSuperAdmin } from "../utils/role-hierarchy.utils.js";
import {
  findUserById,
  saveUser,
  adjustUserBalance,
  updateOneUser,
} from "../repositories/user.repository.js";
import { createTransactions } from "../repositories/transaction.repository.js";
import { supportsTransactions } from "../utils/transaction-support.utils.js";
import { publishCampaignJob } from "../queue/campaign.producer.js";
import type {
  CampaignStatsBody,
  CreateCampaignBody,
} from "../validation/campaign.schemas.js";
import type { Types } from "mongoose";

function parseMobileNumbers(
  mobileNumbers: string | string[]
): string[] {
  if (typeof mobileNumbers === "string") {
    return mobileNumbers
      .split(/[\n,]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);
  }
  return mobileNumbers;
}

/**
 * Resolve how many numbers a NON-super-admin owner can actually send to.
 * Throws INSUFFICIENT_BALANCE if they have no credits, or PARTIAL_BALANCE (with
 * `affordable`/`requested`) when the list exceeds their balance and they haven't
 * confirmed a partial send. Returns the full count when they can afford it.
 */
function resolveSendCount(
  owner: IUser,
  requestedNumberCount: number,
  allowPartial: boolean
): number {
  const affordable = Math.floor(owner.balance);
  if (affordable <= 0) {
    throw new Error("INSUFFICIENT_BALANCE");
  }
  if (requestedNumberCount > affordable) {
    if (!allowPartial) {
      const err = new Error("PARTIAL_BALANCE") as Error & {
        affordable?: number;
        requested?: number;
      };
      err.affordable = affordable;
      err.requested = requestedNumberCount;
      throw err;
    }
    return affordable;
  }
  return requestedNumberCount;
}

export interface CreateCampaignResult {
  newCampaign: ICampaign;
  requestedNumberCount: number;
  actualNumberCount: number;
  balanceAfter: number;
  pointsDeducted: number;
  transactionId?: Types.ObjectId;
  isDraft: boolean;
}

export async function createCampaignForUser(
  creatorId: Types.ObjectId,
  body: CreateCampaignBody,
  mediaPath: string,
  profileImagePath = ""
): Promise<CreateCampaignResult> {
  const useTransaction = await supportsTransactions();
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  const sOpt = session ?? undefined;

  try {
    const {
      campaignName,
      message,
      phoneButtonText,
      phoneButtonNumber,
      linkButtonText,
      linkButtonUrl,
      mobileNumberEntryType,
      mobileNumbers: rawNumbers,
      countryCode,
    } = body;

    const numbersArray = parseMobileNumbers(rawNumbers);

    if (numbersArray.length === 0) {
      throw new Error("NO_NUMBERS");
    }

    const requestedNumberCount = numbersArray.length;

    const user = await findUserById(creatorId, { session: sOpt });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isDraft = Boolean(body.saveAsDraft);

    // A draft keeps ALL numbers and is never charged. For a real send, a
    // non-super-admin can only reach as many numbers as their balance allows
    // (super admin sends unlimited, for free).
    let actualNumberCount = requestedNumberCount;
    if (!isDraft && !isSuperAdmin(user.role)) {
      actualNumberCount = resolveSendCount(
        user,
        requestedNumberCount,
        Boolean(body.allowPartial)
      );
    }

    const processedNumbers = isDraft
      ? numbersArray
      : numbersArray.slice(0, actualNumberCount);

    const campaignData: Partial<ICampaign> = {
      campaignName,
      message,
      mobileNumberEntryType:
        mobileNumberEntryType ?? MobileNumberEntryType.MANUAL,
      mobileNumbers: processedNumbers,
      countryCode,
      createdBy: creatorId,
      media: mediaPath || undefined,
      mediaType: mediaPath ? body.mediaType : undefined,
      profileImage: profileImagePath || undefined,
      status: isDraft ? CampaignStats.DRAFT : CampaignStats.PENDING,
      statusMessage: isDraft
        ? "Draft — not sent yet."
        : "Campaign is in the pending state.",
    };

    if (phoneButtonText && phoneButtonNumber) {
      campaignData.phoneButton = {
        text: phoneButtonText,
        number: phoneButtonNumber,
      };
    }

    if (linkButtonText && linkButtonUrl) {
      campaignData.linkButton = {
        text: linkButtonText,
        url: linkButtonUrl,
      };
    }

    const created = await createCampaigns([campaignData], sOpt);
    const newCampaign = created[0];

    // Draft: persist and link to the owner, but never charge or enqueue. The
    // owner sends it later from their WhatsApp Report.
    if (isDraft) {
      user.allCampaign.push(newCampaign._id as mongoose.Types.ObjectId);
      await saveUser(user, sOpt);
      if (session) await session.commitTransaction();
      return {
        newCampaign,
        requestedNumberCount,
        actualNumberCount: processedNumbers.length,
        balanceAfter: user.balance,
        pointsDeducted: 0,
        transactionId: undefined,
        isDraft: true,
      };
    }

    const balanceBefore = user.balance;
    let balanceAfter = user.balance;

    if (!isSuperAdmin(user.role)) {
      // Atomic, guarded debit: a concurrent campaign cannot drive the balance
      // negative, and we never lose updates the way `user.balance -= x` +
      // `save()` could. If the balance dropped below the cost since we read it,
      // the guard fails and the whole transaction rolls back.
      const debited = await adjustUserBalance(user._id, -actualNumberCount, {
        minBalance: actualNumberCount,
        session: sOpt,
      });
      if (!debited) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      balanceAfter = debited.balance;
    }

    const transactionDocs = await createTransactions(
      [
        {
          receiverId: user._id,
          campaignId: newCampaign._id,
          type: "debit",
          amount: actualNumberCount,
          balanceBefore,
          balanceAfter,
          status: "success",
        },
      ],
      sOpt
    );

    const transaction = transactionDocs[0];

    user.allCampaign.push(newCampaign._id as mongoose.Types.ObjectId);
    user.totalCampaigns += 1;
    user.allTransaction.push(transaction._id as mongoose.Types.ObjectId);

    await saveUser(user, sOpt);

    if (session) await session.commitTransaction();

    // Enqueue the send job. A freshly published campaign must always read as
    // PENDING (its default) — we never flip it to FAILED here. If the queue is
    // temporarily unavailable we only log; the campaign stays pending until it
    // is actually processed by the worker or an admin changes its status.
    try {
      const queued = publishCampaignJob(
        (newCampaign._id as Types.ObjectId).toString(),
      );
      if (!queued) {
        console.error(
          "[campaign.service] failed to enqueue campaign; left pending",
          (newCampaign._id as Types.ObjectId).toString(),
        );
      }
    } catch (err) {
      console.error(
        "[campaign.service] enqueue threw:",
        (err as Error).message,
      );
    }

    return {
      newCampaign,
      requestedNumberCount,
      actualNumberCount,
      balanceAfter,
      pointsDeducted: isSuperAdmin(user.role) ? 0 : actualNumberCount,
      transactionId: transaction._id as Types.ObjectId,
      isDraft: false,
    };
  } catch (error) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}

export interface SendDraftResult {
  campaign: ICampaign;
  requestedNumberCount: number;
  actualNumberCount: number;
  balanceAfter: number;
}

/**
 * Send an existing DRAFT campaign: charge the campaign's owner, flip it to
 * PENDING and enqueue it. Anyone who can view the campaign (the owner or an
 * upline admin/reseller/super admin) may trigger the send, but the credits are
 * always debited from the campaign OWNER's wallet.
 */
export async function sendDraftCampaign(
  actorId: Types.ObjectId,
  campaignId: string,
  allowPartial: boolean
): Promise<SendDraftResult> {
  const useTransaction = await supportsTransactions();
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  const sOpt = session ?? undefined;

  try {
    const campaign = await findCampaignById(campaignId);
    if (!campaign) {
      throw new Error("CAMPAIGN_NOT_FOUND");
    }
    if (campaign.status !== CampaignStats.DRAFT) {
      throw new Error("NOT_A_DRAFT");
    }

    // Only the owner or an upline manager may send this draft.
    const actor = await findUserById(actorId, { session: sOpt });
    if (!actor) {
      throw new Error("USER_NOT_FOUND");
    }
    const allowed = await userCanViewCampaign(
      actor,
      campaignId,
      campaign.createdBy
    );
    if (!allowed) {
      throw new Error("FORBIDDEN");
    }

    // Credits come from the campaign owner, not necessarily the actor.
    const owner = await findUserById(campaign.createdBy, { session: sOpt });
    if (!owner) {
      throw new Error("USER_NOT_FOUND");
    }

    const requestedNumberCount = campaign.mobileNumbers.length;
    if (requestedNumberCount === 0) {
      throw new Error("NO_NUMBERS");
    }

    let actualNumberCount = requestedNumberCount;
    if (!isSuperAdmin(owner.role)) {
      actualNumberCount = resolveSendCount(
        owner,
        requestedNumberCount,
        allowPartial
      );
    }

    // Trim to the affordable count and flip the draft into a pending send.
    campaign.mobileNumbers = campaign.mobileNumbers.slice(0, actualNumberCount);
    campaign.status = CampaignStats.PENDING;
    campaign.statusMessage = "Campaign is in the pending state.";

    const balanceBefore = owner.balance;
    let balanceAfter = owner.balance;
    if (!isSuperAdmin(owner.role)) {
      const debited = await adjustUserBalance(owner._id, -actualNumberCount, {
        minBalance: actualNumberCount,
        session: sOpt,
      });
      if (!debited) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      balanceAfter = debited.balance;
    }

    const transactionDocs = await createTransactions(
      [
        {
          receiverId: owner._id,
          campaignId: campaign._id,
          type: "debit",
          amount: actualNumberCount,
          balanceBefore,
          balanceAfter,
          status: "success",
        },
      ],
      sOpt
    );
    const transaction = transactionDocs[0];

    await campaign.save(sOpt ? { session: sOpt } : {});

    // Atomic link on the owner — avoid re-saving the whole user doc.
    await updateOneUser(
      { _id: owner._id },
      {
        $push: { allTransaction: transaction._id },
        $inc: { totalCampaigns: 1 },
      },
      { session: sOpt }
    );

    if (session) await session.commitTransaction();

    try {
      const queued = publishCampaignJob(
        (campaign._id as Types.ObjectId).toString()
      );
      if (!queued) {
        console.error(
          "[campaign.service] failed to enqueue sent draft; left pending",
          (campaign._id as Types.ObjectId).toString()
        );
      }
    } catch (err) {
      console.error(
        "[campaign.service] enqueue threw:",
        (err as Error).message
      );
    }

    return { campaign, requestedNumberCount, actualNumberCount, balanceAfter };
  } catch (error) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}

export async function updateCampaignStats(
  user: IUser,
  campaignId: string,
  body: CampaignStatsBody
): Promise<ICampaign> {
  const campaign = await findCampaignById(campaignId);
  if (!campaign) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  // Only the campaign owner, their upline manager, or the super admin may change
  // a campaign's status — same scope as viewing/exporting it. Without this any
  // logged-in account could rewrite an unrelated tenant's campaign status by id.
  const allowed = await userCanViewCampaign(
    user,
    campaignId,
    campaign.createdBy
  );
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  campaign.status = body.status;
  if (body.statusMessage !== undefined && body.statusMessage !== "") {
    campaign.statusMessage = body.statusMessage;
  }

  await campaign.save();
  return campaign;
}
