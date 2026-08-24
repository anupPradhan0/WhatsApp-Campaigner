import type { Request, Response } from "express";
import { UserRole, UserStatus } from "../models/user.model.js";
import { findUserById } from "../repositories/user.repository.js";
import { setAuthCookie } from "../utils/cookie.utils.js";
import { generateToken } from "../utils/generate-token.utils.js";
import { effectivePermissions } from "../utils/permission.utils.js";
import { pathParam } from "../utils/route-params.utils.js";

/** A session switch lasts 10 minutes, then the token simply expires. */
export const IMPERSONATION_MINUTES = 10;
const IMPERSONATION_MS = IMPERSONATION_MINUTES * 60 * 1000;

/**
 * Super admin only: open a temporary session as another account.
 *
 * The issued token carries the target's id and role, so every existing role
 * and permission check downstream sees the target user — no special-casing
 * anywhere else — and it expires on its own after 10 minutes. The `imp` claim
 * records who opened the session, and blocks switching again from inside one.
 */
export async function startImpersonation(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const actor = req.user;
    if (!actor) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    if (actor.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only the super admin can switch sessions.",
      });
    }

    // No nesting: a switched session must not be able to open another one.
    if (req.impersonatorId) {
      return res.status(403).json({
        success: false,
        message:
          "You are already in a switched session. Exit it before starting another.",
      });
    }

    const targetId = pathParam(req.params.userId);
    if (!targetId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    if (targetId === actor._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are already signed in as this account.",
      });
    }

    const target = await findUserById(targetId, { select: "-password" });
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    if (target.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Super admin accounts cannot be switched into.",
      });
    }

    if (target.status === UserStatus.DELETED) {
      return res.status(403).json({
        success: false,
        message: "This account is deleted.",
      });
    }

    const token = generateToken(target, {
      expiresIn: `${IMPERSONATION_MINUTES}m`,
      impersonatorId: actor._id.toString(),
    });
    setAuthCookie(res, token, IMPERSONATION_MS);

    console.log(
      `[session-switch] ${actor.email} -> ${target.email} (${target.role}) for ${IMPERSONATION_MINUTES}m`
    );

    return res.status(200).json({
      success: true,
      message: `You are now signed in as ${target.companyName} for ${IMPERSONATION_MINUTES} minutes.`,
      token,
      expiresAt: Date.now() + IMPERSONATION_MS,
      user: {
        _id: target._id,
        email: target.email,
        role: target.role,
        companyName: target.companyName,
        image: target.image,
        permissions: effectivePermissions(target),
      },
    });
  } catch (error: unknown) {
    console.error("Error in startImpersonation controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
}

/**
 * End a session switch and hand the super admin their own session back.
 *
 * Authenticated with the super admin's own token (the client sends it in the
 * Authorization header), so this still works after the 10-minute switch token
 * has already expired.
 */
export async function stopImpersonation(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const actor = req.user;
    if (!actor) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    if (actor.role !== UserRole.SUPER_ADMIN || req.impersonatorId) {
      return res.status(403).json({
        success: false,
        message: "Only the super admin can end a switched session.",
      });
    }

    const token = generateToken(actor);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Back in your super admin account.",
      token,
      user: {
        _id: actor._id,
        email: actor.email,
        role: actor.role,
        companyName: actor.companyName,
        image: actor.image,
        permissions: effectivePermissions(actor),
      },
    });
  } catch (error: unknown) {
    console.error("Error in stopImpersonation controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
}
