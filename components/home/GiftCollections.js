import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { Photo, SectionHeading } from "@/components/ui/bits";
import { tryPublic } from "@/lib/api/server";
import { PHOTOS, SPACE_PHOTOS, unsplash } from "@/lib/images";

export function CollectionTile({ collection, index = 0, sizes = "(min-width:1024px) 31vw, (min-width:640px) 48vw, 100vw" }) {
  const fallback = (collection.type === "space" && SPACE_PHOTOS[collection.slug]) || PHOTOS.collections[index % PHOTOS.collections.length];
  return (
    <Link href={`/collections/${collection.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[4px] bg-olive-900">
      {collection.image?.url ? (
        <Photo src={collection.image.url} alt={collection.name} sizes={sizes} className="transition-transform duration-[1100ms] group-hover:scale-105" />
      ) : (
        <Image src={unsplash(fallback.src, 1000)} alt={fallback.alt} fill sizes={sizes} className="object-cover transition-transform duration-[1100ms] group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-olive-950/80 via-olive-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-cream-50">
        <p className="eyebrow text-[0.58rem] text-gold-soft">{collection.type === "gift" ? "Gift collection" : collection.type === "festival" ? "Festive edit" : collection.type === "space" ? "Shop by space" : "Collection"}</p>
        <h3 className="font-display mt-1 text-2xl sm:text-[1.75rem]">{collection.name}</h3>
        <span className="link-arrow mt-2 text-[0.6rem]">
          Explore <Icon name="arrowRight" size={14} />
        </span>
      </div>
    </Link>
  );
}

/** Gift/festive collections that are live right now (GET /collections). */
export default async function GiftCollections({ content = null }) {
  const r = await tryPublic("/collections");
  // "Shop by Space" collections have their own homepage section.
  const list = (r?.data || []).filter((c) => c.type !== "space").sort((a, b) => (a.type === "gift" ? -1 : 0) - (b.type === "gift" ? -1 : 0)).slice(0, content?.limit || 3);
  if (!list.length) return null;
  return (
    <section className="container-lux py-14 sm:py-20" data-reveal>
      <SectionHeading
        eyebrow={content?.eyebrow || "Curated edits"}
        title={content?.title || "Featured Collections"}
        action={
          <Link href="/collections" className="link-arrow shrink-0">
            All collections <Icon name="arrowRight" size={15} />
          </Link>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c, i) => (
          <li key={c._id}>
            <CollectionTile collection={c} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
