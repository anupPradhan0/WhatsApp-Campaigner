import type { Request, Response } from "express";
import {
  bootstrapAdmin,
  getBootstrapStatus,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../services/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookie.utils.js";
import { generateToken } from "../utils/generate-token.utils.js";
import { revokeToken } from "../services/token-denylist.service.js";

function mapAuthError(err: unknown): { status: number; message: string } {
  if (!(err instanceof Error)) {
    return { status: 500, message: "An internal server error occurred." };
  }
  const code = (err as Error & { code?: string }).code;
  switch (code) {
    case "EMAIL_EXISTS":
      return {
        status: 409,
        message: "An account with this email already exists.",
      };
    case "INVALID_CREDENTIALS":
      return { status: 401, message: "Invalid email or password." };
    case "ACCOUNT_INACTIVE":
      return {
        status: 403,
        message:
          "Your account is Freeze. please contact your Admin or Reseller. They have the authority to unfreeze your account.",
      };
    case "ACCOUNT_DELETED":
      return {
        status: 403,
        message:
          "Your account is Deleted. please contact your Admin or Reseller. They have the authority to restore your account.",
      };
    case "BOOTSTRAP_DISABLED":
      return {
        status: 409,
        message: "Users already exist. Bootstrap is disabled.",
      };
    case "USER_NOT_FOUND":
      return { status: 404, message: "User not found." };
    default:
      return { status: 500, message: "An internal server error occurred." };
  }
}

export async function registration(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const body = req.body as import("../validation/auth.schemas.js").RegistrationBody;
    const image = req.file?.path ?? "";

    const { user, token } = await registerUser(body, image);

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        companyName: user.companyName,
        email: user.email,
        number: user.number,
        role: user.role,
        balance: user.balance,
        image: user.image,
        _id: user._id,
      },
    });
  } catch (error: unknown) {
    console.error("Error in Registration controller:", error);
    const { status, message } = mapAuthError(error);
    return res.status(status).json({ success: false, message });
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
  try {
    const body = req.body as import("../validation/auth.schemas.js").LoginBody;
    const { user, token } = await loginUser(body);

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token: generateToken(user),
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        image: user.image,
      },
    });
  } catch (error: unknown) {
    console.error("Error in Login controller:", error);
    const { status, message } = mapAuthError(error);
    return res.status(status).json({ success: false, message });
  }
}

export async function bootstrapStatus(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { hasUsers } = await getBootstrapStatus();
    return res.status(200).json({
      success: true,
      hasUsers,
    });
  } catch (error: unknown) {
    console.error("Error in BootstrapStatus controller:", error);
    return res.status(500).json({
      success: false,
      hasUsers: true,
    });
  }
}

export async function bootstrapAdminHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const body =
      req.body as import("../validation/auth.schemas.js").BootstrapAdminBody;
    const image = req.file?.path ?? "";

    const { user, token } = await bootstrapAdmin(body, image);

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Super admin account created successfully.",
      user: {
        companyName: user.companyName,
        email: user.email,
        number: user.number,
        role: user.role,
        balance: user.balance,
        image: user.image,
        _id: user._id,
      },
    });
  } catch (error: unknown) {
    console.error("Error in BootstrapAdmin controller:", error);
    const { status, message } = mapAuthError(error);
    return res.status(status).json({ success: false, message });
  }
}

export async function logout(req: Request, res: Response): Promise<Response> {
  try {
    // Pull the token from whichever source the request used (cookie or
    // Authorization header) and add it to the denylist. Best-effort —
    // if Redis is down, we still clear the cookie and 200 back.
    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;
    const token = headerToken || (req.cookies?.token as string | undefined);
    if (token) {
      await revokeToken(token);
    }

    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error: unknown) {
    console.error("Error in Logout controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
}

export async function updateProfile(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body =
      req.body as import("../validation/auth.schemas.js").UpdateProfileBody;
    const image = req.file?.path;

    const updatedUser = await updateUserProfile(user._id, body, image);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: updatedUser._id,
        companyName: updatedUser.companyName,
        email: updatedUser.email,
        image: updatedUser.image,
        number: updatedUser.number,
        role: updatedUser.role,
        balance: updatedUser.balance,
      },
    });
  } catch (error: unknown) {
    console.error("Error in updateProfile controller:", error);
    const { status, message } = mapAuthError(error);
    return res.status(status).json({ success: false, message });
  }
}
