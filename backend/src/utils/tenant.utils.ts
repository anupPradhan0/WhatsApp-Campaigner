import type { Request } from "express";
import type mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import { findOneUser, UserStatus } from "../repositories/user.repository.js";
import User from "../models/user.model.js";

/**
 * The white-label tenant serving this request, or null on the platform's own
 * domain. Only verified domains resolve — an unverified one isn't routed to us
 * yet, so anything claiming to be it is spoofing the Host header.
 */
export async function resolveTenant(req: Request): Promise<IUser | null> {
  return findOneUser({
    domain: req.hostname.toLowerCase(),
    status: UserStatus.ACTIVE,
    domainVerifiedAt: { $ne: null },
  });
}

/**
 * Whether `userId` sits under `tenantId` in the account tree. Walks up the
 * `userID` parent chain rather than expanding the tenant's whole downline —
 * O(depth) reads instead of O(tree). Self-registered accounts have no parent
 * and therefore belong to no tenant.
 */
export async function isWithinTenant(
  userId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId
): Promise<boolean> {
  const target = tenantId.toString();
  const seen = new Set<string>();
  let current: mongoose.Types.ObjectId | undefined = userId;

  while (current) {
    const key = current.toString();
    if (key === target) return true;
    // Defensive: a cycle in userID links would otherwise spin forever.
    if (seen.has(key)) return false;
    seen.add(key);

    const doc: { userID?: mongoose.Types.ObjectId } | null = await User.findById(
      current
    )
      .select("userID")
      .lean();
    current = doc?.userID;
  }
  return false;
}
