"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/Overlay";
import { EmptyState, ErrorState, Notice } from "@/components/ui/bits";
import { useCart } from "@/components/providers/CartProvider";
import { money } from "@/lib/format";
import { CartLine, FreeShippingMeter } from "./CartParts";

export default function CartDrawer({ onClose }) {
  const { cart, state, count, refresh } = useCart();
  const quote = cart?.quote;
  const lines = quote?.lines || [];
  const issuesBySku = new Map((quote?.issues || []).filter((i) => i.sku).map((i) => [i.sku, i]));
  const blocked = (quote?.issues || []).some((i) => i.sku);

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Your bag${count ? ` (${count})` : ""}`}
      footer={
        lines.length ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-soft">Subtotal</span>
              <span className="text-lg font-medium">{money(quote.totals.merchandiseTotal)}</span>
            </div>
            <p className="text-xs text-muted">Shipping, offers and COD availability are confirmed at checkout. Prices include GST.</p>
            {blocked ? <Notice tone="warn">Some items need attention before checkout.</Notice> : null}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={onClose} className="btn btn-outline">View bag</Link>
              <Link href="/checkout" onClick={onClose} className={`btn btn-primary ${blocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocked}>
                Checkout
              </Link>
            </div>
          </div>
        ) : null
      }
    >
      {state === "loading" && !cart ? (
        <div className="space-y-4 p-5">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-28 w-24" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : state === "error" ? (
        <ErrorState message="We couldn't load your bag." onRetry={refresh} />
      ) : state === "disabled" ? (
        <EmptyState title="Sign in to shop" action={<Link href="/login" onClick={onClose} className="btn btn-primary">Sign in</Link>}>
          Please sign in to add items to your bag.
        </EmptyState>
      ) : !lines.length ? (
        <EmptyState title="Your bag is empty" action={<Link href="/shop" onClick={onClose} className="btn btn-primary">Explore the collection</Link>}>
          Discover vases, wall décor, candle stands and accents that make every corner beautiful.
        </EmptyState>
      ) : (
        <>
          <FreeShippingMeter quote={quote} />
          <ul className="divide-y divide-line px-5">
            {lines.map((l) => (
              <CartLine key={l.sku} line={l} issue={issuesBySku.get(l.sku)} onNavigate={onClose} compact />
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
