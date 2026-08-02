import mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import User, { UserRole } from "../models/user.model.js";
import { isSuperAdmin } from "../utils/role-hierarchy.utils.js";
import { collectDownlineIds } from "../utils/downline.utils.js";
import { effectivePermissions } from "../utils/permission.utils.js";
import { isValidPermission } from "../constants/permissions.js";

const codeErr = (code: string): Error => {
  const e = new Error(code) as Error & { code: string };
  e.code = code;
  return e;
};

/**
 * Set a target account's permissions.
 *  - Actor must manage the target (target anywhere in the actor's downline; the
 *    super admin may act on anyone but another super admin).
 *  - Actor may only grant permissions they themselves hold — enforcing the
 *    invariant that a child's permissions are a subset of the parent's.
 *  - Any permission REMOVED from the target is also stripped from the target's
 *    entire subtree, so a descendant can never outlive a revoked ancestor perm.
 */
export async function setUserPermissions(
  actor: IUser,
  targetId: string,
  requested: string[]
): Promise<string[]> {
  // Drop unknown keys, de-dupe.
  const clean: string[] = Array.from(new Set(requested.filter(isValidPermission)));

  const target = await User.findById(targetId).select(
    "role permissions userID"
  );
  if (!target) throw codeErr("USER_NOT_FOUND");
  if (target._id.toString() === actor._id.toString())
    throw codeErr("CANNOT_TARGET_SELF");
  if (target.role === UserRole.SUPER_ADMIN)
    throw codeErr("CANNOT_TARGET_SUPER_ADMIN");

  if (!isSuperAdmin(actor.role)) {
    const downline = await collectDownlineIds(
      new mongoose.Types.ObjectId(actor._id)
    );
    if (!downline.some((id) => id.toString() === targetId))
      throw codeErr("NOT_YOUR_USER");
  }

  const parent = target.userID
    ? await User.findById(target.userID).select("role permissions")
    : null;
  const ceiling = new Set<string>(
    parent ? effectivePermissions(parent) : effectivePermissions(actor)
  );
  for (const p of clean) {
    if (!ceiling.has(p)) throw codeErr("PERMISSION_DENIED");
  }

  const before = new Set(target.permissions ?? []);
  const removed = [...before].filter((p) => !clean.includes(p));

  if (removed.length) {
    const subtree = await collectDownlineIds(
      new mongoose.Types.ObjectId(targetId)
    );
    if (subtree.length) {
      await User.updateMany(
        { _id: { $in: subtree } },
        { $pull: { permissions: { $in: removed } } }
      );
    }
  }

  target.permissions = clean;
  await target.save();

  return clean;
}
