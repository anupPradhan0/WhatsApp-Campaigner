import type { Request, Response } from "express";
import type { IUser } from "../models/user.model.js";
import { pathParam } from "../utils/route-params.utils.js";
import {
  changeOwnPassword,
  changeUserPasswordByAdmin,
  createManagedUser,
  freezeUserAccount,
  softDeleteUser,
  unfreezeUserAccount,
  updateManagedUser,
} from "../services/user.service.js";

function mapUserServiceError(err: unknown): { status: number; message: string } {
  const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
  switch (code) {
    case "EMAIL_EXISTS":
      return {
        status: 409,
        message: "An account with this email already exists.",
      };
    case "NUMBER_EXISTS":
      return {
        status: 409,
        message: "An account with this number already exists.",
      };
    case "FORBIDDEN_ROLE":
      return {
        status: 403,
        message: "Only admins and resellers can create users.",
      };
    case "ROLE_NOT_ALLOWED":
      return {
        status: 403,
        message: "You are not allowed to create an account with this role.",
      };
    case "FORBIDDEN_FREEZE":
      return {
        status: 403,
        message: "Only admins and Resellers can freeze/deactivate users.",
      };
    case "FORBIDDEN_UNFREEZE":
      return {
        status: 403,
        message: "Only admins and Resellers can unfreeze/activate users.",
      };
    case "FORBIDDEN_UPDATE":
      return {
        status: 403,
        message: "You are not authorized to update this user.",
      };
    case "FORBIDDEN_PASSWORD":
      return {
        status: 403,
        message: "Only admin and reseller can change passwords.",
      };
    case "USER_NOT_FOUND":
      return { status: 404, message: "User not found." };
    case "AUTH_USER_NOT_FOUND":
      return { status: 404, message: "Current user not found." };
    case "ALREADY_DELETED":
      return { status: 400, message: "User is already deleted." };
    case "NOT_ACTIVE":
      return { status: 400, message: "User is already inactive." };
    case "NO_FIELDS":
      return { status: 400, message: "No update information provided." };
    case "DUPLICATE_EMAIL":
      return { status: 409, message: "This email is already in use." };
    case "PASSWORD_MISMATCH":
      return { status: 400, message: "Passwords do not match." };
    case "CANNOT_CHANGE_ADMIN_PW":
      return {
        status: 403,
        message: "Cannot change another admin's password.",
      };
    case "NOT_YOUR_USER":
      return {
        status: 403,
        message:
          "You do not have permission to change this user's password. You can only change passwords of users you created.",
      };
    default:
      return {
        status: 500,
        message: "Internal server error during user operation.",
      };
  }
}

export async function createUser(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body = req.body as import("../validation/user.schemas.js").CreateUserBody;
    const image =
      req.file?.path ??
      (typeof body.imageUrl === "string" ? body.imageUrl : "") ??
      "";

    const newUser = await createManagedUser(req.user._id, body, image);

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        companyName: newUser.companyName,
        email: newUser.email,
        number: newUser.number,
        role: newUser.role,
        status: newUser.status,
        balance: newUser.balance,
        image: newUser.image,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const { status, message } = mapUserServiceError(error);
    return res.status(status).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userId = pathParam(req.params.userId);
    await softDeleteUser(req.user._id, userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    const { status, message } = mapUserServiceError(error);
    return res.status(status).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function freezeUser(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userId = pathParam(req.params.userId);
    await freezeUserAccount(req.user._id, userId);

    return res.status(200).json({
      success: true,
      message:
        "User frozen successfully. They cannot perform any actions.",
    });
  } catch (error: unknown) {
    console.error("Error freezing user:", error);
    const { status, message } = mapUserServiceError(error);
    return res.status(status).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function unfreezeUser(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userId = pathParam(req.params.userId);
    await unfreezeUserAccount(req.user._id, userId);

    return res.status(200).json({
      success: true,
      message: "User unfrozen successfully.",
    });
  } catch (error: unknown) {
    console.error("Error unfreezing user:", error);
    const { status, message } = mapUserServiceError(error);
    return res.status(status).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function updateUser(req: Request, res: Response): Promise<Response> {
  try {
    const userId = pathParam(req.params.userId);
    const authenticatedUser = req.user as IUser | undefined;

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body = req.body as import("../validation/user.schemas.js").UpdateUserBody;

    const updatedUser = await updateManagedUser(
      authenticatedUser,
      userId,
      body
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        id: updatedUser._id,
        companyName: updatedUser.companyName,
        email: updatedUser.email,
        number: updatedUser.number,
        role: updatedUser.role,
      },
    });
  } catch (error: unknown) {
    const { status, message } = mapUserServiceError(error);
    if (status !== 500) {
      return res.status(status).json({ success: false, message });
    }
    console.error("Error updating user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      success: false,
      message: "Error updating user",
      error: errorMessage,
    });
  }
}

export async function changePassword(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body =
      req.body as import("../validation/user.schemas.js").ChangePasswordBody;
    const userId = pathParam(req.params.userId);

    const targetUser = await changeUserPasswordByAdmin(
      req.user._id,
      userId,
      body
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: {
        userId: targetUser._id,
        companyName: targetUser.companyName,
        email: targetUser.email,
      },
    });
  } catch (error: unknown) {
    console.error("Error changing password:", error);
    const { status, message } = mapUserServiceError(error);
    return res.status(status).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function changeOwnPasswordHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body =
      req.body as import("../validation/user.schemas.js").ChangeOwnPasswordBody;

    await changeOwnPassword(req.user._id, body);

    return res.status(200).json({
      success: true,
      message: "Your password has been changed successfully.",
    });
  } catch (error: unknown) {
    console.error("Error changing own password:", error);
    const { status, message } = mapUserServiceError(error);
    return res.status(status).json({
      success: false,
      message,
      error: error instanceof Error ? error.message : undefined,
    });
  }
}
