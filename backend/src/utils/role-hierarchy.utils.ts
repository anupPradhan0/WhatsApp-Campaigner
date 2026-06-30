import { UserRole } from "../models/user.model.js";

/**
 * Multi-tenant role hierarchy (top → bottom):
 *   super_admin → admin → reseller → user
 *
 * A role may only create accounts strictly below it, and may only assign the
 * roles listed here. `super_admin` is intentionally NOT creatable by anyone via
 * the API — the single super admin is provisioned through the bootstrap flow.
 */
const CREATABLE_ROLES: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.RESELLER, UserRole.USER],
  [UserRole.ADMIN]: [UserRole.RESELLER, UserRole.USER],
  [UserRole.RESELLER]: [UserRole.USER],
  [UserRole.USER]: [],
};

/** Whether `creator` is allowed to create an account with role `target`. */
export function canCreateRole(creator: UserRole, target: UserRole): boolean {
  return CREATABLE_ROLES[creator]?.includes(target) ?? false;
}

/** Whether the role can manage (create/freeze/delete/update) other accounts. */
export function canManageAccounts(role: UserRole): boolean {
  return (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN ||
    role === UserRole.RESELLER
  );
}

/** The super admin sits at the top and has unrestricted, global visibility. */
export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}
