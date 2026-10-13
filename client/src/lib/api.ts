import axios from "axios";
import type { BlockSchema, ContentBlock, CV, User } from "./types";

const TOKEN_KEY = "folio_access_token";

export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); this.name = "ApiError"; }
}
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  timeout: 20000, headers: { "Content-Type": "application/json" },
});
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export function getToken() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("folio_user", JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("folio_user");
}
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("folio_user") || "null") as User | null; } catch { return null; }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const response = await http.request<T>({
      url: path, method: init.method || "GET",
      data: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
      signal: init.signal || undefined,
      headers: init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === "string" ? detail : Array.isArray(detail)
        ? detail.map((item: { msg?: string }) => item.msg || "Invalid input").join(". ")
        : error.response ? `Request failed (${error.response.status})` : "Unable to reach Folio. Check your connection and try again.";
      throw new ApiError(message, error.response?.status);
    }
    throw error;
  }
}

export const login = (email: string, password: string) => api<{ access_token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const register = (name: string, email: string, password: string) => api<{ access_token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
export const getSchemas = (signal?: AbortSignal) => api<BlockSchema[]>("/schemas", { signal });
export const getBlocks = (signal?: AbortSignal) => api<ContentBlock[]>("/blocks", { signal });
export const getCVs = (signal?: AbortSignal) => api<CV[]>("/cvs", { signal });
