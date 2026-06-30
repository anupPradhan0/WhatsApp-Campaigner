import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import { UserRole } from "../models/user.model.js";
import {
  createComplaintWithLink,
  deleteComplaintWithLink,
  updateComplaintAdmin,
} from "../services/complaint.service.js";
import type {
  CreateComplaintBody,
  UpdateComplaintBody,
} from "../validation/complaint.schemas.js";
import { findComplaintById } from "../repositories/complaint.repository.js";
import { pathParam } from "../utils/route-params.utils.js";

export async function createComplaint(
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

    const body = req.body as CreateComplaintBody;

    const result = await createComplaintWithLink(req.user._id, body);

    res.status(201).json({
      success: true,
      message: "Complaint created successfully.",
      data: {
        complaintId: result.complaintId,
        subject: body.subject.trim(),
        description: body.description.trim(),
        status: "pending",
        createdAt: result.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating complaint:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Server error while creating complaint";
    res.status(500).json({
      success: false,
      message: "Server error while creating complaint",
      error: message,
    });
  }
}

export async function deleteComplaint(
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

    const userId = (req.user as IUser)._id;
    const userRole = (req.user as IUser).role;
    const complaintId = pathParam(req.params.complaintId);

    try {
      await deleteComplaintWithLink(userId, userRole, complaintId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Complaint not found.",
        });
        return;
      }
      if (msg === "FORBIDDEN") {
        res.status(403).json({
          success: false,
          message: "You do not have permission to delete this complaint.",
        });
        return;
      }
      throw err;
    }

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("Error deleting complaint:", error);
    const message =
      error instanceof Error ? error.message : "Server error while deleting complaint";
    res.status(500).json({
      success: false,
      message: "Server error while deleting complaint",
      error: message,
    });
  }
}

export async function updateComplaint(
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

    const userRole = (req.user as IUser).role;
    const userId = (req.user as IUser)._id;
    const complaintId = pathParam(req.params.complaintId);
    const body = req.body as UpdateComplaintBody;

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: "Only admin can update complaints.",
      });
      return;
    }

    try {
      await updateComplaintAdmin(userId, complaintId, body);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "NOT_FOUND") {
        res.status(404).json({
          success: false,
          message: "Complaint not found.",
        });
        return;
      }
      throw err;
    }

    const complaint = await findComplaintById(complaintId);

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully.",
      data: complaint
        ? {
            complaintId: complaint._id,
            subject: complaint.subject,
            status: complaint.status,
            adminResponse: complaint.adminResponse,
            resolvedBy: complaint.resolvedBy,
            resolvedAt: complaint.resolvedAt,
            updatedAt: complaint.updatedAt,
          }
        : {},
    });
  } catch (error: unknown) {
    console.error("Error updating complaint:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: messages,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Server error while updating complaint";
    res.status(500).json({
      success: false,
      message: "Server error while updating complaint",
      error: message,
    });
  }
}
