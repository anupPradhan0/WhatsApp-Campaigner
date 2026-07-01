import mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import { UserRole, UserStatus } from "../models/user.model.js";
import {
  findUserByEmail,
  findUserById,
  findUserByNumber,
  insertUser,
  saveUser,
  updateUserById,
} from "../repositories/user.repository.js";
import { hashPassword } from "../utils/hash-password.utils.js";
import { creditBalanceService } from "./transaction.service.js";
import {
  canCreateRole,
  canManageAccounts,
  isSuperAdmin,
} from "../utils/role-hierarchy.utils.js";

/**
 * Authorize a manager acting on a target account (delete / freeze / update / …).
 * Super admin (God mode) may act on anyone except another super admin. Admins
 * and resellers may only act on accounts in their own direct downline. Throws a
 * coded error otherwise.
 */
function ensureManageable(actor: IUser, target: IUser): void {
  if (target._id.toString() === actor._id.toString()) {
    // Acting on your own account is handled by the dedicated self-service flows.
    const err = new Error("CANNOT_TARGET_SELF") as Error & { code: string };
    err.code = "CANNOT_TARGET_SELF";
    throw err;
  }

  if (isSuperAdmin(actor.role)) {
    if (target.role === UserRole.SUPER_ADMIN) {
      const err = new Error("CANNOT_TARGET_SUPER_ADMIN") as Error & {
        code: string;
      };
      err.code = "CANNOT_TARGET_SUPER_ADMIN";
      throw err;
    }
    return;
  }

  const targetId = target._id.toString();
  const inDownline =
    actor.allAdmin?.some((id) => id.toString() === targetId) ||
    actor.allReseller?.some((id) => id.toString() === targetId) ||
    actor.allUsers?.some((id) => id.toString() === targetId);

  if (!inDownline) {
    const err = new Error("NOT_YOUR_USER") as Error & { code: string };
    err.code = "NOT_YOUR_USER";
    throw err;
  }
}
import type {
  ChangeOwnPasswordBody,
  ChangePasswordBody,
  CreateUserBody,
  UpdateUserBody,
} from "../validation/user.schemas.js";

