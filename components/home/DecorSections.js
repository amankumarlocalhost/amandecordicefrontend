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
    <section id="shop-by-category" className="container-lux scroll-mt-24 py-16 sm:py-24" aria-labelledby="shop-cat-title">
      <div className="mx-auto mb-10 max-w-xl text-center sm:mb-14" data-reveal>
        <p className="eyebrow eyebrow-rule is-centered mb-4 text-gold-ink">{content?.eyebrow || "Curated for every corner"}</p>
        <h2 id="shop-cat-title" className="font-display text-[2.3rem] leading-[1.05] sm:text-[3.1rem]">
          {content?.title || (
            <>
              Shop by <span className="display-italic text-gold-ink">Category</span>
            </>
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">{content?.body || "Thoughtfully chosen pieces for every room — from sculptural vases to everyday kitchen beauty."}</p>
        <div className="ornament mx-auto mt-6 max-w-[14rem] text-[0.5rem]" aria-hidden="true">✦</div>
      </div>
      {/* 2 columns on phones, 5 from tablets up: ten categories always fill complete rows. */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-5 md:gap-x-4 lg:gap-x-5">
        {cats.map((c, i) => {
          const img = imageFor(c, CATEGORY_PHOTOS[c.slug], 700);
          return (
            <li key={c._id || c.slug} data-reveal style={{ transitionDelay: `${(i % 5) * 60}ms` }}>
              <Link href={`/category/${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-cream-200 shadow-card transition-shadow duration-500 group-hover:shadow-[var(--shadow-pop)]">
                  <Photo src={img.src} alt={img.alt} sizes="(min-width:768px) 19vw, 48vw" className="transition-transform duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-olive-950/55 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="display-italic absolute top-2.5 left-3 text-[0.95rem] text-cream-50/90 drop-shadow sm:top-3.5 sm:left-4 sm:text-[1.05rem]" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="absolute inset-x-3 bottom-3 translate-y-2 text-center opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true">
                    <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3 py-1.5 text-[0.55rem] text-ink backdrop-blur-sm">
                      Explore <Icon name="arrowRight" size={11} />
                    </span>
                  </span>
                </div>
                <div className="mt-3.5 text-center">
                  <h3 className="font-display text-[1.2rem] leading-tight transition-colors duration-300 group-hover:text-gold-ink md:text-[1.05rem] lg:text-[1.3rem] xl:text-[1.4rem]">{c.name}</h3>
                  {c.children?.length ? <p className="mt-1 text-[0.68rem] tracking-[0.12em] text-muted uppercase">{c.children.length} styles</p> : null}
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
    <section className="bg-cream-200/70 py-16 sm:py-24" aria-labelledby="spaces-title">
      <div className="container-lux">
        <SectionHeading eyebrow={content?.eyebrow || "Room by room"} title={<span id="spaces-title">{content?.title || "Shop by Space"}</span>} action={<ViewAll href="/collections?type=space">{content?.allLabel || "All spaces"}</ViewAll>} />
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
          {spaces.slice(0, 6).map((s, i) => {
            const img = imageFor(s, SPACE_PHOTOS[s.slug], 1000);
            return (
              <li key={s._id || s.slug} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <Link href={`/collections/${s.slug}`} className="frame-inset group relative block aspect-[4/5] overflow-hidden rounded-[6px] bg-olive-900 sm:aspect-[4/3]">
                  <Photo src={img.src} alt={img.alt} sizes="(min-width:768px) 31vw, 48vw" className="transition-transform duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-olive-950/80 via-olive-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-[2] p-5 text-cream-50 sm:p-8">
                    {/* Caption template from the admin; {name} = the first word of the space, e.g. "The {name} edit". */}
                    <p className="display-italic text-[0.85rem] text-gold-soft sm:text-[0.95rem]">{(content?.caption ?? "The {name} edit").replace("{name}", s.name.split(" ")[0])}</p>
                    <h3 className="font-display text-[1.35rem] leading-tight sm:text-[1.8rem] lg:text-[2.1rem]">{s.name}</h3>
                    <span className="link-arrow mt-2 text-[0.6rem]">
                      <span className="border-b border-cream-50/60 pb-0.5">{content?.linkLabel || <>Shop<span className="hidden sm:inline"> the room</span></>}</span> <Icon name="arrowRight" size={14} />
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
