// Browser API client for the Express backend.
//  - Auth is HttpOnly cookies (access_token, refresh_token), so every request uses credentials: "include".
//  - Unsafe requests carry X-CSRF-Token (signed double-submit; see backend middleware/security.js).
//  - A 401 triggers one deduplicated POST /auth/refresh and a single retry. Requests rejected with 401/403
//    were never processed, so retrying them is safe even for non-idempotent operations.
//  - Nothing is retried on network errors or 5xx: the caller decides (checkout uses idempotency keys).

import { API_BASE } from "../config";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_TIMEOUT = 20000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = "ERROR", details, requestId } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export const isAbort = (err) => err?.name === "AbortError" || err?.code === "ABORTED";

let csrfMemory = null;
let csrfPromise = null;
let refreshPromise = null;

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** The csrf cookie is readable when the API is on the same host; otherwise the token from the last auth response is used. */
async function getCsrf(force = false) {
  if (!force) {
    const fromCookie = readCookie("csrf_token");
    if (fromCookie) return fromCookie;
    if (csrfMemory) return csrfMemory;
  }
  csrfPromise ??= send("GET", "/auth/csrf", {})
    .then((r) => (csrfMemory = r.data?.csrfToken || null))
    .finally(() => {
      csrfPromise = null;
    });
  return csrfPromise;
}

export function rememberCsrf(token) {
  if (token) csrfMemory = token;
}

function buildUrl(path, query) {
  const url = new URL(API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
      url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
  }
  return url.toString();
}

function friendlyMessage(status, body) {
  if (body?.message) return body.message;
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  if (status === 404) return "Not found.";
  return "Request failed.";
}

async function send(method, path, { query, body, signal, headers = {}, timeout = DEFAULT_TIMEOUT, csrf } = {}) {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeout);
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const h = { Accept: "application/json", ...headers };
  if (body !== undefined && !isForm) h["Content-Type"] = "application/json";
  if (csrf) h["X-CSRF-Token"] = csrf;

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers: h,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (timedOut) throw new ApiError("The request timed out. Please check your connection and try again.", { code: "TIMEOUT" });
    if (signal?.aborted || err?.name === "AbortError") {
      const e = new ApiError("Request cancelled", { code: "ABORTED" });
      e.name = "AbortError";
      throw e;
    }
    throw new ApiError("We couldn't reach the store. Please check your internet connection.", { code: "NETWORK_ERROR" });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  let json = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok || json?.success === false) {
    throw new ApiError(friendlyMessage(res.status, json), {
      status: res.status,
      code: json?.error?.code || (res.status === 429 ? "RATE_LIMITED" : res.status === 401 ? "UNAUTHORIZED" : `HTTP_${res.status}`),
      details: json?.error?.details,
      requestId: json?.requestId || res.headers.get("x-request-id"),
    });
  }
  return json || { success: true, data: null };
}

async function refreshSession() {
  refreshPromise ??= (async () => {
    try {
      const r = await send("POST", "/auth/refresh", { csrf: await getCsrf() });
      rememberCsrf(r.data?.csrfToken);
      return true;
    } catch (err) {
      if (err.code === "CSRF_INVALID") {
        try {
          const r = await send("POST", "/auth/refresh", { csrf: await getCsrf(true) });
          rememberCsrf(r.data?.csrfToken);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * request(method, path, opts) → full envelope { success, message, data, meta }.
 * opts: { query, body, signal, headers, timeout, auth: false to skip the refresh-on-401 behaviour }
 */
export async function request(method, path, opts = {}) {
  const m = method.toUpperCase();
  const attempt = async (forceCsrf = false) => send(m, path, { ...opts, csrf: UNSAFE.has(m) ? await getCsrf(forceCsrf) : undefined });
  try {
    return await attempt();
  } catch (err) {
    if (err.code === "CSRF_INVALID") return attempt(true);
    const isAuthRoute = path.startsWith("/auth/");
    if (err.status === 401 && opts.auth !== false && !isAuthRoute) {
      if (await refreshSession()) return attempt();
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    throw err;
  }
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts = {}) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts = {}) => request("PATCH", path, { ...opts, body }),
  put: (path, body, opts = {}) => request("PUT", path, { ...opts, body }),
  del: (path, opts) => request("DELETE", path, opts),
  refreshSession,
};

export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
