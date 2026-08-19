import type { Response } from "express";
import { env } from "../config/env.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// The SPA and the API are served from the same origin (the reverse proxy
// forwards /api to Express), so the auth cookie is first-party and "lax"
// works. Never go back to "none" — browsers are dropping third-party cookies.
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
} as const;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, { ...COOKIE_OPTS, maxAge: THIRTY_DAYS_MS });
}

export function clearAuthCookie(res: Response): void {
  res.cookie("token", "", { ...COOKIE_OPTS, expires: new Date(0) });
}
