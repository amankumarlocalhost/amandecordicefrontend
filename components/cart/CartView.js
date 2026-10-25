"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { EmptyState, ErrorState, Notice, Spinner } from "@/components/ui/bits";
import { useCart } from "@/components/providers/CartProvider";
import { catalogApi } from "@/lib/api/endpoints";
import { useQuery } from "@/lib/useQuery";
import { money } from "@/lib/format";
import { CartLine, CouponBox, FreeShippingMeter, QuoteIssues, Totals } from "./CartParts";

export function GiftOptions({ cart }) {
  const { setOptions, pending } = useCart();
  const [message, setMessage] = useState(cart?.giftMessage || "");
  const gw = cart?.quote?.giftWrap;
  if (!gw) return null;
  const busy = pending.has("__options");
  return (
    <div className="space-y-3">
      <label className={`flex items-start gap-3 text-sm ${gw.available ? "" : "opacity-60"}`}>
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--olive-800)]" checked={Boolean(cart.giftWrap)} disabled={!gw.available || busy} onChange={(e) => setOptions({ giftWrap: e.target.checked })} />
        <span>
          <span className="flex items-center gap-2"><Icon name="gift" size={16} /> Gift wrap {gw.fee ? `(${money(gw.fee)})` : ""}</span>
          {!gw.available ? <span className="mt-0.5 block text-xs text-muted">Not available for every item in your bag</span> : null}
        </span>
      </label>
      <div>
        <label htmlFor="gift-msg" className="field-label">Gift message or delivery note (optional)</label>
        <textarea id="gift-msg" maxLength={300} className="input min-h-20 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} onBlur={() => message !== (cart.giftMessage || "") && setOptions({ giftMessage: message })} placeholder="We'll print this on a card with your order" />
        <p className="mt-1 text-right text-[0.65rem] text-muted">{message.length}/300</p>
      </div>
    </div>
  );
}

export function AvailableCoupons({ hasCoupon }) {
  const { applyCoupon, pending } = useCart();
  const { data } = useQuery("coupons", async () => (await catalogApi.coupons()).data, { staleMs: 120000 });
  if (hasCoupon || !data?.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs text-muted">Available offers</p>
      <ul className="space-y-2">
        {data.slice(0, 4).map((c) => (
          <li key={c.code} className="flex items-center justify-between gap-3 rounded-sm border border-dashed border-line px-3 py-2 text-xs">
            <span>
              <strong className="font-medium tracking-wide">{c.code}</strong>
              <span className="ml-2 text-ink-soft">{c.description}</span>
            </span>
            <button type="button" className="shrink-0 text-olive-800 underline underline-offset-4" disabled={pending.has("__coupon")} onClick={() => applyCoupon(c.code)}>Apply</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CartView() {
  const { cart, state, refresh } = useCart();
  const quote = cart?.quote;
  const lines = quote?.lines || [];
  const issuesBySku = new Map((quote?.issues || []).filter((i) => i.sku).map((i) => [i.sku, i]));
  const blocked = (quote?.issues || []).some((i) => i.sku);

  if ((state === "loading" || state === "idle") && !cart) {
    return (
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-32" />)}</div>
        <div className="skeleton h-72" />
      </div>
    );
  }
  if (state === "error") return <ErrorState message="We couldn't load your bag." onRetry={refresh} />;
  if (state === "disabled") {
    return <EmptyState title="Sign in to use your bag" action={<Link href="/login?next=/cart" className="btn btn-primary">Sign in</Link>}>The store requires an account to add items.</EmptyState>;
  }
  if (!lines.length) {
    return (
      <EmptyState title="Your bag is empty" action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>}>
        Fill it with something beautiful — dinner sets, glassware, serveware and more.
      </EmptyState>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div>
        <div className="border border-line">
          <FreeShippingMeter quote={quote} />
        </div>
        <ul className="divide-y divide-line border-b border-line">
          {lines.map((l) => (
            <CartLine key={l.sku} line={l} issue={issuesBySku.get(l.sku)} />
          ))}
        </ul>
        {quote.appliedPromotions?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {quote.appliedPromotions.map((p) => (
              <span key={p.id || p.name} className="chip border-olive-700/40 bg-[#eef2e7] text-success">{p.badge || p.name}</span>
            ))}
          </div>
        ) : null}
        <Link href="/shop" className="link-arrow mt-6 text-ink-soft"><Icon name="arrowLeft" size={15} /> Continue shopping</Link>
      </div>
      <aside className="card h-fit space-y-6 p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="font-display text-2xl">Summary</h2>
        <CouponBox quote={quote} couponCode={cart.couponCode} />
        <AvailableCoupons hasCoupon={Boolean(cart.couponCode)} />
        <GiftOptions cart={cart} />
        <Totals quote={quote} />
        <QuoteIssues issues={quote.issues?.filter((i) => i.code !== "PAYMENT_METHOD_UNAVAILABLE")} />
        {blocked ? <Notice tone="warn">Update or remove the highlighted items to continue.</Notice> : null}
        <Link href="/checkout" className={`btn btn-primary w-full ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
          Proceed to checkout
        </Link>
        <p className="flex items-center justify-center gap-2 text-xs text-muted"><Icon name="shield" size={15} /> Secure checkout · UPI or Cash on Delivery</p>
      </aside>
    </div>
  );
}
