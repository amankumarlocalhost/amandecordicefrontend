import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { API_ORIGIN } from "../config";

// Server components only read PUBLIC catalog data here; nothing customer-specific is ever cached
// on the server. Customer data is fetched in the browser with the customer's own cookies.

const INTERNAL = (process.env.API_INTERNAL_URL || "").replace(/\/+$/, "") || API_ORIGIN;
const BASE = `${INTERNAL}/api/v1`;

export class ServerApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function qs(query) {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// 404 is a normal answer (unknown slug), returned as a value: errors thrown inside a `use cache`
// scope lose their custom fields when they cross the cache boundary.
async function rawGet(path, query) {
  const res = await fetch(`${BASE}${path}${qs(query)}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  const json = await res.json().catch(() => null);
  if (res.status === 404) return { data: null, meta: null, notFound: true };
  if (!res.ok || !json?.success) throw new ServerApiError(json?.message || `API ${res.status}`, res.status, json?.error?.code);
  return { data: json.data, meta: json.meta || null };
}

/**
 * Cache tags per backend path. The backend POSTs changed tags to /api/revalidate after an admin
 * publishes, so cached reads are invalidated immediately instead of waiting for cacheLife to expire.
 * Keep in sync with backend src/services/sync.js (TAGS).
 */
export function tagsFor(path) {
  const [, first, second] = path.split("?")[0].split("/");
  switch (first) {
    case "products":
    case "search":
      return second && second !== "facets" ? ["catalog", `product:${decodeURIComponent(second)}`] : ["catalog"];
    case "categories":
      return ["categories", "catalog"];
    case "collections":
      return ["collections", "catalog"];
    case "promotions":
    case "coupons":
      return ["promotions"];
    case "settings":
      return ["settings"];
    case "content":
      return [`content:${second}`];
    case "pages":
      return second ? ["pages", `page:${second}`] : ["pages"];
    default:
      return ["catalog"];
  }
}

// Cached for short periods. Errors are not cached, so a backend blip heals on the next request.
async function getCatalog(path, query) {
  "use cache";
  cacheLife("minutes");
  cacheTag(...tagsFor(path));
  return rawGet(path, query);
}

async function getSlow(path, query) {
  "use cache";
  cacheLife("hours");
  cacheTag(...tagsFor(path));
  return rawGet(path, query);
}

/**
 * Request-time read of public data. `connection()` keeps backend calls out of the build, so the app
 * builds and deploys independently of the API; the cache above still serves repeat requests.
 */
export async function getPublic(path, query, { fresh = false, slow = false } = {}) {
  await connection();
  if (fresh) return rawGet(path, query);
  return slow ? getSlow(path, query) : getCatalog(path, query);
}

/** Like getPublic but resolves to null instead of throwing (for optional homepage sections). */
export async function tryPublic(path, query, opts) {
  try {
    return await getPublic(path, query, opts);
  } catch {
    return null;
  }
}

export const getSettings = () => tryPublic("/settings/public", undefined, { slow: false });
export const getCategoryTree = () => tryPublic("/categories", undefined, { slow: true });

/** Published CMS block (homepage, footer, announcement, navigation) or null â€” callers fall back to built-in content. */
export async function getContent(key) {
  const r = await tryPublic(`/content/${key}`);
  return r?.data?.data || null;
}

/**
 * CMS block for statically rendered parts of the page (layout, homepage shell): cached and tagged
 * without a request-time dependency, so it is part of the prerendered shell and refreshed when the
 * backend revalidates `content:<key>`. Resolves to null on any failure (built-in content is shown).
 */
export async function getShellContent(key) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`content:${key}`);
  try {
    return (await rawGet(`/content/${key}`)).data?.data || null;
  } catch {
    return null;
  }
}

/** Published informational page (CMS) for the static shell; null when not published or on failure. */
export async function getShellPage(slug) {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages", `page:${slug}`);
  try {
    const r = await rawGet(`/pages/${encodeURIComponent(slug)}`);
    return r.notFound ? null : r.data;
  } catch {
    return null;
  }
}

/** Active category tree for the static shell (header/footer fallback menus); [] on failure. */
export async function getShellCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories", "catalog");
  try {
    return (await rawGet("/categories")).data || [];
  } catch {
    return [];
  }
}

/** Published pages flagged "Listed in footer" (for the layout); [] on failure. */
export async function getFooterPages() {
  "use cache";
  cacheLife("minutes");
  cacheTag("pages");
  try {
    return ((await rawGet("/pages")).data || []).filter((p) => p.showInFooter).map((p) => ({ label: p.title, href: `/pages/${p.slug}` }));
  } catch {
    return [];
  }
}

/** Draft page for an admin preview link; never cached. */
export async function getPagePreview(slug, token) {
  await connection();
  try {
    const r = await rawGet(`/pages/${encodeURIComponent(slug)}/preview`, { token });
    return r.notFound ? null : r.data;
  } catch {
    return null;
  }
}

/** Draft content for an admin preview link; never cached. */
export async function getContentPreview(key, token) {
  await connection();
  try {
    return (await rawGet(`/content/${key}/preview`, { token })).data?.data || null;
  } catch {
    return null;
  }
}
