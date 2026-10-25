"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Notice, Photo, Price, Spinner } from "@/components/ui/bits";
import { money } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";

export function QtyStepper({ value, onChange, min = 1, max = 20, disabled, size = "md", label = "Quantity" }) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <div className={`inline-flex ${h} items-center border border-line bg-cream-50`} role="group" aria-label={label}>
      <button type="button" className="flex h-full w-8 items-center justify-center text-ink-soft hover:text-ink disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <Icon name="minus" size={14} />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="flex h-full w-8 items-center justify-center text-ink-soft hover:text-ink disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

/** One priced line from the server quote (quote.lines). */
export function CartLine({ line, issue, onNavigate, compact = false }) {
  const { setQuantity, removeItem, pending } = useCart();
  const busy = pending.has(line.sku);
  const lineTotal = line.subtotal - (line.promotionDiscount || 0);
  return (
    <li className={`flex gap-4 py-5 ${busy ? "opacity-60" : ""} transition-opacity`}>
      <Link href={`/products/${line.slug}`} onClick={onNavigate} className={`relative shrink-0 overflow-hidden bg-cream-200 ${compact ? "h-24 w-20" : "h-28 w-24 sm:h-32 sm:w-28"}`}>
        <Photo src={line.image} alt={line.name} sizes="112px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${line.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm leading-snug hover:underline">
              {line.name}
            </Link>
            {line.variantTitle ? <p className="mt-0.5 text-xs text-muted">{line.variantTitle}</p> : null}
            {line.bundleComponents?.length ? <p className="mt-0.5 text-xs text-muted">Set of {line.bundleComponents.length} items</p> : null}
          </div>
          <button type="button" onClick={() => removeItem(line.sku)} disabled={busy} className="-mt-1 -mr-1 p-1 text-muted hover:text-danger" aria-label={`Remove ${line.name}`}>
            <Icon name="trash" size={16} />
          </button>
        </div>
        <div className="mt-1">
          <Price price={line.unitPrice} mrp={line.mrp} size="sm" />
        </div>
        {line.promotionDiscount > 0 ? <p className="mt-0.5 text-xs text-success">Offer: −{money(line.promotionDiscount)}</p> : null}
        {issue ? <p className="mt-1 text-xs text-danger">{issue.message}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QtyStepper size="sm" value={line.quantity} min={1} max={issue?.available ? Math.max(issue.available, 1) : 20} disabled={busy} onChange={(q) => setQuantity(line.sku, q)} />
          <span className="text-sm font-medium">{money(lineTotal)}</span>
        </div>
      </div>
    </li>
  );
}

export function FreeShippingMeter({ quote }) {
  const threshold = quote?.shipping?.freeShippingThreshold;
  if (!threshold || !quote) return null;
  const spent = quote.totals.merchandiseTotal;
  const remaining = threshold - spent;
  const pct = Math.min(100, Math.round((spent / threshold) * 100));
  return (
    <div className="bg-cream-100 px-5 py-3.5">
      <p className="text-xs text-ink-soft">
        {remaining > 0 ? (
          <>Add <strong className="font-medium text-ink">{money(remaining)}</strong> more for free shipping</>
        ) : (
          <span className="text-success">Your order qualifies for free shipping</span>
        )}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream-300" aria-hidden="true">
        <div className="h-full bg-olive-800 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CouponBox({ quote, couponCode }) {
  const { applyCoupon, removeCoupon, pending } = useCart();
  const [code, setCode] = useState("");
  const busy = pending.has("__coupon");
  const coupon = quote?.coupon;
  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm border border-dashed border-olive-700/50 bg-[#eef2e7] px-3 py-2.5 text-sm">
        <span>
          <span className="font-medium tracking-wide">{couponCode}</span>
          {coupon?.valid ? <span className="ml-2 text-success">−{money(coupon.discount)}{coupon.freeShipping ? " · free shipping" : ""}</span> : <span className="ml-2 text-danger">{coupon?.message || "Not applicable"}</span>}
        </span>
        <button type="button" onClick={removeCoupon} disabled={busy} className="text-xs uppercase tracking-[0.14em] text-ink-soft hover:text-danger">
          {busy ? <Spinner size={14} /> : "Remove"}
        </button>
      </div>
    );
  }
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (code.trim().length < 3) return;
        const r = await applyCoupon(code.trim());
        if (r.ok) setCode("");
      }}
    >
      <label htmlFor="coupon" className="sr-only">Coupon code</label>
      <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="input min-h-10 flex-1 text-sm uppercase" maxLength={30} />
      <button type="submit" className="btn btn-outline btn-sm" disabled={busy || code.trim().length < 3}>
        {busy ? <Spinner size={14} /> : "Apply"}
      </button>
    </form>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={tone === "good" ? "text-success" : ""}>{value}</span>
    </div>
  );
}

export function Totals({ quote, showShippingNote = true }) {
  if (!quote) return null;
  const t = quote.totals;
  return (
    <div className="space-y-2">
      <Row label="Subtotal (MRP)" value={money(t.mrpTotal)} />
      {t.saleSavings > 0 ? <Row label="Product discount" value={`−${money(t.saleSavings)}`} tone="good" /> : null}
      {t.promotionDiscount > 0 ? <Row label="Offers" value={`−${money(t.promotionDiscount)}`} tone="good" /> : null}
      {t.couponDiscount > 0 ? <Row label="Coupon" value={`−${money(t.couponDiscount)}`} tone="good" /> : null}
      <Row label="Shipping" value={t.shippingFee > 0 ? money(t.shippingFee) : "Free"} tone={t.shippingFee === 0 ? "good" : undefined} />
      {t.giftWrapFee > 0 ? <Row label="Gift wrap" value={money(t.giftWrapFee)} /> : null}
      {t.codFee > 0 ? <Row label="Cash on delivery fee" value={money(t.codFee)} /> : null}
      <div className="flex justify-between border-t border-line pt-3 text-base">
        <span className="font-medium">Total</span>
        <span className="font-medium">{money(t.total)}</span>
      </div>
      <p className="text-xs text-muted">Inclusive of GST ({money(t.taxTotal)}).{showShippingNote && !quote.shipping?.serviceability ? " Shipping is confirmed for your PIN code at checkout." : ""}</p>
      {t.totalSavings > 0 ? <p className="text-xs font-medium text-success">You save {money(t.totalSavings)} on this order</p> : null}
    </div>
  );
}

export function QuoteIssues({ issues }) {
  const general = (issues || []).filter((i) => !i.sku);
  if (!general.length) return null;
  return (
    <div className="space-y-2">
      {general.map((i) => (
        <Notice key={i.code + i.message} tone="warn">{i.message}</Notice>
      ))}
    </div>
  );
}
