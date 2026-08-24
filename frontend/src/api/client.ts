import axios, { AxiosError } from "axios";
import { exitImpersonation, isImpersonating } from "../utils/Auth";

/**
 * Shared Axios instance for the WhatsApp Campaigner backend.
 * - Uses a RELATIVE base: /api is proxied to Express on the same origin, both
 *   in dev (vite proxy) and in production (nginx). No CORS, first-party cookie.
 * - Sends cookies (`withCredentials`) for httpOnly session cookies.
 * - Attaches `Authorization: Bearer <token>` from localStorage.
 * - On 401, clears auth and redirects to login (handled once globally).
 */
export const api = axios.create({
  withCredentials: true,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let redirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      // A switched session that expired: restore the super admin instead of
      // dumping them at the login page.
      if (isImpersonating()) {
        void exitImpersonation().then(() => window.location.assign("/dashboard"));
        return Promise.reject(error);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const onLogin = window.location.pathname === "/";
      if (!onLogin && !redirecting) {
        redirecting = true;
        window.location.assign("/");
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Pull a human-readable message off any thrown error (axios or otherwise).
 */
export const getErrorMessage = (err: unknown, fallback = "Network error. Please try again."): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: string[] } | undefined;
    if (data?.errors?.length) return String(data.errors[0]);
    if (data?.message) return String(data.message);
    if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export default api;
