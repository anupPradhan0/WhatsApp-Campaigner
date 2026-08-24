/**
 * Self-check for session-switch tokens: `pnpm --filter ./backend run check:token`
 * Guards the two things the 10-minute switch depends on — a short expiry and
 * the `imp` claim that marks (and caps) an impersonated session.
 */
import assert from "node:assert";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { generateToken } from "./generate-token.utils.js";
import { UserRole } from "../models/user.model.js";

const target = { _id: "507f1f77bcf86cd799439011", email: "u@x.com", role: UserRole.USER };
const decode = (t: string) => jwt.verify(t, env.JWT_SECRET) as jwt.JwtPayload;

const normal = decode(generateToken(target));
assert.equal(normal.imp, undefined, "a normal login must not look impersonated");
assert.ok(normal.exp! - normal.iat! > 29 * 24 * 3600, "normal session stays 30d");

const switched = decode(
  generateToken(target, { expiresIn: "10m", impersonatorId: "507f1f77bcf86cd799439099" })
);
assert.equal(switched.imp, "507f1f77bcf86cd799439099", "switch token records the super admin");
assert.equal(switched.exp! - switched.iat!, 600, "switch token expires in exactly 10 minutes");
assert.equal(switched.id, target._id, "switch token authenticates AS the target");
assert.equal(switched.role, UserRole.USER, "switch token carries the target's role");

console.log("OK: token self-check passed");
