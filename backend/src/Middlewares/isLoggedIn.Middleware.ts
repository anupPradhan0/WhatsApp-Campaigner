import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../Models/user.Model.js';
import type { IUser } from '../Models/user.Model.js';

const { JsonWebTokenError, TokenExpiredError } = jwt;

interface DecodedJwtPayload {
  id: string;
  email: string;
}

const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("🔴 FATAL ERROR: JWT_SECRET is not defined in environment variables.");
        process.exit(1); 
    }

    try {
        const authHeader = req.headers.authorization;
        const headerToken = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : undefined;
        const token = headerToken || req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: `"Access denied. No token provided."` });
        }
        
        const decoded = jwt.verify(token, secret) as DecodedJwtPayload;

        let user: any = null;
        
        user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Authorization failed: User not found." });
        }

        req.user = user;
        next();
        
    } catch (error: any) {
        if (error instanceof TokenExpiredError) {
            return res.status(401).json({ success: false, message: "Access denied. Token has expired." });
        }
        if (error instanceof JsonWebTokenError) {
            return res.status(401).json({ success: false, message: "Access denied. Token is invalid." });
        }
        
        console.error("Error in isLoggedIn middleware:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export default isLoggedIn;
