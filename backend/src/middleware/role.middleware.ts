import type { Request, Response, NextFunction } from "express";
import { canManageAccounts } from "../utils/role-hierarchy.utils.js";

function hasAuthority(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (canManageAccounts(req.user.role)) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: "You don't have the authority to perform this action",
  });
}

export default hasAuthority;
