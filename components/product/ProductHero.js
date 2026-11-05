"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Notice, Photo, Price, Spinner, Stars } from "@/components/ui/bits";
import { Dialog } from "@/components/ui/Overlay";
import { QtyStepper } from "@/components/cart/CartParts";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { catalogApi } from "@/lib/api/endpoints";
import { isAbort } from "@/lib/api/client";
import { formatDay, humanize, materialLabel, money } from "@/lib/format";

/** Imported stock photos are representative, not the exact item, and must credit the photographer. */
function PhotoCredit({ credit }) {
  if (!credit?.author) return null;
  return (
    <p className="mt-2 text-[0.68rem] text-muted">
      Representative image · Photo by{" "}
      {credit.authorUrl ? <a href={credit.authorUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">{credit.author}</a> : credit.author}
      {credit.provider === "unsplash" ? (
        <>
          {" "}on{" "}
          <a href={credit.pageUrl || "https://unsplash.com"} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">Unsplash</a>
        </>
      ) : null}
    </p>
  );
}

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [lightbox, setLightbox] = useState(false);
  const frame = useRef(null);
  const img = images[active] || images[0];

  const onMove = (e) => {
    const r = frame.current.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 ? (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto md:max-h-[36rem] md:w-20 md:flex-col md:overflow-y-auto" aria-label="Product images">
          {images.map((im, i) => (
            <li key={im.url + i} className="shrink-0">
              <button type="button" onClick={() => setActive(i)} className={`relative block h-20 w-20 overflow-hidden rounded-[3px] bg-cream-200 ring-offset-2 ring-offset-cream-100 ${i === active ? "ring-1 ring-ink" : "opacity-75 hover:opacity-100"}`} aria-label={`Show image ${i + 1}`} aria-current={i === active}>
                <Photo src={im.thumbUrl || im.url} alt="" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex-1">
      <div
        ref={frame}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[4px] bg-cream-200"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setLightbox(true)}
      >
        <div className="absolute inset-0 transition-transform duration-200 ease-out" style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
          <Photo src={img?.url} alt={img?.alt || name} sizes="(min-width:1024px) 50vw, 100vw" preload quality={85} />
        </div>
        <button type="button" className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-cream-50/90 text-ink" aria-label="Enlarge image" onClick={(e) => { e.stopPropagation(); setLightbox(true); }}>
          <Icon name="zoom" size={17} />
        </button>
      </div>
      <PhotoCredit credit={img?.credit} />
      </div>
      <Dialog open={lightbox} onClose={() => setLightbox(false)} title={name} size="xl">
        <div className="relative aspect-square w-full bg-cream-200">
          <Photo src={img?.url} alt={img?.alt || name} sizes="90vw" quality={85} />
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setActive((a) => (a - 1 + images.length) % images.length)} aria-label="Previous image"><Icon name="chevronLeft" size={16} /></button>
            <span className="self-center text-sm text-muted">{active + 1} / {images.length}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setActive((a) => (a + 1) % images.length)} aria-label="Next image"><Icon name="chevronRight" size={16} /></button>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function variantLabel(v) {
  if (v.title) return v.title;
  const a = v.attributes || {};
  return [a.color && humanize(a.color), a.pattern && humanize(a.pattern), a.size, a.capacityMl && `${a.capacityMl} ml`, a.setSize && `Set of ${a.setSize}`].filter(Boolean).join(" · ") || v.sku;
}

function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const [res, setRes] = useState(null);
  const [state, setState] = useState("idle");
  const ctrl = useRef(null);
  useEffect(() => {
    // Restore the last PIN code after hydration (browser storage isn't available during SSR).
    try {
      const saved = localStorage.getItem("pincode");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setPin(saved);
    } catch {}
  }, []);
  const check = async (e) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setState("invalid");
      return;
    }
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setState("loading");
    try {
      const r = await catalogApi.serviceability(pin, ctrl.current.signal);
      setRes(r.data);
      setState("done");
      try {
        localStorage.setItem("pincode", pin);
      } catch {}
    } catch (err) {
      if (!isAbort(err)) setState("error");
    }
  };
  return (
    <div className="border-t border-line pt-5">
      <p className="mb-2 flex items-center gap-2 text-[0.68rem] font-medium tracking-[0.18em] uppercase"><Icon name="truck" size={16} /> Delivery</p>
      <form onSubmit={check} className="flex gap-2">
        <label htmlFor="pdp-pin" className="sr-only">PIN code</label>
        <input id="pdp-pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter PIN code" className="input min-h-10 flex-1 text-sm" aria-invalid={state === "invalid"} />
        <button type="submit" className="btn btn-outline btn-sm min-h-10" disabled={state === "loading"}>
          {state === "loading" ? <Spinner size={14} /> : "Check"}
        </button>
      </form>
      <div className="mt-2 text-sm" aria-live="polite">
        {state === "invalid" ? <p className="text-danger">Enter a valid 6-digit PIN code.</p> : null}
        {state === "error" ? <p className="text-danger">Couldn&apos;t check right now. Please try again.</p> : null}
        {state === "done" && res ? (
          res.serviceable ? (
            <div className="space-y-0.5 text-ink-soft">
              <p className="text-success">Delivers to {res.city ? `${res.city}, ` : ""}{res.pincode}</p>
              {res.estimatedDeliveryDate ? <p>Estimated delivery by <strong className="font-medium text-ink">{formatDay(res.estimatedDeliveryDate)}</strong></p> : null}
              <p>{res.codAvailable ? "Cash on Delivery available" : "Cash on Delivery not available — pay by UPI"}</p>
            </div>
          ) : (
            <p className="text-danger">Sorry, we don&apos;t deliver to {res.pincode} yet.</p>
          )
        ) : null}
      </div>
    </div>
  );
}

export default function ProductHero({ product }) {
  const p = product;
  const router = useRouter();
  const toast = useToast();
  const { isAuthed } = useAuth();
  const { addItem, pending } = useCart();
  const wishlist = useWishlist();
  const initial = p.variants.find((v) => v.isDefault && v.stockStatus !== "out_of_stock") || p.variants.find((v) => v.stockStatus !== "out_of_stock") || p.variants[0];
  const [sku, setSku] = useState(initial?.sku);
  const [rawQty, setQty] = useState(1);
  const [notifyState, setNotifyState] = useState("idle");
  const v = p.variants.find((x) => x.sku === sku) || p.variants[0];
  const out = !v || v.stockStatus === "out_of_stock";
  const maxQty = Math.max(1, v?.maxOrderQuantity || 1);
  const busy = pending.has(v?.sku);
  const qty = Math.min(rawQty, maxQty); // switching to a variant with less stock clamps the quantity

  const images = useMemo(() => {
    const variantImgs = (v?.images || []).map((url) => ({ url, alt: `${p.name} — ${variantLabel(v)}` }));
    return [...variantImgs, ...(p.images || [])].filter((im, i, arr) => arr.findIndex((x) => x.url === im.url) === i);
  }, [v, p.images, p.name]);

  const add = async (buyNow) => {
    const r = await addItem(v.sku, qty, { openDrawer: !buyNow, silent: buyNow });
    if (r.ok && buyNow) router.push("/checkout");
  };

  const notify = async () => {
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(`/products/${p.slug}`)}`);
      return;
    }
    setNotifyState("loading");
    try {
      const r = await catalogApi.backInStock(p.id, v.sku);
      toast.success(r.message);
      setNotifyState("done");
    } catch (err) {
      toast.error(err.message);
      setNotifyState("idle");
    }
  };

  const saved = wishlist.has(p.id);
  const swatch = p.variants.length > 1;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
      <Gallery key={v?.sku} images={images} name={p.name} />
      <div className="lg:sticky lg:top-28 lg:self-start">
        {p.brand ? <p className="eyebrow text-muted">{p.brand}</p> : null}
        <h1 className="font-display mt-2 text-[2.1rem] leading-[1.1] sm:text-[2.6rem]">{p.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {p.rating?.count ? (
            <a href="#reviews" className="flex items-center gap-1.5 hover:text-ink">
              <Stars value={p.rating.average} /> {p.rating.average.toFixed(1)} · {p.rating.count} {p.rating.count === 1 ? "review" : "reviews"}
            </a>
          ) : (
            <span>No reviews yet</span>
          )}
          {v?.sku ? <span>SKU: {v.sku}</span> : null}
        </div>

        <div className="mt-5">
          <Price price={v?.price} mrp={v?.mrp} size="lg" />
          {v?.mrp > v?.price ? <p className="mt-1 text-xs text-muted">MRP {money(v.mrp)} · inclusive of all taxes</p> : <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>}
        </div>

        {swatch ? (
          <fieldset className="mt-6">
            <legend className="mb-2 text-[0.68rem] font-medium tracking-[0.18em] uppercase">
              Option: <span className="font-normal tracking-normal normal-case text-ink-soft">{variantLabel(v)}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((x) => (
                <button
                  key={x.sku}
                  type="button"
                  onClick={() => setSku(x.sku)}
                  aria-pressed={x.sku === sku}
                  className={`relative min-h-10 rounded-[2px] border px-4 text-sm transition-colors ${x.sku === sku ? "border-ink bg-ink text-cream-50" : "border-line bg-cream-50 hover:border-ink"} ${x.stockStatus === "out_of_stock" ? "text-muted line-through decoration-1" : ""}`}
                >
                  {variantLabel(x)}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <p className="mt-5 flex items-center gap-2 text-sm" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${out ? "bg-danger" : v.stockStatus === "low_stock" ? "bg-warn" : "bg-success"}`} aria-hidden="true" />
          {out ? "Out of stock" : v.onlyLeft ? `Only ${v.onlyLeft} left in stock` : "In stock, ready to ship"}
        </p>

        {out ? (
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-primary flex-1" onClick={notify} disabled={notifyState !== "idle"}>
              {notifyState === "loading" ? <Spinner size={16} /> : <Icon name="bell" size={16} />}
              {notifyState === "done" ? "We'll notify you" : "Notify me when available"}
            </button>
            <button type="button" onClick={() => wishlist.toggle(p.id, v.sku)} className={`btn btn-outline px-3.5 ${saved ? "text-danger" : ""}`} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
              <Icon name="heart" size={18} filled={saved} />
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {/* min-w-0 lets the button shrink instead of pushing the row wider than small phones. */}
            <div className="flex gap-2 sm:gap-3">
              <QtyStepper value={qty} min={1} max={maxQty} onChange={setQty} label="Quantity" />
              <button type="button" className="btn btn-primary min-w-0 flex-1" onClick={() => add(false)} disabled={busy}>
                {busy ? <Spinner size={16} /> : <Icon name="bag" size={16} className="max-[379px]:hidden" />} Add to bag
              </button>
              <button type="button" onClick={() => wishlist.toggle(p.id, v.sku)} className={`btn btn-outline px-3.5 ${saved ? "text-danger" : ""}`} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
                <Icon name="heart" size={18} filled={saved} />
              </button>
            </div>
            <button type="button" className="btn btn-outline w-full" onClick={() => add(true)} disabled={busy}>
              Buy now
            </button>
            {maxQty <= qty && maxQty > 1 ? <p className="text-xs text-muted">Maximum {maxQty} per order for this item.</p> : null}
          </div>
        )}

        {p.highlights?.length ? (
          <ul className="mt-7 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            {p.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-olive-700" /> {h}
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {p.specs?.material ? <div className="card px-3 py-2.5"><dt className="text-[0.62rem] tracking-[0.16em] text-muted uppercase">Material</dt><dd className="mt-0.5">{materialLabel(p.specs.material)}</dd></div> : null}
          {p.specs?.piecesPerSet ? <div className="card px-3 py-2.5"><dt className="text-[0.62rem] tracking-[0.16em] text-muted uppercase">Pieces</dt><dd className="mt-0.5">{p.specs.piecesPerSet}{p.specs.serves ? ` · serves ${p.specs.serves}` : ""}</dd></div> : null}
          {p.specs?.capacityMl || v?.attributes?.capacityMl ? <div className="card px-3 py-2.5"><dt className="text-[0.62rem] tracking-[0.16em] text-muted uppercase">Capacity</dt><dd className="mt-0.5">{v?.attributes?.capacityMl || p.specs.capacityMl} ml</dd></div> : null}
          {p.specs?.finish ? <div className="card px-3 py-2.5"><dt className="text-[0.62rem] tracking-[0.16em] text-muted uppercase">Finish</dt><dd className="mt-0.5">{humanize(p.specs.finish)}</dd></div> : null}
        </dl>

        <div className="mt-6 space-y-5">
          <DeliveryCheck />
          {p.isFragile ? (
            <Notice tone="info">
              Fragile item — packed with protective wrapping. If anything arrives broken or chipped, report it with a photo from <Link href="/account/orders" className="underline">My Orders</Link>.
            </Notice>
          ) : null}
          {p.giftWrapAvailable ? <p className="flex items-center gap-2 text-sm text-ink-soft"><Icon name="gift" size={17} /> Gift wrap available at checkout</p> : null}
        </div>
      </div>
    </div>
  );
}
