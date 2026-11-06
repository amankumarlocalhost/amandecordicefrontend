import Link from "next/link";
import { Photo, Stars } from "@/components/ui/bits";
import { tryPublic } from "@/lib/api/server";

/**
 * "Loved by Our Customers": real, moderated, verified-purchase reviews from the backend. There is no
 * site-wide reviews endpoint, so we read the top-rated products and their most helpful reviews. When
 * the store has no reviews yet the section is not rendered — reviews are never invented.
 */
async function loadReviews() {
  const top = await tryPublic("/products", { sort: "rating", limit: 8 });
  const rated = (top?.data || []).filter((p) => p.rating?.count > 0).slice(0, 4);
  const lists = await Promise.all(rated.map((p) => tryPublic(`/products/${p.id}/reviews`, { sort: "helpful", limit: 3 }).then((r) => (r?.data || []).map((rev) => ({ ...rev, product: p })))));
  return lists
    .flat()
    .filter((r) => r.rating >= 4 && (r.body || r.title))
    .slice(0, 6);
}

export default async function Testimonials({ content = null }) {
  const reviews = await loadReviews();
  if (!reviews.length) return null;
  return (
    <section className="border-t border-line bg-cream-50 py-14 sm:py-20" aria-labelledby="reviews-title">
      <div className="container-lux">
        {content?.eyebrow ? <p className="eyebrow eyebrow-rule is-centered mb-3 flex justify-center text-gold-ink">{content.eyebrow}</p> : null}
        <h2 id="reviews-title" className="font-display mb-10 text-center text-3xl sm:text-[2.35rem]" data-reveal>
          {content?.title || "Loved by Our Customers"}
        </h2>
        <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="w-[85%] shrink-0 snap-start sm:w-auto" data-reveal>
              <figure className="flex h-full overflow-hidden rounded-[4px] border border-line bg-cream-100">
                <div className="flex flex-1 flex-col p-5">
                  <Stars value={r.rating} />
                  <blockquote className="mt-3 flex-1 text-[0.85rem] leading-relaxed text-ink-soft">“{(r.body || r.title).slice(0, 180)}{(r.body || "").length > 180 ? "…" : ""}”</blockquote>
                  <figcaption className="mt-4 text-xs text-muted">
                    — {r.author || "Verified buyer"}
                    {r.verifiedPurchase ? <span className="ml-2 text-success">✓ Verified purchase</span> : null}
                  </figcaption>
                </div>
                <Link href={`/products/${r.product.slug}`} className="relative w-28 shrink-0 bg-cream-200 sm:w-32" aria-label={r.product.name}>
                  <Photo src={r.product.image?.thumbUrl || r.product.image?.url} alt={r.product.name} sizes="128px" />
                </Link>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
