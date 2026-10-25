import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import ProductHero from "@/components/product/ProductHero";
import Reviews from "@/components/product/Reviews";
import ProductRail, { RailSkeleton } from "@/components/product/ProductRail";
import { Breadcrumbs, SectionHeading } from "@/components/ui/bits";
import { getPublic, tryPublic } from "@/lib/api/server";
import { dimensionsText, humanize, materialLabel } from "@/lib/format";
import { SITE_URL, STORE_NAME } from "@/lib/config";

// Live product (prices + per-variant stock): read fresh on every request.
async function loadProduct(slug) {
  return (await getPublic(`/products/${encodeURIComponent(slug)}`, undefined, { fresh: true })).data;
}

// Metadata only needs name/description/image, so a cached read is fine.
async function loadMeta(slug) {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", `product:${slug}`);
  const r = await fetch(`${(process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/+$/, "")}/api/v1/products/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
  const j = r?.ok ? await r.json().catch(() => null) : null;
  return j?.data ? { name: j.data.name, description: j.data.seo?.description || j.data.description, title: j.data.seo?.title, image: j.data.images?.[0]?.url } : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const m = await loadMeta(slug);
  if (!m) return { title: "Product" };
  return {
    title: m.title || m.name,
    description: m.description?.slice(0, 170),
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: m.name, description: m.description?.slice(0, 170), images: m.image ? [{ url: m.image }] : undefined },
  };
}

const CARE_LABELS = { foodSafe: "Food safe", dishwasherSafe: "Dishwasher safe", microwaveSafe: "Microwave safe", ovenSafe: "Oven safe", freezerSafe: "Freezer safe" };

function Details({ p, policy }) {
  const s = p.specs || {};
  const rows = [
    ["Material", s.material && materialLabel(s.material)],
    ["Other materials", s.materials?.length > 1 && s.materials.map(materialLabel).join(", ")],
    ["Finish", s.finish],
    ["Colour", s.color && humanize(s.color)],
    ["Pattern", s.pattern && humanize(s.pattern)],
    ["Design", s.design],
    ["Capacity", s.capacityMl && `${s.capacityMl} ml`],
    ["Dimensions", dimensionsText(s.dimensions)],
    ["Pieces in set", s.piecesPerSet],
    ["Serves", s.serves && `${s.serves} people`],
    ["Weight", s.weightGrams && `${(s.weightGrams / 1000).toFixed(2)} kg`],
    ["Country of origin", p.manufacturer?.countryOfOrigin],
    ["Manufacturer", p.manufacturer?.name],
  ].filter(([, v]) => v);
  // Only verified (true/false) safety attributes are returned by the API; unknown ones are omitted.
  const care = Object.entries(p.care || {}).filter(([k, v]) => typeof v === "boolean" && CARE_LABELS[k]);
  const rp = p.returnPolicy || {};
  const windowDays = rp.windowDays ?? policy?.defaultWindowDays;

  const hasStory = Boolean(p.description || s.setComposition?.length || p.bundleItems?.length);
  return (
    <div className={`grid gap-12 ${hasStory ? "lg:grid-cols-2" : ""}`}>
      <div className={hasStory ? "space-y-10" : "hidden"}>
        {p.description ? (
          <section>
            <h2 className="font-display text-2xl">Description</h2>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{p.description}</p>
          </section>
        ) : null}
        {s.setComposition?.length ? (
          <section>
            <h2 className="font-display text-2xl">What&apos;s in the set</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {s.setComposition.map((c) => (
                <li key={c.item} className="card px-3 py-2.5"><span className="font-medium">{c.count}×</span> {humanize(c.item)}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {p.bundleItems?.length ? (
          <section>
            <h2 className="font-display text-2xl">Included in this bundle</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {p.bundleItems.map((b) => <li key={b.sku}>{b.quantity}× {b.name || b.sku}</li>)}
            </ul>
          </section>
        ) : null}
      </div>
      <div className={hasStory ? "space-y-10" : "grid gap-10 md:grid-cols-2 lg:grid-cols-3"}>
        {rows.length ? (
          <section>
            <h2 className="font-display text-2xl">Specifications</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        <section>
          <h2 className="font-display text-2xl">Care &amp; safety</h2>
          {care.length ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {care.map(([k, v]) => (
                <li key={k} className={`flex items-center gap-2 ${v ? "text-ink" : "text-muted"}`}>
                  <span aria-hidden="true">{v ? "✓" : "✕"}</span> {v ? CARE_LABELS[k] : `Not ${CARE_LABELS[k].toLowerCase()}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Care and safety information for this piece hasn&apos;t been verified yet. Please hand wash and avoid sudden temperature changes.</p>
          )}
          {p.care?.notes ? <p className="mt-3 text-sm text-ink-soft">{p.care.notes}</p> : null}
        </section>
        <section>
          <h2 className="font-display text-2xl">Returns &amp; damage</h2>
          <div className="mt-3 space-y-2 text-sm text-ink-soft">
            {rp.returnable === false ? (
              <p>This item is not returnable. Damaged or incorrect deliveries are still covered — report them from My Orders.</p>
            ) : rp.replacementOnly ? (
              <p>Eligible for replacement{windowDays ? ` within ${windowDays} days of delivery` : ""}.</p>
            ) : (
              <p>Eligible for return or replacement{windowDays ? ` within ${windowDays} days of delivery` : ""}, as per our policy.</p>
            )}
            {policy?.damageReportWindowDays ? <p>Arrived broken, chipped or with missing pieces? Report it with photos within {policy.damageReportWindowDays} days of delivery.</p> : null}
            {rp.notes ? <p>{rp.notes}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

async function Related({ slug }) {
  const r = await tryPublic(`/products/${encodeURIComponent(slug)}/related`);
  if (!r?.data?.length) return null;
  return (
    <section className="border-t border-line pt-14">
      <SectionHeading title="You May Also Like" />
      <ProductRail products={r.data} label="Related products" />
    </section>
  );
}

async function Content({ params }) {
  const { slug } = await params;
  const [p, settings] = await Promise.all([loadProduct(slug), tryPublic("/settings/public")]);
  if (!p) notFound();
  const def = p.variants.find((v) => v.isDefault) || p.variants[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: def?.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    image: (p.images || []).map((i) => i.url),
    url: `${SITE_URL}/products/${p.slug}`,
    offers: { "@type": "Offer", priceCurrency: "INR", price: (def.price / 100).toFixed(2), availability: def.stockStatus === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", seller: { "@type": "Organization", name: STORE_NAME } },
    ...(p.rating?.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average, reviewCount: p.rating.count } } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: p.name }]} />
      <div className="mt-6">
        <ProductHero product={p} />
      </div>
      <div className="mt-16 border-t border-line pt-14">
        <Details p={p} policy={settings?.data?.returns} />
      </div>
      <div className="mt-16 border-t border-line pt-14">
        <Reviews productId={p.id} slug={p.slug} />
      </div>
      <div className="mt-16">
        <Suspense fallback={<RailSkeleton />}>
          <Related slug={p.slug} />
        </Suspense>
      </div>
    </>
  );
}

function PdpSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product">
      <div className="skeleton h-4 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="skeleton aspect-square" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }) {
  return (
    <div className="container-lux py-8 sm:py-10">
      <Suspense fallback={<PdpSkeleton />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}
