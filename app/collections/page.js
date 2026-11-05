import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs, EmptyState } from "@/components/ui/bits";
import { CollectionTile } from "@/components/home/GiftCollections";
import { tryPublic } from "@/lib/api/server";

export const metadata = {
  title: "Collections",
  description: "Shop by space, curated home décor edits and gift collections for beautiful living.",
};

const TYPES = [
  { value: "", label: "All" },
  { value: "space", label: "Shop by Space" },
  { value: "gift", label: "Gifting" },
  { value: "festival", label: "Festive" },
  { value: "curated", label: "Curated" },
  { value: "seasonal", label: "Seasonal" },
];

async function List({ searchParams }) {
  const sp = await searchParams;
  const type = TYPES.some((t) => t.value && t.value === sp.type) ? sp.type : "";
  const r = await tryPublic("/collections", type ? { type } : undefined);
  const list = r?.data || [];
  return (
    <>
      <nav aria-label="Collection types" className="mb-8 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link key={t.value} href={t.value ? `/collections?type=${t.value}` : "/collections"} aria-current={t.value === type ? "page" : undefined} className={`chip px-4 py-1.5 ${t.value === type ? "border-olive-900 bg-olive-900 text-cream-50" : "hover:border-ink"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      {!r ? (
        <EmptyState icon="alert" title="Collections are unavailable right now">Please try again in a moment.</EmptyState>
      ) : !list.length ? (
        <EmptyState icon="gift" title="No collections here yet">New edits are added regularly — explore the full range meanwhile.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <li key={c._id}>
              <CollectionTile collection={c} index={i} />
              {c.description ? <p className="mt-3 text-sm text-ink-soft">{c.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function CollectionsPage({ searchParams }) {
  return (
    <div className="container-lux py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      <h1 className="font-display mt-6 mb-8 text-4xl sm:text-5xl">Collections</h1>
      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/3]" />)}</div>}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
