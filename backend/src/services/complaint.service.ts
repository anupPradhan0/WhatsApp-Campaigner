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
import {
  findUserById,
  updateOneUser,
} from "../repositories/user.repository.js";
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

    // The creator can always delete their own ticket, and the super admin (God
    // mode) can delete any. A regular admin/reseller may only delete complaints
    // raised by accounts in their own downline — matching updateComplaintAdmin.
    // Previously ANY admin could delete ANY complaint in the system.
    if (!isCreator && userRole !== UserRole.SUPER_ADMIN) {
      const manager = await findUserById(userId, {
        select: "allUsers allReseller",
      });
      const downlineIds = new Set([
        userId.toString(),
        ...(manager?.allUsers ?? []).map((id) => id.toString()),
        ...(manager?.allReseller ?? []).map((id) => id.toString()),
      ]);
      if (!downlineIds.has(complaint.createdBy.toString())) {
        throw new Error("FORBIDDEN");
      }
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
  adminRole: UserRole,
  complaintId: string,
  body: UpdateComplaintBody
): Promise<void> {
  const complaint = await findComplaintById(complaintId);
  if (!complaint) {
    throw new Error("NOT_FOUND");
  }

  // The super admin (God mode) can act on every ticket. A regular admin may only
  // respond to / resolve complaints raised by accounts in their own downline
  // (themselves plus the resellers and users they manage) — the same scope they
  // see in the complaint list.
  if (adminRole !== UserRole.SUPER_ADMIN) {
    const admin = await findUserById(adminUserId, {
      select: "allUsers allReseller",
    });
    if (!admin) {
      throw new Error("NOT_FOUND");
    }

    const downlineIds = new Set([
      adminUserId.toString(),
      ...(admin.allUsers ?? []).map((id) => id.toString()),
      ...(admin.allReseller ?? []).map((id) => id.toString()),
    ]);

    if (!downlineIds.has(complaint.createdBy.toString())) {
      throw new Error("FORBIDDEN");
    }
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
