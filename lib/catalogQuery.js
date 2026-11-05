// URL <-> API query mapping for product listings. Filtering, sorting and pagination all happen in the
// backend (GET /products); the browser never downloads the catalogue to filter it.

export const PAGE_SIZE = 24;

export const SORTS = [
  { value: "relevance", label: "Featured" },
  { value: "popularity", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Biggest discount" },
];

export const TOGGLES = [
  { key: "inStock", label: "In stock only" },
  { key: "discounted", label: "On sale" },
  { key: "newArrival", label: "New arrivals" },
  { key: "bestseller", label: "Best sellers" },
  { key: "microwaveSafe", label: "Microwave safe (verified)" },
  { key: "dishwasherSafe", label: "Dishwasher safe (verified)" },
  { key: "giftWrap", label: "Gift wrap available" },
];

const LIST_KEYS = ["brand", "material", "color", "pattern"];
const NUM_KEYS = ["minCapacityMl", "maxCapacityMl", "setSize", "serves"];

const one = (v) => (Array.isArray(v) ? v[0] : v);
const str = (v) => (typeof v === "string" ? v.trim() : "");

/** Normalises Next's searchParams object into the filter state used by the UI. */
export function parseFilters(sp = {}) {
  const f = {};
  const q = str(one(sp.q));
  if (q) f.q = q.slice(0, 100);
  if (str(one(sp.category))) f.category = str(one(sp.category)).slice(0, 120);
  for (const k of LIST_KEYS) {
    const v = str(one(sp[k]));
    if (v) f[k] = v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  }
  for (const k of ["minPrice", "maxPrice", ...NUM_KEYS]) {
    const n = Number(one(sp[k]));
    if (Number.isFinite(n) && n >= 0 && str(one(sp[k])) !== "") f[k] = Math.floor(n);
  }
  for (const t of TOGGLES) if (one(sp[t.key]) === "true") f[t.key] = true;
  const sort = str(one(sp.sort));
  if (SORTS.some((s) => s.value === sort)) f.sort = sort;
  const page = parseInt(one(sp.page), 10);
  if (page > 1 && page < 10000) f.page = page;
  return f;
}

/** Filter state → backend query (prices in the URL are rupees; the API uses paise). */
export function toApiQuery(f, base = {}) {
  const q = { ...base, page: f.page || 1, limit: PAGE_SIZE, sort: f.sort || (f.q ? "relevance" : base.sort || "relevance") };
  if (f.q) q.q = f.q;
  if (f.category && !base.category) q.category = f.category;
  for (const k of LIST_KEYS) if (f[k]?.length) q[k] = f[k].join(",");
  if (f.minPrice !== undefined) q.minPrice = f.minPrice * 100;
  if (f.maxPrice !== undefined) q.maxPrice = f.maxPrice * 100;
  for (const k of NUM_KEYS) if (f[k] !== undefined) q[k] = f[k];
  for (const t of TOGGLES) if (f[t.key]) q[t.key] = "true";
  return q;
}

/** Filter state → URL search string. */
export function toSearch(f) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === false || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (k === "page" && v <= 1) continue;
    p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(f) {
  return Object.keys(f).filter((k) => !["sort", "page", "q"].includes(k)).length;
}
