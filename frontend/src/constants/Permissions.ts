// Grantable capabilities — must mirror the backend's constants/permissions.ts.
export const PERMISSIONS = [
  {
    key: 'actionButtons',
    label: 'Action Buttons',
    description: 'Add call & link buttons to WhatsApp campaigns.',
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]['key'];
