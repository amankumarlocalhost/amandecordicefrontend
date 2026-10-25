import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductListing, { ListingSkeleton } from "@/components/catalog/ProductListing";
import { Breadcrumbs } from "@/components/ui/bits";
import { getPublic } from "@/lib/api/server";
import { parseFilters, toSearch } from "@/lib/catalogQuery";

async function loadCategory(slug) {
  return (await getPublic(`/categories/${encodeURIComponent(slug)}`)).data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await loadCategory(slug).catch(() => null);
  if (!cat) return { title: "Category" };
  return { title: cat.seo?.title || cat.name, description: cat.seo?.description || cat.description || `Shop ${cat.name}.` };
}

async function Content({ params, searchParams }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await loadCategory(slug);
  if (!cat) notFound();
  const filters = parseFilters(sp);
  delete filters.category;
  return (
    <>
      <header className="mb-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...cat.breadcrumb.map((b) => ({ label: b.name, href: `/category/${b.slug}` })), { label: cat.name }]} />
        <h1 className="font-display mt-6 text-4xl sm:text-5xl">{cat.name}</h1>
        {cat.description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{cat.description}</p> : null}
        {cat.children?.length ? (
          <ul className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
            {cat.children.map((c) => (
              <li key={c._id} className="shrink-0">
                <Link href={`/category/${c.slug}`} className="chip px-4 py-1.5 hover:border-ink">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <Suspense key={toSearch(filters)} fallback={<ListingSkeleton />}>
        <ProductListing filters={filters} base={{ category: cat.slug }} basePath={`/category/${cat.slug}`} />
      </Suspense>
    </>
  );
}

export default function CategoryPage({ params, searchParams }) {
  return (
    <div className="container-lux py-8 sm:py-12">
      <Suspense fallback={<><div className="skeleton mb-8 h-28 w-80" /><ListingSkeleton /></>}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
