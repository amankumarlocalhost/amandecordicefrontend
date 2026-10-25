import Link from "next/link";
import { Suspense } from "react";
import ProductListing, { ListingSkeleton } from "@/components/catalog/ProductListing";
import { Breadcrumbs } from "@/components/ui/bits";
import { getCategoryTree } from "@/lib/api/server";
import { parseFilters, toSearch } from "@/lib/catalogQuery";

export const metadata = {
  title: "Shop All",
  description: "Shop dinner sets, plates, bowls, glassware, serveware, kitchenware and home decor.",
};

function headingFor(f) {
  if (f.q) return { title: `Results for “${f.q}”`, eyebrow: "Search" };
  if (f.newArrival) return { title: "New In", eyebrow: "Fresh styles" };
  if (f.discounted) return { title: "Sale", eyebrow: "Current offers" };
  if (f.bestseller) return { title: "Best Sellers", eyebrow: "Most loved" };
  return { title: "Shop All", eyebrow: "The collection" };
}

async function CategoryLinks({ active }) {
  const tree = (await getCategoryTree())?.data || [];
  if (!tree.length) return null;
  return (
    <div className="border-b border-line pb-4">
      <p className="mb-3 text-[0.68rem] font-medium tracking-[0.18em] uppercase">Categories</p>
      <ul className="space-y-1.5 text-sm">
        {tree.map((c) => (
          <li key={c._id}>
            <Link href={`/category/${c.slug}`} className={`hover:text-ink ${active === c.slug ? "font-medium text-ink" : "text-ink-soft"}`}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Results({ searchParams }) {
  const filters = parseFilters(await searchParams);
  const h = headingFor(filters);
  return (
    <>
      <header className="mb-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: h.title }]} />
        <p className="eyebrow mt-6 text-gold-ink">{h.eyebrow}</p>
        <h1 className="font-display mt-1 text-4xl sm:text-5xl">{h.title}</h1>
      </header>
      <Suspense key={toSearch(filters)} fallback={<ListingSkeleton />}>
        <ProductListing filters={filters} basePath="/shop" aside={<CategoryLinks active={filters.category} />} />
      </Suspense>
    </>
  );
}

export default function ShopPage({ searchParams }) {
  return (
    <div className="container-lux py-8 sm:py-12">
      <Suspense fallback={<><div className="skeleton mb-8 h-24 w-72" /><ListingSkeleton /></>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
