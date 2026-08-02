/**
 * Grantable capabilities. A permission is held by a user only if it is present
 * in their `permissions` array — EXCEPT the super admin, who implicitly holds
 * all of them. The enforced invariant is: a user's permissions are always a
 * subset of their parent's, so you can only grant what you yourself have.
 */
export enum Permission {
  ACTION_BUTTONS = "actionButtons",
}

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.ACTION_BUTTONS]: "Action Buttons",
};

export function isValidPermission(p: string): p is Permission {
  return (ALL_PERMISSIONS as string[]).includes(p);
}
