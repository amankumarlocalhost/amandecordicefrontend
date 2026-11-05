import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Photo, SectionHeading } from "@/components/ui/bits";
import ProductRail, { RailSkeleton } from "@/components/product/ProductRail";
import { getCategoryTree, tryPublic } from "@/lib/api/server";
import { primaryCategories } from "@/lib/content";
import { CATEGORY_PHOTOS, FALLBACK_PHOTO, SPACE_PHOTOS, unsplash } from "@/lib/images";

/**
 * Home décor homepage sections. Everything is read from the backend (category tree, "space"
 * collections, published products); built-in photography is only a fallback until an approved image
 * is set in the admin, and sections with nothing to show render nothing.
 */

/** Approved DB image (medium size) or the built-in photo for this slug. */
function imageFor(record, builtIn, width = 900) {
  if (record?.image?.url) return { src: record.image.mediumUrl || record.image.url, alt: record.image.alt || record.name };
  const p = builtIn || FALLBACK_PHOTO;
  return { src: unsplash(p.src, width), alt: p.alt };
}

function ViewAll({ href, children = "View all" }) {
  return (
    <Link href={href} className="link-arrow shrink-0 text-ink">
      {children} <Icon name="arrowRight" size={15} />
    </Link>
  );
}

// ------------------------------------------------------------------ Shop by Category

export async function ShopByCategory({ content = null }) {
  const tree = primaryCategories((await getCategoryTree())?.data || []);
  if (!tree.length) return null;
  const cats = tree.slice(0, content?.limit || 10);
  return (
    <section id="shop-by-category" className="container-lux scroll-mt-24 py-14 sm:py-20" aria-labelledby="shop-cat-title">
      <div className="mb-8 text-center sm:mb-12" data-reveal>
        <p className="eyebrow mb-2 text-gold-ink">{content?.eyebrow || "Curated for every corner"}</p>
        <h2 id="shop-cat-title" className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
          {content?.title || "Shop by Category"}
        </h2>
      </div>
      {/* 2 columns on phones, 5 from tablets up: ten categories always fill complete rows. */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-5 md:gap-x-4 lg:gap-x-5">
        {cats.map((c, i) => {
          const img = imageFor(c, CATEGORY_PHOTOS[c.slug], 700);
          return (
            <li key={c._id || c.slug} data-reveal style={{ transitionDelay: `${(i % 5) * 60}ms` }}>
              <Link href={`/category/${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-cream-200 shadow-card">
                  <Photo src={img.src} alt={img.alt} sizes="(min-width:768px) 19vw, 48vw" className="transition-transform duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-olive-950/55 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                  {c.children?.length ? (
                    <span className="absolute top-2 left-2 rounded-full bg-cream-50/90 px-2 py-0.5 text-[0.55rem] sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[0.6rem] font-medium tracking-[0.14em] text-ink uppercase backdrop-blur-sm">{c.children.length} styles</span>
                  ) : null}
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="font-display text-[1.2rem] leading-tight md:text-[1.05rem] lg:text-[1.3rem] xl:text-[1.45rem]">{c.name}</h3>
                  <Icon name="arrowRight" size={16} className="mt-1 shrink-0 text-gold-ink transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ Shop by Space

const BUILT_IN_SPACES = [
  { name: "Living Room", slug: "living-room" },
  { name: "Bedroom", slug: "bedroom" },
  { name: "Dining Room", slug: "dining-room" },
  { name: "Kitchen", slug: "kitchen" },
  { name: "Balcony & Garden", slug: "balcony-garden" },
  { name: "Entryway", slug: "entryway" },
];

export async function ShopBySpace({ content = null }) {
  const r = await tryPublic("/collections", { type: "space" });
  // API unreachable → the built-in six (they link to the same seeded collections).
  const spaces = r ? r.data || [] : BUILT_IN_SPACES;
  if (!spaces.length) return null;
  return (
    <section className="bg-cream-200/70 py-14 sm:py-20" aria-labelledby="spaces-title">
      <div className="container-lux">
        <SectionHeading eyebrow={content?.eyebrow || "Room by room"} title={<span id="spaces-title">{content?.title || "Shop by Space"}</span>} action={<ViewAll href="/collections?type=space">All spaces</ViewAll>} />
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
          {spaces.slice(0, 6).map((s, i) => {
            const img = imageFor(s, SPACE_PHOTOS[s.slug], 1000);
            return (
              <li key={s._id || s.slug} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <Link href={`/collections/${s.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[6px] bg-olive-900 sm:aspect-[4/3]">
                  <Photo src={img.src} alt={img.alt} sizes="(min-width:768px) 31vw, 48vw" className="transition-transform duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-olive-950/80 via-olive-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-cream-50 sm:p-6">
                    <h3 className="font-display text-[1.3rem] leading-tight sm:text-[1.7rem] lg:text-[2rem]">{s.name}</h3>
                    <span className="link-arrow mt-2 text-[0.6rem]">
                      <span className="border-b border-cream-50/60 pb-0.5">Shop<span className="hidden sm:inline"> the room</span></span> <Icon name="arrowRight" size={14} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Trending

/** Top-rated published products, with the newest as a fallback while ratings build up. */
export async function TrendingProducts({ content = null }) {
  const limit = content?.limit || 10;
  let r = await tryPublic("/products", { sort: "rating", limit, inStock: "true" });
  if (!r?.data?.length || !r.data.some((p) => p.rating?.count)) r = await tryPublic("/products", { featured: "true", sort: "newest", limit, inStock: "true" });
  if (!r?.data?.length) return null;
  return (
    <section className="container-lux py-14 sm:py-20" data-reveal>
      <SectionHeading eyebrow={content?.eyebrow || "Loved right now"} title={content?.title || "Trending Products"} action={<ViewAll href="/shop?sort=rating" />} />
      <ProductRail products={r.data} label="Trending products" />
    </section>
  );
}

export function GridSectionSkeleton({ title }) {
  return (
    <section className="container-lux py-14 sm:py-20" aria-busy="true">
      <SectionHeading title={title} />
      <RailSkeleton />
    </section>
  );
}
