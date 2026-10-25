import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductListing, { ListingSkeleton } from "@/components/catalog/ProductListing";
import { Breadcrumbs } from "@/components/ui/bits";
import { getPublic } from "@/lib/api/server";
import { parseFilters, toSearch } from "@/lib/catalogQuery";

async function loadCollection(slug) {
  return (await getPublic(`/collections/${encodeURIComponent(slug)}`)).data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = await loadCollection(slug).catch(() => null);
  return c ? { title: c.seo?.title || c.name, description: c.seo?.description || c.description } : { title: "Collection" };
}

async function Content({ params, searchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const col = await loadCollection(slug);
  if (!col) notFound();
  const filters = parseFilters(sp);
  return (
    <>
      <header className="mb-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: col.name }]} />
        <p className="eyebrow mt-6 text-gold-ink">{col.type === "gift" ? "Gift collection" : col.type === "festival" ? "Festive edit" : "Collection"}</p>
        <h1 className="font-display mt-1 text-4xl sm:text-5xl">{col.name}</h1>
        {col.description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{col.description}</p> : null}
      </header>
      <Suspense key={toSearch(filters)} fallback={<ListingSkeleton />}>
        <ProductListing filters={filters} base={{ collection: col.slug }} basePath={`/collections/${col.slug}`} />
      </Suspense>
    </>
  );
}

export default function CollectionPage({ params, searchParams }) {
  return (
    <div className="container-lux py-8 sm:py-12">
      <Suspense fallback={<><div className="skeleton mb-8 h-28 w-80" /><ListingSkeleton /></>}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
