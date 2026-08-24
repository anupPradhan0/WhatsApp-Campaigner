import { jwtDecode } from 'jwt-decode';
import { UserRole } from '../constants/Roles';

interface StoredUser {
  email: string;
  role: string;
  permissions?: string[];
}

interface JwtPayload {
  exp?: number;
}

export const getUserRole = (): UserRole | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user: StoredUser = JSON.parse(userStr);
    return user.role as UserRole;
  } catch {
    return null;
  }
};

export const hasPermission = (perm: string): boolean => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  try {
    const user: StoredUser = JSON.parse(userStr);
    if (user.role === UserRole.SUPER_ADMIN) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(perm);
  } catch {
    return false;
  }
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(IMPERSONATION_KEY);
};

/* ---------- Super-admin session switch ---------- */

const IMPERSONATION_KEY = 'impersonation';

export interface Impersonation {
  /** The super admin's own token and stored user, kept so we can hand it back. */
  originalToken: string;
  originalUser: string;
  /** Epoch ms when the switched session expires on the server. */
  expiresAt: number;
  /** Who we are currently signed in as, for the banner. */
  asName: string;
  asRole: string;
}

export const getImpersonation = (): Impersonation | null => {
  const raw = localStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Impersonation;
  } catch {
    localStorage.removeItem(IMPERSONATION_KEY);
    return null;
  }
};

export const isImpersonating = (): boolean => getImpersonation() !== null;

/** Swap the stored session for the target account, remembering our own. */
export const beginImpersonation = (
  target: { token: string; user: unknown; expiresAt: number; name: string; role: string },
): void => {
  const state: Impersonation = {
    originalToken: localStorage.getItem('token') ?? '',
    originalUser: localStorage.getItem('user') ?? '',
    expiresAt: target.expiresAt,
    asName: target.name,
    asRole: target.role,
  };
  localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(state));
  localStorage.setItem('token', target.token);
  localStorage.setItem('user', JSON.stringify(target.user));
};

/**
 * Put the super admin back in their own account. Restores localStorage first
 * so it works even if the server call fails, then asks the server to swap the
 * httpOnly cookie back. Authenticates with the super admin's own token, so it
 * still works after the 10-minute switch token has expired.
 *
 * Uses fetch rather than the shared axios client to avoid an import cycle
 * (client -> Auth -> client) and to bypass the 401 interceptor.
 */
export const exitImpersonation = async (): Promise<boolean> => {
  const state = getImpersonation();
  if (!state) return false;

  localStorage.removeItem(IMPERSONATION_KEY);
  localStorage.setItem('token', state.originalToken);
  localStorage.setItem('user', state.originalUser);

  try {
    const res = await fetch('/api/auth/impersonate/stop', {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${state.originalToken}` },
    });
    const data = await res.json();
    if (res.ok && data?.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  } catch {
    /* cookie stays stale; the restored Bearer token still authenticates */
  }
  return true;
};

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    if (exp && exp * 1000 < Date.now()) {
      clearAuth();
      return false;
    }
    return true;
  } catch {
    clearAuth();
    return false;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};
