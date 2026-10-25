"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Photo, Price, Rating, Spinner } from "@/components/ui/bits";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { materialLabel } from "@/lib/format";

/** Card for the backend's listCard shape (GET /products, /related, /wishlist). */
export default function ProductCard({ product, sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 46vw", preload = false, aspect = "aspect-[4/5]" }) {
  const { addItem, pending } = useCart();
  const wishlist = useWishlist();
  const p = product;
  const saved = wishlist.has(p.id);
  const busy = pending.has(p.defaultSku);
  const priceRange = p.priceMax > p.priceMin;

  return (
    <article className="group relative flex flex-col">
      <div className={`relative ${aspect} overflow-hidden rounded-[3px] bg-cream-200`}>
        <Link href={`/products/${p.slug}`} className="absolute inset-0" aria-label={p.name} tabIndex={-1}>
          <Photo src={p.image?.mediumUrl || p.image?.url} alt={p.image?.alt || p.name} sizes={sizes} preload={preload} className="transition-transform duration-[900ms] ease-[var(--ease-lux)] group-hover:scale-[1.045]" />
        </Link>
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {!p.inStock ? <span className="badge bg-cream-50/95 text-ink-soft">Sold out</span> : null}
          {p.inStock && p.flags?.newArrival ? <span className="badge bg-cream-50/95 text-olive-900">New</span> : null}
          {p.inStock && p.discountPercent > 0 ? <span className="badge bg-olive-900 text-cream-50">−{p.discountPercent}%</span> : null}
        </div>
        <button
          type="button"
          onClick={() => wishlist.toggle(p.id, p.defaultSku)}
          className={`absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 transition-[opacity,color] duration-300 hover:text-danger focus:opacity-100 ${saved ? "text-danger opacity-100" : "text-ink opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}
          aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          aria-pressed={saved}
        >
          <Icon name="heart" size={17} filled={saved} />
        </button>
        {p.inStock && p.defaultSku ? (
          <button
            type="button"
            onClick={() => addItem(p.defaultSku, 1)}
            disabled={busy}
            className="btn btn-light absolute inset-x-2.5 bottom-2.5 min-h-10 translate-y-0 opacity-100 shadow-[var(--shadow-card)] focus:translate-y-0 focus:opacity-100 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            style={{ transitionProperty: "opacity, transform, background-color", transitionDuration: "350ms" }}
            aria-label={`Add to bag: ${p.name}`}
          >
            {busy ? <Spinner size={14} /> : <Icon name="bag" size={15} />} Add to bag
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        {p.brand ? <p className="eyebrow text-[0.58rem] text-muted">{p.brand}</p> : null}
        <h3 className="text-[0.84rem] leading-snug text-ink">
          <Link href={`/products/${p.slug}`} className="hover:underline underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {priceRange ? <span className="text-[0.95rem] font-medium">from <Price price={p.priceMin} /></span> : <Price price={p.price ?? p.priceMin} mrp={p.mrp} showDiscount={false} />}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 text-[0.7rem] text-muted">
          <Rating rating={p.rating} />
          {p.material ? <span>{materialLabel(p.material)}</span> : null}
          {p.piecesPerSet > 1 ? <span>{p.piecesPerSet} pcs</span> : null}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ aspect = "aspect-[4/5]" }) {
  return (
    <div aria-hidden="true">
      <div className={`skeleton ${aspect} w-full`} />
      <div className="skeleton mt-3 h-3.5 w-4/5" />
      <div className="skeleton mt-2 h-3.5 w-1/3" />
    </div>
  );
}
