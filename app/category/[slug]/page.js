import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductListing, { ListingSkeleton } from "@/components/catalog/ProductListing";
import { Breadcrumbs, Photo } from "@/components/ui/bits";
import { CATEGORY_PHOTOS, unsplash } from "@/lib/images";
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
  // Category image: the approved one from the admin, else the built-in photo of its top-level category.
  const builtIn = CATEGORY_PHOTOS[cat.slug] || CATEGORY_PHOTOS[cat.breadcrumb?.[0]?.slug];
  const hero = cat.image?.url ? { src: cat.image.url, alt: cat.image.alt || cat.name } : builtIn ? { src: unsplash(builtIn.src, 1600), alt: builtIn.alt } : null;
  return (
    <>
      <header className="mb-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...cat.breadcrumb.map((b) => ({ label: b.name, href: `/category/${b.slug}` })), { label: cat.name }]} />
        {hero ? (
          // Minimum (not fixed) height so long names and descriptions are never clipped on phones.
          <div className="relative mt-6 flex min-h-48 flex-col justify-end overflow-hidden rounded-[6px] bg-cream-200 sm:min-h-60 lg:min-h-72">
            <Photo src={hero.src} alt={hero.alt} preload sizes="(min-width:1320px) 1240px, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-olive-950/75 via-olive-950/30 to-transparent sm:bg-gradient-to-r sm:from-olive-950/65 sm:via-olive-950/25" />
            <div className="relative p-5 pt-16 text-cream-50 sm:p-8 sm:pt-20">
              <h1 className="font-display text-[2.1rem] leading-[1.1] sm:text-5xl">{cat.name}</h1>
              {cat.description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream-100/90">{cat.description}</p> : null}
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-display mt-6 text-4xl sm:text-5xl">{cat.name}</h1>
            {cat.description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{cat.description}</p> : null}
          </>
        )}
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
