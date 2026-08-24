import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { env } from "../config/env.js";
import type { UserRole } from "../models/user.model.js";

export interface TokenUserInput {
  _id: Types.ObjectId | string;
  email: string;
  role: UserRole;
}

export interface TokenOptions {
  /** jsonwebtoken duration string, e.g. "10m". Defaults to the normal 30d session. */
  expiresIn?: string;
  /** Set on session-switch tokens: the super admin who opened this session. */
  impersonatorId?: string;
}

export function generateToken(
  user: TokenUserInput,
  opts: TokenOptions = {}
): string {
  const payload = {
    id: typeof user._id === "string" ? user._id : user._id.toString(),
    email: user.email,
    role: user.role,
    ...(opts.impersonatorId ? { imp: opts.impersonatorId } : {}),
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (opts.expiresIn ?? "30d") as jwt.SignOptions["expiresIn"],
  });
}
