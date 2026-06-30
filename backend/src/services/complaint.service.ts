import mongoose from "mongoose";
import type { Types } from "mongoose";
import {
  ComplaintStatus,
} from "../models/complaint.model.js";
import { UserRole } from "../models/user.model.js";
import {
  createComplaints,
  deleteComplaintById,
  findComplaintById,
} from "../repositories/complaint.repository.js";
import { updateOneUser } from "../repositories/user.repository.js";
import type {
  CreateComplaintBody,
  UpdateComplaintBody,
} from "../validation/complaint.schemas.js";

export async function createComplaintWithLink(
  userId: Types.ObjectId,
  body: CreateComplaintBody
): Promise<{ complaintId: Types.ObjectId; createdAt: Date }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const created = await createComplaints(
      [
        {
          createdBy: userId,
          subject: body.subject.trim(),
          description: body.description.trim(),
          status: ComplaintStatus.PENDING,
        },
      ],
      session
    );

    const newComplaint = created[0];

    await updateOneUser(
      { _id: userId },
      { $push: { allComplaint: newComplaint._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      complaintId: newComplaint._id as Types.ObjectId,
      createdAt: newComplaint.createdAt,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function deleteComplaintWithLink(
  userId: Types.ObjectId,
  userRole: UserRole,
  complaintId: string
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const complaint = await findComplaintById(complaintId, session);

    if (!complaint) {
      throw new Error("NOT_FOUND");
    }

    const isCreator = complaint.createdBy.toString() === userId.toString();
    const isAdmin =
      userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isCreator && !isAdmin) {
      throw new Error("FORBIDDEN");
    }

    await deleteComplaintById(complaintId, session);

    await updateOneUser(
      { _id: complaint.createdBy },
      { $pull: { allComplaint: complaintId } },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function updateComplaintAdmin(
  adminUserId: Types.ObjectId,
  complaintId: string,
  body: UpdateComplaintBody
): Promise<void> {
  const complaint = await findComplaintById(complaintId);
  if (!complaint) {
    throw new Error("NOT_FOUND");
  }

  if (body.status !== undefined) {
    complaint.status = body.status;
  }

  if (body.adminResponse !== undefined && body.adminResponse !== "") {
    complaint.adminResponse = body.adminResponse.trim();
  }

  if (
    body.status === ComplaintStatus.RESOLVED ||
    body.status === ComplaintStatus.CLOSED
  ) {
    complaint.resolvedBy = adminUserId;
  }

  await complaint.save();
}
