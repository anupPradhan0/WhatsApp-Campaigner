import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  createCampaignForUser,
  updateCampaignStats,
  sendDraftCampaign,
} from "../services/campaign.service.js";
import type {
  CampaignStatsBody,
  CreateCampaignBody,
} from "../validation/campaign.schemas.js";
import { pathParam } from "../utils/route-params.utils.js";

export async function createCampaign(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const body = req.body as CreateCampaignBody;
    // With upload.fields the file URLs are set on the body by the cloudinary
    // middleware (req.file is no longer populated).
    const media = req.body.fileUrl ?? "";
    const profileImage = req.body.profileImageUrl ?? "";

    const result = await createCampaignForUser(
      req.user._id,
      body,
      typeof media === "string" ? media : "",
      typeof profileImage === "string" ? profileImage : ""
    );

    const {
      newCampaign,
      requestedNumberCount,
      actualNumberCount,
      balanceAfter,
      pointsDeducted,
      transactionId,
      isDraft,
    } = result;

    res.status(201).json({
      success: true,
      message: isDraft
        ? "Campaign saved as draft."
        : actualNumberCount < requestedNumberCount
          ? `Campaign created with ${actualNumberCount} numbers (limited by balance). ${
              requestedNumberCount - actualNumberCount
            } numbers were excluded.`
          : "Campaign created successfully.",
      data: {
        isDraft,
        status: newCampaign.status,
        campaignId: newCampaign._id,
        campaignName: newCampaign.campaignName,
        message: newCampaign.message,
        phoneButton: newCampaign.phoneButton,
        linkButton: newCampaign.linkButton,
        media: newCampaign.media,
        mediaType: newCampaign.mediaType,
        profileImage: newCampaign.profileImage,
        mobileNumberEntryType: newCampaign.mobileNumberEntryType,
        requestedNumberCount,
        actualNumberCount,
        pointsDeducted,
        remainingBalance: balanceAfter,
        countryCode: newCampaign.countryCode,
        createdAt: newCampaign.createdAt,
        transactionId,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "NO_NUMBERS") {
      res.status(400).json({
        success: false,
        message: "At least one mobile number is required.",
      });
      return;
    }
    if (msg === "USER_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }
    if (msg === "INSUFFICIENT_BALANCE") {
      res.status(400).json({
        success: false,
        message:
          "Insufficient balance. You need at least 1 point to create a campaign.",
      });
      return;
    }
    if (msg === "PARTIAL_BALANCE") {
      const e = error as Error & { affordable?: number; requested?: number };
      const affordable = e.affordable ?? 0;
      const requested = e.requested ?? 0;
      res.status(400).json({
        success: false,
        code: "PARTIAL_BALANCE",
        message: `You have only ${affordable} credit${affordable === 1 ? "" : "s"}, but this campaign has ${requested} numbers. You can send to ${affordable} number${affordable === 1 ? "" : "s"} only.`,
        affordable,
        requested,
      });
      return;
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((e) => e.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
      return;
    }

    console.error("Error creating campaign:", error);
    const message =
      error instanceof Error ? error.message : "Server error while creating campaign";
    res.status(500).json({
      success: false,
      message: "Server error while creating campaign",
      error: message,
    });
  }
}

export async function campaignStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const campaignId = pathParam(req.params.campaignId);
    const body = req.body as CampaignStatsBody;

    const campaign = await updateCampaignStats(user, campaignId, body);

    res.status(200).json({
      success: true,
      message: "Campaign status updated successfully.",
      data: {
        campaignId: campaign._id,
        status: campaign.status,
        statusMessage: campaign.statusMessage,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "CAMPAIGN_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
      return;
    }
    if (msg === "FORBIDDEN") {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this campaign.",
      });
      return;
    }
    console.error("Error updating campaign status:", error);
    const message =
      error instanceof Error ? error.message : "Server error";
    res.status(500).json({
      success: false,
      message: "Server error while updating campaign status",
      error: message,
    });
  }
}

export async function sendCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const campaignId = pathParam(req.params.campaignId);
    const raw = (req.body ?? {}) as { allowPartial?: unknown };
    const allowPartial = raw.allowPartial === true || raw.allowPartial === "true";

    const result = await sendDraftCampaign(user._id, campaignId, allowPartial);

    res.status(200).json({
      success: true,
      message:
        result.actualNumberCount < result.requestedNumberCount
          ? `Campaign sent to ${result.actualNumberCount} numbers (limited by balance).`
          : "Campaign sent successfully.",
      data: {
        campaignId: result.campaign._id,
        status: result.campaign.status,
        requestedNumberCount: result.requestedNumberCount,
        actualNumberCount: result.actualNumberCount,
        remainingBalance: result.balanceAfter,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "CAMPAIGN_NOT_FOUND" || msg === "USER_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Campaign not found." });
      return;
    }
    if (msg === "NOT_A_DRAFT") {
      res.status(400).json({
        success: false,
        message: "This campaign is not a draft — it has already been sent.",
      });
      return;
    }
    if (msg === "FORBIDDEN") {
      res.status(403).json({
        success: false,
        message: "You are not allowed to send this campaign.",
      });
      return;
    }
    if (msg === "NO_NUMBERS") {
      res.status(400).json({
        success: false,
        message: "This draft has no recipients to send to.",
      });
      return;
    }
    if (msg === "INSUFFICIENT_BALANCE") {
      res.status(400).json({
        success: false,
        message:
          "Insufficient balance. You need at least 1 credit to send this campaign.",
      });
      return;
    }
    if (msg === "PARTIAL_BALANCE") {
      const e = error as Error & { affordable?: number; requested?: number };
      const affordable = e.affordable ?? 0;
      const requested = e.requested ?? 0;
      res.status(400).json({
        success: false,
        code: "PARTIAL_BALANCE",
        message: `You have only ${affordable} credit${affordable === 1 ? "" : "s"}, but this campaign has ${requested} numbers. You can send to ${affordable} number${affordable === 1 ? "" : "s"} only.`,
        affordable,
        requested,
      });
      return;
    }
    console.error("Error sending campaign:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending campaign",
      error: msg,
    });
  }
}
