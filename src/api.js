import { auth } from "./firebase";
import { getSession, setTokens, clearSession } from "./session";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let refreshInFlight = null;

/** Renews the saved login (one request at a time). Clears it if the backend refuses. */
function refreshTokens(refreshToken) {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(BASE + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        clearSession();
        throw new ApiError("Session expired", res.status);
      }
      return setTokens(data);
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** The saved login first (renewed when old), then the Firebase login as a backup. */
async function getToken() {
  const s = getSession();
  if (s) {
    if (s.expiresAt - 60000 > Date.now()) return s.idToken;
    try {
      const r = await refreshTokens(s.refreshToken);
      if (r) return r.idToken;
    } catch {
      // fall through to the Firebase token
    }
  }
  return (await auth.currentUser?.getIdToken()) || null;
}

/** Calls the JuanWise backend. Sends the login token automatically. */
export async function api(path, { method = "GET", body, auth: useAuth = true, _retry = true } = {}) {
  if (!BASE) throw new Error("VITE_API_URL is missing in .env - add it and restart npm run dev");

  const headers = { "Content-Type": "application/json" };
  if (useAuth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // The token was refused: renew the saved login once and try again.
  if (res.status === 401 && useAuth && _retry && getSession()) {
    try {
      const r = await refreshTokens(getSession().refreshToken);
      if (r) return api(path, { method, body, auth: useAuth, _retry: false });
    } catch {
      // fall through to the original 401
    }
  }

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