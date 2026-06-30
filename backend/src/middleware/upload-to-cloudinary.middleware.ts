import type { Request, Response, NextFunction } from "express";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.utils.js";
import { getFileTypeCategory } from "../utils/upload.utils.js";

export async function uploadUserImageToCloudinary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      next();
      return;
    }

    if (!req.file.mimetype.startsWith("image/")) {
      res.status(400).json({
        success: false,
        message: "Invalid file type. Only images are allowed.",
      });
      return;
    }

    const userId = req.user?._id ?? "bootstrap";
    const timestamp = Date.now();
    const publicId = `user-${userId}-${timestamp}`;

    const cloudinaryUrl = await uploadToCloudinary(
      req.file.path,
      "whatsapp-campaign/users",
      publicId,
      "image"
    );

    req.file.path = cloudinaryUrl;

    next();
  } catch (error: unknown) {
    console.error("Upload to Cloudinary middleware error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({
      success: false,
      message: "Failed to upload image to cloud storage",
      error: message,
    });
  }
}

export async function uploadCampaignFileToCloudinary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // `upload.fields` puts uploads under req.files keyed by field name.
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const mediaFile = files?.image?.[0];
    const profileFile = files?.profileImage?.[0];

    if (!mediaFile && !profileFile) {
      next();
      return;
    }

    const userId = req.user?._id ?? "unknown";
    const timestamp = Date.now();
    const campaignName =
      typeof req.body.campaignName === "string"
        ? req.body.campaignName.replace(/\s+/g, "-").toLowerCase()
        : "campaign";

    // Main media attachment (image / video / pdf).
    if (mediaFile) {
      const category = getFileTypeCategory(mediaFile.mimetype);
      if (!category) {
        res.status(400).json({
          success: false,
          message:
            "Unsupported file type. Allowed: images, MP4/MOV/WebM video, and PDF.",
        });
        return;
      }

      // Cloudinary resource types: images & video have native types; PDFs are
      // stored as "raw" so the original document is preserved and downloadable.
      const resourceType =
        category === "image" ? "image" : category === "video" ? "video" : "raw";

      const cloudinaryUrl = await uploadToCloudinary(
        mediaFile.path,
        "whatsapp-campaign/campaigns",
        `${campaignName}-${userId}-${timestamp}`,
        resourceType
      );

      req.body.fileUrl = cloudinaryUrl;
      // Authoritative media type, derived server-side from the actual file.
      req.body.mediaType = category;
    }

    // Optional campaign profile picture — must be an image.
    if (profileFile) {
      if (!profileFile.mimetype.startsWith("image/")) {
        res.status(400).json({
          success: false,
          message: "Profile picture must be an image.",
        });
        return;
      }

      const profileUrl = await uploadToCloudinary(
        profileFile.path,
        "whatsapp-campaign/campaign-profiles",
        `${campaignName}-profile-${userId}-${timestamp}`,
        "image"
      );

      req.body.profileImageUrl = profileUrl;
    }

    next();
  } catch (error: unknown) {
    console.error("Upload campaign file to Cloudinary error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    res.status(500).json({
      success: false,
      message: "Failed to upload file to cloud storage",
      error: message,
    });
  }
}

export async function deleteOldUserImage(oldImageUrl: string): Promise<void> {
  try {
    if (oldImageUrl && oldImageUrl.includes("cloudinary.com")) {
      await deleteFromCloudinary(oldImageUrl, "image");
    }
  } catch (error) {
    console.error("Error deleting old image:", error);
  }
}
