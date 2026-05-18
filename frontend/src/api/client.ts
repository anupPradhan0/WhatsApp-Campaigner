import axios, { AxiosError } from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080";

/**
 * Shared Axios instance for the WhatsApp Campaigner backend.
 * - Sends cookies (`withCredentials`) for httpOnly session cookies.
 * - Attaches `Authorization: Bearer <token>` from localStorage.
 * - On 401, clears auth and redirects to login (handled once globally).
 */
export const api = axios.create({
  baseURL,
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
