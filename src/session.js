// Keeps the teacher signed in after a page refresh.
// Same idea as the main admin console: the login tokens from POST /auth/login are
// saved in the browser, and renewed through POST /auth/refresh when they expire.
const KEY = "juanwise_teacher_session_v1";

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // storage blocked: the login just will not survive a refresh
  }
}

let current = load();
const listeners = new Set();

function persist(next) {
  current = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // keep the in-memory session even if it cannot be saved
  }
  listeners.forEach((fn) => fn(current));
}

const expiryFrom = (expiresIn) => {
  const s = Number(expiresIn);
  return Date.now() + (Number.isFinite(s) && s > 0 ? s : 3600) * 1000;
};

export const getSession = () => current;

/** Calls fn(session) whenever the session is saved, renewed or cleared. */
export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Save the object returned by POST /auth/login. */
export function saveSession(session) {
  persist({
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    expiresAt: expiryFrom(session.expiresIn),
    uid: session.user?.uid ?? null,
  });
}

/** Save the new tokens returned by POST /auth/refresh. */
export function setTokens(tokens) {
  if (!current) return null;
  persist({
    ...current,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken,
    expiresAt: expiryFrom(tokens.expiresIn),
  });
  return current;
}

export const clearSession = () => persist(null);