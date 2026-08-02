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