export async function createManagedUser(
  creatorId: mongoose.Types.ObjectId,
  body: CreateUserBody,
  imagePath: string
): Promise<IUser> {
  const existingEmail = await findUserByEmail(body.email);
  if (existingEmail) {
    const err = new Error("EMAIL_EXISTS") as Error & { code: string };
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const existingNumber = await findUserByNumber(body.number);
  if (existingNumber) {
    const err = new Error("NUMBER_EXISTS") as Error & { code: string };
    err.code = "NUMBER_EXISTS";
    throw err;
  }

  const creator = await findUserById(creatorId);
  if (!creator || !canManageAccounts(creator.role)) {
    const err = new Error("FORBIDDEN_ROLE") as Error & { code: string };
    err.code = "FORBIDDEN_ROLE";
    throw err;
  }

  // Enforce the multi-tenant hierarchy: a creator may only assign roles strictly
  // below their own (super_admin → admin → reseller → user). super_admin itself
  // can never be created here — it is bootstrap-only.
  const targetRole = body.role ?? UserRole.USER;
  if (!canCreateRole(creator.role, targetRole)) {
    const err = new Error("ROLE_NOT_ALLOWED") as Error & { code: string };
    err.code = "ROLE_NOT_ALLOWED";
    throw err;
  }

  const hashedPassword = await hashPassword(body.password);

  // Non-super-admins fund a new account's opening balance out of their own
  // wallet. Reject up front so we never create an account we then can't fund.
  const initialBalance = body.balance ?? 0;
  if (
    !isSuperAdmin(creator.role) &&
    initialBalance > 0 &&
    creator.balance < initialBalance
  ) {
    const err = new Error("INSUFFICIENT_BALANCE") as Error & { code: string };
    err.code = "INSUFFICIENT_BALANCE";
    throw err;
  }

  // Create the account with a zero balance; the opening balance is then moved in
  // via the shared credit flow so the creator's wallet is actually debited
  // (except the super admin, who mints) and a proper ledger entry is recorded.
  const newUser = await insertUser({
    companyName: body.companyName,
    email: body.email.toLowerCase().trim(),
    password: hashedPassword,
    number: body.number,
    image: imagePath,
    balance: 0,
    userID: creatorId,
    role: targetRole,
    status: UserStatus.ACTIVE,
  });

  if (targetRole === UserRole.ADMIN) {
    creator.allAdmin.push(newUser._id as mongoose.Types.ObjectId);
  } else if (targetRole === UserRole.RESELLER) {
    creator.allReseller.push(newUser._id as mongoose.Types.ObjectId);
  } else if (targetRole === UserRole.USER) {
    creator.allUsers.push(newUser._id as mongoose.Types.ObjectId);
  }

  // Persist the downline link first: the credit flow re-reads the creator and
  // verifies it manages the new account before moving funds.
  await saveUser(creator);

  if (initialBalance > 0) {
    await creditBalanceService(
      creatorId.toString(),
      (newUser._id as mongoose.Types.ObjectId).toString(),
      initialBalance
    );
    // Reflect the funded balance on the returned document.
    newUser.balance = initialBalance;
  }

  return newUser;
}

export async function softDeleteUser(
  actorId: mongoose.Types.ObjectId,
  targetUserId: string
): Promise<void> {
  const admin = await findUserById(actorId);
  if (!admin || !canManageAccounts(admin.role)) {
    const err = new Error("FORBIDDEN_ROLE") as Error & { code: string };
    err.code = "FORBIDDEN_ROLE";
    throw err;
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  ensureManageable(admin, user);

  if (user.status === UserStatus.DELETED) {
    const err = new Error("ALREADY_DELETED") as Error & { code: string };
    err.code = "ALREADY_DELETED";
    throw err;
  }

  user.status = UserStatus.DELETED;
  user.deletedAt = new Date();
  await saveUser(user);
}

export async function freezeUserAccount(
  actorId: mongoose.Types.ObjectId,
  targetUserId: string
): Promise<void> {
  const admin = await findUserById(actorId);
  if (!admin || !canManageAccounts(admin.role)) {
    const err = new Error("FORBIDDEN_FREEZE") as Error & { code: string };
    err.code = "FORBIDDEN_FREEZE";
    throw err;
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  ensureManageable(admin, user);

  if (user.status !== UserStatus.ACTIVE) {
    const err = new Error("NOT_ACTIVE") as Error & { code: string };
    err.code = "NOT_ACTIVE";
    throw err;
  }

  user.status = UserStatus.INACTIVE;
  await saveUser(user);
}

export async function unfreezeUserAccount(
  actorId: mongoose.Types.ObjectId,
  targetUserId: string
): Promise<void> {
  const admin = await findUserById(actorId);
  if (!admin || !canManageAccounts(admin.role)) {
    const err = new Error("FORBIDDEN_UNFREEZE") as Error & { code: string };
    err.code = "FORBIDDEN_UNFREEZE";
    throw err;
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  ensureManageable(admin, user);

  user.status = UserStatus.ACTIVE;
  await saveUser(user);
}

export async function updateManagedUser(
  authenticatedUser: IUser,
  targetUserId: string,
  body: UpdateUserBody
): Promise<IUser> {
  const isOwner = authenticatedUser._id.toString() === targetUserId;

  // Owners may edit their own profile. Anyone editing someone else must be a
  // manager AND have the target in their downline (super admin: anyone but
  // another super admin).
  if (!isOwner) {
    if (!canManageAccounts(authenticatedUser.role)) {
      const err = new Error("FORBIDDEN_UPDATE") as Error & { code: string };
      err.code = "FORBIDDEN_UPDATE";
      throw err;
    }
    const target = await findUserById(targetUserId);
    if (!target) {
      const err = new Error("USER_NOT_FOUND") as Error & { code: string };
      err.code = "USER_NOT_FOUND";
      throw err;
    }
    ensureManageable(authenticatedUser, target);
  }

  const updateFields: Record<string, string | number> = {};
  if (body.companyName !== undefined) {
    updateFields.companyName = body.companyName;
  }
  if (body.email !== undefined) {
    updateFields.email = body.email;
  }
  if (body.number !== undefined) {
    updateFields.number = body.number;
  }

  if (Object.keys(updateFields).length === 0) {
    const err = new Error("NO_FIELDS") as Error & { code: string };
    err.code = "NO_FIELDS";
    throw err;
  }

  try {
    const updatedUser = await updateUserById(targetUserId, {
      $set: updateFields,
    });
    if (!updatedUser) {
      const err = new Error("USER_NOT_FOUND") as Error & { code: string };
      err.code = "USER_NOT_FOUND";
      throw err;
    }
    return updatedUser;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      const err = new Error("DUPLICATE_EMAIL") as Error & { code: string };
      err.code = "DUPLICATE_EMAIL";
      throw err;
    }
    throw error;
  }
}

export async function changeUserPasswordByAdmin(
  currentUserId: mongoose.Types.ObjectId,
  targetUserId: string,
  body: ChangePasswordBody
): Promise<IUser> {
  if (body.password !== body.confirmPassword) {
    const err = new Error("PASSWORD_MISMATCH") as Error & { code: string };
    err.code = "PASSWORD_MISMATCH";
    throw err;
  }

  const currentUser = await findUserById(currentUserId);
  if (!currentUser) {
    const err = new Error("AUTH_USER_NOT_FOUND") as Error & { code: string };
    err.code = "AUTH_USER_NOT_FOUND";
    throw err;
  }

  if (!canManageAccounts(currentUser.role)) {
    const err = new Error("FORBIDDEN_PASSWORD") as Error & { code: string };
    err.code = "FORBIDDEN_PASSWORD";
    throw err;
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // A super admin's password can only be changed through the self-service
  // change-own-password flow, never via this admin-reset path.
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    const err = new Error("CANNOT_CHANGE_ADMIN_PW") as Error & { code: string };
    err.code = "CANNOT_CHANGE_ADMIN_PW";
    throw err;
  }

  // Super admin (God mode) may reset any non-super-admin password, including
  // admins. Admins and resellers may only reset accounts in their own downline.
  ensureManageable(currentUser, targetUser);

  targetUser.password = await hashPassword(body.password);
  await saveUser(targetUser);

  return targetUser;
}

export async function changeOwnPassword(
  userId: mongoose.Types.ObjectId,
  body: ChangeOwnPasswordBody
): Promise<void> {
  if (body.newPassword !== body.confirmPassword) {
    const err = new Error("PASSWORD_MISMATCH") as Error & { code: string };
    err.code = "PASSWORD_MISMATCH";
    throw err;
  }

  const user = await findUserById(userId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  user.password = await hashPassword(body.newPassword);
  await saveUser(user);
}
