import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user.model.js";

function isAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    if (
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPER_ADMIN
    ) {
      next();
      return;
    }
    res.status(403).json({
      success: false,
      message: "You do not have the authority to perform this action",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: errorMessage,
    });
  }
}

export default isAdmin;
