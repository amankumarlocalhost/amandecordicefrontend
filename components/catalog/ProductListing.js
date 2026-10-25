import Link from "next/link";
import { getPublic, tryPublic } from "@/lib/api/server";
import { PAGE_SIZE, TOGGLES, toApiQuery, toSearch } from "@/lib/catalogQuery";
import { humanize, materialLabel } from "@/lib/format";
import ProductCard, { ProductCardSkeleton } from "@/components/product/ProductCard";
import { EmptyState, ErrorState } from "@/components/ui/bits";
import Icon from "@/components/ui/Icon";
import { FilterSidebar, Toolbar } from "./Filters";

function buildChips(f) {
  const chips = [];
  const without = (patch) => ({ ...f, ...patch });
  for (const k of ["material", "color", "pattern", "brand"]) {
    for (const v of f[k] || []) chips.push({ key: `${k}:${v}`, label: k === "material" ? materialLabel(v) : humanize(v), remove: without({ [k]: f[k].filter((x) => x !== v) }) });
  }
  if (f.minPrice !== undefined || f.maxPrice !== undefined) chips.push({ key: "price", label: `₹${f.minPrice ?? 0} – ${f.maxPrice !== undefined ? `₹${f.maxPrice}` : "any"}`, remove: without({ minPrice: undefined, maxPrice: undefined }) });
  if (f.minCapacityMl !== undefined || f.maxCapacityMl !== undefined) chips.push({ key: "cap", label: `${f.minCapacityMl ?? 0}–${f.maxCapacityMl ?? "∞"} ml`, remove: without({ minCapacityMl: undefined, maxCapacityMl: undefined }) });
  if (f.setSize) chips.push({ key: "set", label: `${f.setSize} pcs`, remove: without({ setSize: undefined }) });
  if (f.serves) chips.push({ key: "serves", label: `Serves ${f.serves}+`, remove: without({ serves: undefined }) });
  for (const t of TOGGLES) if (f[t.key]) chips.push({ key: t.key, label: t.label, remove: without({ [t.key]: undefined }) });
  return chips;
}

function Pagination({ meta, filters, basePath }) {
  if (!meta || meta.totalPages <= 1) return null;
  const cur = meta.page;
  const pages = [];
  for (let p = 1; p <= meta.totalPages; p++) if (p === 1 || p === meta.totalPages || Math.abs(p - cur) <= 1) pages.push(p);
  const href = (p) => `${basePath}${toSearch({ ...filters, page: p })}`;
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {cur > 1 ? (
        <Link href={href(cur - 1)} className="flex h-10 w-10 items-center justify-center border border-line hover:border-ink" aria-label="Previous page">
          <Icon name="chevronLeft" size={16} />
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="px-1 text-muted">…</span> : null}
          <Link href={href(p)} aria-current={p === cur ? "page" : undefined} className={`flex h-10 min-w-10 items-center justify-center border px-3 text-sm ${p === cur ? "border-olive-900 bg-olive-900 text-cream-50" : "border-line hover:border-ink"}`}>
            {p}
          </Link>
        </span>
      ))}
      {cur < meta.totalPages ? (
        <Link href={href(cur + 1)} className="flex h-10 w-10 items-center justify-center border border-line hover:border-ink" aria-label="Next page">
          <Icon name="chevronRight" size={16} />
        </Link>
      ) : null}
    </nav>
  );
}

/**
 * Server-rendered listing. `base` pins the category/collection for category and collection pages.
 * Products are read fresh (the API caches for 60 s itself); facets are cached for a few minutes.
 */
export default async function ProductListing({ filters, base = {}, basePath, aside = null }) {
  const query = toApiQuery(filters, base);
  const facetQuery = { q: filters.q, category: base.category || filters.category, collection: base.collection };
  const [listResult, facets] = await Promise.all([getPublic("/products", query, { fresh: true }).then((v) => ({ v }), (e) => ({ e })), tryPublic("/products/facets", facetQuery)]);
  const products = listResult.v || null;
  const error = listResult.e || null;

  const chips = buildChips(filters);
  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden lg:block" aria-label="Filters">
        {aside}
        <FilterSidebar filters={filters} facets={facets?.data} basePath={basePath} />
      </aside>
      <div>
        <Toolbar filters={filters} facets={facets?.data} basePath={basePath} total={products?.meta?.total ?? 0} chips={chips} />
        {error || !products ? (
          <ErrorState title="We couldn't load products" message={error?.status === 400 ? "Some filters aren't valid. Try clearing them." : "Please refresh the page in a moment."} />
        ) : !products.data.length ? (
          <EmptyState icon="search" title={filters.q ? `No results for “${filters.q}”` : chips.length ? "Nothing matches these filters" : "New pieces arriving soon"} action={chips.length ? <Link href={`${basePath}${toSearch(filters.q ? { q: filters.q } : {})}`} className="btn btn-outline">Clear filters</Link> : <Link href="/shop" className="btn btn-primary">Browse all products</Link>}>
            {filters.q ? "Try a broader term like “plates”, “glass” or “vase”, or check the spelling." : chips.length ? "Try removing a filter or two." : "There's nothing here just yet — explore the rest of the collection in the meantime."}
          </EmptyState>
        ) : (
          <>
            <h2 className="sr-only">Products</h2>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {products.data.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} preload={i < 2 && (products.meta?.page || 1) === 1} sizes="(min-width:1280px) 20vw, (min-width:768px) 28vw, 46vw" />
                </li>
              ))}
            </ul>
            <Pagination meta={products.meta} filters={filters} basePath={basePath} />
          </>
        )}
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12" aria-busy="true" aria-label="Loading products">
      <div className="hidden space-y-4 lg:block">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div>
        <div className="skeleton h-10 w-full" />
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: Math.min(PAGE_SIZE, 8) }, (_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
