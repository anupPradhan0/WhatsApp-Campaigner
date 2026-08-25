import type { Request, Response } from "express";
import type { IUser } from "../models/user.model.js";
import {
  clearDomain,
  domainState,
  setDomain,
  verifyDomain,
} from "../services/domain.service.js";

const ERRORS: Record<string, { status: number; message: string }> = {
  FORBIDDEN_DOMAIN: { status: 403, message: "Your account cannot run a white-label domain." },
  DOMAIN_TAKEN: { status: 409, message: "That domain is already in use." },
  DOMAIN_RESERVED: { status: 400, message: "That domain belongs to the platform." },
  NO_DOMAIN: { status: 400, message: "Add a domain before verifying it." },
  PLATFORM_DOMAIN_UNSET: { status: 500, message: "Platform domain is not configured." },
  CNAME_NOT_FOUND: { status: 400, message: "No CNAME record found for that domain yet. DNS can take a few minutes." },
  CNAME_MISMATCH: { status: 400, message: "The CNAME does not point at the platform." },
};

function respond(res: Response, error: unknown): Response {
  const code = (error as { code?: string })?.code ?? "";
  const known = ERRORS[code];
  if (known) {
    return res.status(known.status).json({ success: false, message: known.message });
  }
  console.error("Error in domain controller:", error);
  return res.status(500).json({ success: false, message: "An unknown error occurred" });
}

export async function getDomain(req: Request, res: Response): Promise<Response> {
  return res.status(200).json({ success: true, data: domainState(req.user as IUser) });
}

export async function putDomain(req: Request, res: Response): Promise<Response> {
  try {
    const { host } = req.body as { host: string };
    return res.status(200).json({
      success: true,
      message: "Domain saved. Point its CNAME at the platform, then verify.",
      data: await setDomain(req.user as IUser, host),
    });
  } catch (error: unknown) {
    return respond(res, error);
  }
}

export async function deleteDomain(req: Request, res: Response): Promise<Response> {
  try {
    return res.status(200).json({
      success: true,
      message: "Domain removed.",
      data: await clearDomain(req.user as IUser),
    });
  } catch (error: unknown) {
    return respond(res, error);
  }
}

export async function postVerifyDomain(req: Request, res: Response): Promise<Response> {
  try {
    const state = await verifyDomain(req.user as IUser);
    return res.status(200).json({
      success: true,
      message: state.routed
        ? "Domain verified and routed. The certificate is issued on first visit."
        : `Domain verified, but routing failed — add it in Dokploy. ${state.routingError ?? ""}`.trim(),
      data: state,
    });
  } catch (error: unknown) {
    return respond(res, error);
  }
}
