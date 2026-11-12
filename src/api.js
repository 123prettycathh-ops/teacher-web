import { auth } from "./firebase";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Calls the JuanWise backend. Sends the Firebase login token automatically. */
export async function api(path, { method = "GET", body, auth: useAuth = true } = {}) {
  if (!BASE) throw new Error("VITE_API_URL is missing in .env - add it and restart npm run dev");

  const headers = { "Content-Type": "application/json" };
  if (useAuth) {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data;
}

/** The backend returns either an array or { items: [...] } - accept both. */
export const asList = (d) => (Array.isArray(d) ? d : d?.items ?? []);

/** Backend pack -> the shape the pages already use ("published" shown as "live"). */
export const toUiPack = (p) => ({
  ...p,
  status: p.status === "published" ? "live" : p.status,
  version: "v" + p.version,
});