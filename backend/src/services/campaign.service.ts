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

export interface CreateCampaignResult {
  newCampaign: ICampaign;
  requestedNumberCount: number;
  actualNumberCount: number;
  balanceAfter: number;
  pointsDeducted: number;
  transactionId: Types.ObjectId;
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

    let actualNumberCount: number;

    // Super admin (God mode) sends unlimited campaigns for free. Everyone else,
    // including admins, pays for the send out of their own credit balance.
    if (isSuperAdmin(user.role)) {
      actualNumberCount = requestedNumberCount;
    } else {
      actualNumberCount = Math.min(requestedNumberCount, user.balance);
      if (actualNumberCount === 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
    }

    const processedNumbers = numbersArray.slice(0, actualNumberCount);

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
      status: CampaignStats.PENDING,
      statusMessage: "Campaign is in the pending state.",
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

    // Enqueue the send job. Failure to enqueue is non-fatal here: we mark the
    // campaign failed asynchronously and log. Debits remain — refund is a
    // separate manual/admin action.
    try {
      const queued = publishCampaignJob(
        (newCampaign._id as Types.ObjectId).toString(),
      );
      if (!queued) {
        console.error(
          "[campaign.service] failed to enqueue campaign",
          (newCampaign._id as Types.ObjectId).toString(),
        );
        newCampaign.status = CampaignStats.FAILED;
        newCampaign.statusMessage =
          "Could not enqueue send job. Contact support.";
        await newCampaign.save();
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
    };
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
