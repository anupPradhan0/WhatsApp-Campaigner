import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  createCampaignForUser,
  updateCampaignStats,
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
    } = result;

    res.status(201).json({
      success: true,
      message:
        actualNumberCount < requestedNumberCount
          ? `Campaign created with ${actualNumberCount} numbers (limited by balance). ${
              requestedNumberCount - actualNumberCount
            } numbers were excluded.`
          : "Campaign created successfully.",
      data: {
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
