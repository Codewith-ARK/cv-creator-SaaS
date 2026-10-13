const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "folio_access_token";
export type User = { id: number; email: string; name: string; role: "client" | "admin" };
export type Field = { key: string; label: string; type: "text" | "textarea" | "date" | "url" | "email" | "list"; required: boolean; placeholder?: string };
export type Schema = { key: string; label: string; description: string; icon: string; active: boolean; fields: Field[]; version: number };
export type Stats = { users: number; cvs: number; blocks: number; schemas: number };
export function getToken() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
export function setSession(token: string, user: User) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem("folio_user", JSON.stringify(user)); }
export function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem("folio_user"); }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken(); const res = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Request failed (${res.status})`); }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export const login = (email: string, password: string) => api<{ access_token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
