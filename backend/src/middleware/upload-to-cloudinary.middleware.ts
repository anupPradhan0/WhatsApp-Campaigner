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
    if (!req.file) {
      next();
      return;
    }

    const userId = req.user?._id ?? "unknown";
    const timestamp = Date.now();
    const campaignName =
      typeof req.body.campaignName === "string"
        ? req.body.campaignName.replace(/\s+/g, "-").toLowerCase()
        : "campaign";
    const publicId = `${campaignName}-${userId}-${timestamp}`;

    const category = getFileTypeCategory(req.file.mimetype);
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
      req.file.path,
      "whatsapp-campaign/campaigns",
      publicId,
      resourceType
    );

    req.file.path = cloudinaryUrl;
    req.body.fileUrl = cloudinaryUrl;
    // Authoritative media type, derived server-side from the actual file.
    req.body.mediaType = category;

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
