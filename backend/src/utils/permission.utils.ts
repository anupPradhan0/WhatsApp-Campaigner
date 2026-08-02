import type { IUser } from "../models/user.model.js";
import { isSuperAdmin } from "./role-hierarchy.utils.js";
import { ALL_PERMISSIONS, Permission } from "../constants/permissions.js";

type PermCarrier = Pick<IUser, "role" | "permissions">;

/** Every permission the user effectively holds (super admin → all of them). */
export function effectivePermissions(user: PermCarrier): Permission[] {
  if (isSuperAdmin(user.role)) return [...ALL_PERMISSIONS];
  return (user.permissions ?? []).filter((p): p is Permission =>
    (ALL_PERMISSIONS as string[]).includes(p)
  );
}

/** Whether the user holds a specific permission (super admin always does). */
export function hasPermission(user: PermCarrier, perm: Permission): boolean {
  return isSuperAdmin(user.role) || (user.permissions ?? []).includes(perm);
}
