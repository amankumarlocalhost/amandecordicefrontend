import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/bits";
import ProductRail, { RailSkeleton } from "@/components/product/ProductRail";
import { tryPublic } from "@/lib/api/server";

function ViewAll({ href }) {
  return (
    <Link href={href} className="link-arrow shrink-0 text-ink">
      View all <Icon name="arrowRight" size={15} />
    </Link>
  );
}

/** Products flagged bestseller by the store; falls back to the backend's sales-count ordering. */
export async function BestSellers({ content = null }) {
  const limit = content?.limit || 10;
  let r = await tryPublic("/products", { bestseller: "true", sort: "popularity", limit, inStock: "true" });
  if (!r || r.data.length < 4) r = await tryPublic("/products", { sort: "popularity", limit, inStock: "true" });
  if (!r?.data?.length) return null;
  return (
    <section className="container-lux py-14 sm:py-20" data-reveal>
      <SectionHeading eyebrow={content?.eyebrow || "Most loved"} title={content?.title || "Best Sellers"} action={<ViewAll href="/shop?sort=popularity" />} />
      <ProductRail products={r.data} label="Best sellers" />
    </section>
  );
}

export async function NewArrivals({ content = null }) {
  const r = await tryPublic("/products", { newArrival: "true", sort: "newest", limit: content?.limit || 10 });
  if (!r?.data?.length) return null;
  return (
    <section className="container-lux py-14 sm:py-20" data-reveal>
      <SectionHeading eyebrow={content?.eyebrow || "Just landed"} title={content?.title || "New Arrivals"} action={<ViewAll href="/shop?newArrival=true&sort=newest" />} />
      <ProductRail products={r.data} label="New arrivals" />
    </section>
  );
}

export function RailSectionSkeleton({ title }) {
  return (
    <section className="container-lux py-14 sm:py-20" aria-busy="true">
      <SectionHeading title={title} />
      <RailSkeleton />
    </section>
  );
}
