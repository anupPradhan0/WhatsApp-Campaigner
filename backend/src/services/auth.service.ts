import type { Types } from "mongoose";
import type { IUser } from "../models/user.model.js";
import { UserRole, UserStatus } from "../models/user.model.js";
import {
  estimatedUserCount,
  findUserByEmail,
  findUserByEmailWithPassword,
  insertUser,
  updateUserById,
} from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../utils/hash-password.utils.js";
import { generateToken } from "../utils/generate-token.utils.js";
import type {
  BootstrapAdminBody,
  LoginBody,
  RegistrationBody,
  UpdateProfileBody,
} from "../validation/auth.schemas.js";

export async function registerUser(
  body: RegistrationBody,
  imagePath: string
): Promise<{ user: IUser; token: string }> {
  const existingUser = await findUserByEmail(body.email);
  if (existingUser) {
    const err = new Error("EMAIL_EXISTS") as Error & { code: string };
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const hashedPassword = await hashPassword(body.password);

  // Self-registration always creates a plain, zero-balance USER. Role and
  // balance are never taken from the request — privilege escalation guard.
  const user = await insertUser({
    companyName: body.companyName,
    email: body.email.toLowerCase().trim(),
    password: hashedPassword,
    number: body.number,
    image: imagePath,
    balance: 0,
    role: UserRole.USER,
  });

  const token = generateToken(user);

  return { user, token };
}

export async function loginUser(
  body: LoginBody
): Promise<{ user: IUser; token: string }> {
  const user = await findUserByEmailWithPassword(body.email);
  if (!user) {
    const err = new Error("INVALID_CREDENTIALS") as Error & { code: string };
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  if (user.status === UserStatus.INACTIVE) {
    const err = new Error("ACCOUNT_INACTIVE") as Error & { code: string };
    err.code = "ACCOUNT_INACTIVE";
    throw err;
  }

  if (user.status === UserStatus.DELETED) {
    const err = new Error("ACCOUNT_DELETED") as Error & { code: string };
    err.code = "ACCOUNT_DELETED";
    throw err;
  }

  const ok = await comparePassword(body.password, user.password);
  if (!ok) {
    const err = new Error("INVALID_CREDENTIALS") as Error & { code: string };
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  const token = generateToken(user);

  return { user, token };
}

export async function getBootstrapStatus(): Promise<{ hasUsers: boolean }> {
  const count = await estimatedUserCount();
  return { hasUsers: count > 0 };
}

export async function bootstrapAdmin(
  body: BootstrapAdminBody,
  imagePath: string
): Promise<{ user: IUser; token: string }> {
  const userCount = await estimatedUserCount();
  if (userCount > 0) {
    const err = new Error("BOOTSTRAP_DISABLED") as Error & { code: string };
    err.code = "BOOTSTRAP_DISABLED";
    throw err;
  }

  const existingUser = await findUserByEmail(body.email);
  if (existingUser) {
    const err = new Error("EMAIL_EXISTS") as Error & { code: string };
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await insertUser({
    companyName: body.companyName,
    email: body.email.toLowerCase().trim(),
    password: hashedPassword,
    number: body.number,
    image: imagePath,
    balance: 0,
    role: UserRole.ADMIN,
  });

  const token = generateToken(user);

  return { user, token };
}

export async function updateUserProfile(
  userId: Types.ObjectId,
  body: UpdateProfileBody,
  imagePath: string | undefined
): Promise<IUser> {
  const updatedData: Partial<IUser> = {};
  if (body.companyName !== undefined) {
    updatedData.companyName = body.companyName;
  }
  if (body.email !== undefined) {
    updatedData.email = body.email;
  }
  if (body.number !== undefined) {
    updatedData.number = body.number;
  }
  const image = imagePath ?? body.imageUrl;
  if (image !== undefined && image !== "") {
    updatedData.image = image;
  }

  const updated = await updateUserById(userId, updatedData);
  if (!updated) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  return updated;
}
