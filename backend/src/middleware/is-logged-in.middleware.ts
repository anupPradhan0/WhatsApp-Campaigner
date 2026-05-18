import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { findUserById } from "../repositories/user.repository.js";
import { isTokenRevoked } from "../services/token-denylist.service.js";

const { JsonWebTokenError, TokenExpiredError } = jwt;

interface DecodedJwtPayload {
  id: string;
  email: string;
  role: string;
}

async function isLoggedIn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;
    const token = headerToken || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedJwtPayload;

    if (await isTokenRevoked(token)) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token has been revoked.",
      });
    }

    const user = await findUserById(decoded.id, { select: "-password" });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authorization failed: User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token has expired.",
      });
    }
    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is invalid.",
      });
    }
    console.error("Error in isLoggedIn middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export default isLoggedIn;
