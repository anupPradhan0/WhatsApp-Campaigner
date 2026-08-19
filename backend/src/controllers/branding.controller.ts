import type { Request, Response } from "express";
import { findOneUser, UserStatus } from "../repositories/user.repository.js";

/**
 * Public white-label lookup, resolved from the Host header. Unknown hosts —
 * including the platform's own domain — get `null`, and the SPA keeps its
 * built-in branding. No auth: this runs before anyone has logged in.
 */
export async function getBranding(req: Request, res: Response): Promise<Response> {
  try {
    const tenant = await findOneUser({
      domain: req.hostname.toLowerCase(),
      status: UserStatus.ACTIVE,
    });

    return res.status(200).json({
      success: true,
      data: tenant
        ? {
            companyName: tenant.companyName,
            logo: tenant.image || "",
            brandColor: tenant.brandColor || "",
          }
        : null,
    });
  } catch (error: unknown) {
    // Branding must never break the login page — fall back to the defaults.
    console.error("Error resolving branding:", error);
    return res.status(200).json({ success: true, data: null });
  }
}
