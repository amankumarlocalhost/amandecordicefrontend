"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { EmptyState, ErrorState, Notice, Photo, Spinner } from "@/components/ui/bits";
import AddressForm from "@/components/account/AddressForm";
import PhoneVerify from "@/components/forms/PhoneVerify";
import { CouponBox, Totals } from "@/components/cart/CartParts";
import { GiftOptions } from "@/components/cart/CartView";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { addressApi, checkoutApi } from "@/lib/api/endpoints";
import { newIdempotencyKey } from "@/lib/api/client";
import { invalidate, useQuery } from "@/lib/useQuery";
import { payWithRazorpay } from "@/lib/razorpay";
import { formatDay, money } from "@/lib/format";

// One idempotency key per (cart contents, address, payment method). Re-submitting the same checkout —
// double click, network retry, page refresh — returns the same order instead of creating a second one.
const KEY_STORE = "checkout:attempt";
function attemptKey(signature) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY_STORE) || "null");
    if (saved?.signature === signature) return saved.key;
    const key = newIdempotencyKey();
    sessionStorage.setItem(KEY_STORE, JSON.stringify({ signature, key }));
    return key;
  } catch {
    return newIdempotencyKey();
  }
}
function clearAttempt() {
  try {
    sessionStorage.removeItem(KEY_STORE);
  } catch {}
}

function Step({ n, title, children, aside }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby={`step-${n}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={`step-${n}`} className="flex items-center gap-3 font-display text-2xl">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-900 font-sans text-xs text-cream-50">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Addresses({ addresses, selected, onSelect, onAdded }) {
  const [adding, setAdding] = useState(!addresses.length);
  return (
    <div>
      {addresses.length ? (
        <ul className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery address">
          {addresses.map((a) => (
            <li key={a._id}>
              <label className={`flex h-full cursor-pointer gap-3 rounded-[3px] border p-4 text-sm transition-colors ${selected === a._id ? "border-olive-900 bg-cream-100" : "border-line hover:border-ink-soft"}`}>
                <input type="radio" name="address" className="mt-1 h-4 w-4 accent-[var(--olive-800)]" checked={selected === a._id} onChange={() => onSelect(a._id)} />
                <span className="leading-relaxed">
                  <span className="flex items-center gap-2 font-medium">
                    {a.fullName}
                    <span className="badge bg-cream-200 text-ink-soft">{a.type}</span>
                    {a.isDefault ? <span className="text-[0.65rem] text-muted">Default</span> : null}
                  </span>
                  <span className="block text-ink-soft">{[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}</span>
                  <span className="block text-ink-soft">{a.city}, {a.state} {a.pincode}</span>
                  <span className="block text-muted">{a.phone}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      {adding ? (
        <div className={addresses.length ? "mt-5 border-t border-line pt-5" : ""}>
          <AddressForm
            submitLabel="Save & deliver here"
            onCancel={addresses.length ? () => setAdding(false) : undefined}
            onSaved={(addr) => {
              setAdding(false);
              onAdded(addr);
            }}
          />
        </div>
      ) : (
        <button type="button" className="link-arrow mt-4 text-olive-800" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} /> Add a new address
        </button>
      )}
    </div>
  );
}

function PaymentOptions({ quote, method, onChange, phoneVerified, onPhoneVerified }) {
  const opts = quote?.paymentOptions;
  const items = [
    { key: "upi", title: "UPI", text: "Pay instantly with any UPI app (GPay, PhonePe, Paytm, BHIM)", icon: "phone" },
    { key: "cod", title: "Cash on Delivery", text: opts?.cod?.fee ? `Pay when it arrives · ${money(opts.cod.fee)} COD fee` : "Pay when your order arrives", icon: "hand" },
  ];
  const codNeedsPhone = opts?.cod && !opts.cod.available && /verify your phone/i.test(opts.cod.reason || "") && !phoneVerified;
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
      {items.map((it) => {
        const o = opts?.[it.key];
        const available = o?.available;
        return (
          <label key={it.key} className={`flex gap-3 rounded-[3px] border p-4 text-sm transition-colors ${!available ? "cursor-not-allowed border-line opacity-70" : method === it.key ? "cursor-pointer border-olive-900 bg-cream-100" : "cursor-pointer border-line hover:border-ink-soft"}`}>
            <input type="radio" name="payment" className="mt-1 h-4 w-4 accent-[var(--olive-800)]" checked={method === it.key} disabled={!available} onChange={() => onChange(it.key)} />
            <Icon name={it.icon} size={20} className="mt-0.5 shrink-0 text-olive-800" />
            <span className="flex-1">
              <span className="block font-medium">{it.title}</span>
              <span className="block text-ink-soft">{it.text}</span>
              {o && !available && o.reason ? <span className="mt-1 block text-xs text-danger">{o.reason}</span> : null}
            </span>
          </label>
        );
      })}
      {codNeedsPhone ? (
        <div className="rounded-[3px] border border-dashed border-line p-4">
          <p className="mb-3 text-sm font-medium">Verify your phone to enable Cash on Delivery</p>
          <PhoneVerify onVerified={onPhoneVerified} />
        </div>
      ) : null}
    </div>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, state: cartState, refresh: refreshCart } = useCart();
  const addressesQ = useQuery("me:addresses", async () => (await addressApi.list()).data);
  const [chosenAddressId, setAddressId] = useState(null);
  const [method, setMethod] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteState, setQuoteState] = useState("idle");
  const [quoteError, setQuoteError] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const placingRef = useRef(false);
  const reqId = useRef(0);

  const addresses = useMemo(() => addressesQ.data || [], [addressesQ.data]);
  // Default to the customer's default address until they pick one.
  const addressId = addresses.some((a) => a._id === chosenAddressId) ? chosenAddressId : (addresses.find((a) => a.isDefault) || addresses[0])?._id || null;

  const cartSig = useMemo(() => JSON.stringify([(cart?.items || []).map((i) => [i.sku, i.quantity]), cart?.couponCode, cart?.giftWrap]), [cart]);

  const loadQuote = useCallback(async () => {
    if (!addressId) return;
    const id = ++reqId.current;
    setQuoteState("loading");
    setQuoteError(null);
    try {
      const r = await checkoutApi.quote({ addressId, paymentMethod: method || undefined });
      if (id !== reqId.current) return;
      setQuote(r.data);
      setQuoteState("ready");
      const po = r.data.paymentOptions;
      if (!method || !po?.[method]?.available) {
        const pick = po?.upi?.available ? "upi" : po?.cod?.available ? "cod" : null;
        if (pick !== method) setMethod(pick);
      }
    } catch (err) {
      if (id !== reqId.current) return;
      setQuoteError(err);
      setQuoteState("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId, method, cartSig]);

  useEffect(() => {
    // Fetch a server quote whenever the address, payment method or cart changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuote();
  }, [loadQuote]);

  const issues = quote?.issues || [];
  const blockingIssues = issues.filter((i) => i.code !== "COUPON_INVALID");
  const canPlace = quoteState === "ready" && method && quote?.paymentOptions?.[method]?.available && !blockingIssues.length && !placing;

  const goResult = (orderNumber, extra = "") => router.replace(`/checkout/result?order=${encodeURIComponent(orderNumber)}${extra}`);

  const place = async () => {
    if (placingRef.current || !canPlace) return;
    placingRef.current = true;
    setPlacing(true);
    setPlaceError(null);
    const key = attemptKey(`${cartSig}|${addressId}|${method}|${quote.totals.total}`);
    try {
      const r = await checkoutApi.placeOrder({ addressId, paymentMethod: method, expectedTotal: quote.totals.total, giftMessage: cart?.giftMessage || undefined }, key);
      const { order, payment } = r.data;
      clearAttempt();
      invalidate("me:orders");
      refreshCart();
      if (order.paymentMethod === "cod") return goResult(order.orderNumber);
      if (!payment?.checkoutOptions) return goResult(order.orderNumber, "&payment=init_failed");
      const outcome = await payWithRazorpay(payment).catch((e) => ({ status: "load_error", error: e }));
      if (outcome.status === "verified") return goResult(order.orderNumber, `&payment=${outcome.result.outcome}`);
      if (outcome.status === "verify_error") return goResult(order.orderNumber, "&payment=verifying");
      if (outcome.status === "load_error") return goResult(order.orderNumber, "&payment=init_failed");
      return goResult(order.orderNumber, outcome.lastError ? "&payment=failed" : "&payment=dismissed");
    } catch (err) {
      placingRef.current = false;
      setPlacing(false);
      if (err.code === "PRICE_CHANGED") {
        setPlaceError("Prices or offers changed since you opened checkout. Please review the updated total and place the order again.");
        loadQuote();
      } else if (["OUT_OF_STOCK", "CHECKOUT_BLOCKED", "CART_EMPTY"].includes(err.code)) {
        setPlaceError(err.message);
        refreshCart();
      } else if (["NETWORK_ERROR", "TIMEOUT"].includes(err.code) || err.status >= 500) {
        // The order may or may not exist; the same idempotency key is kept so retrying can't duplicate it.
        setPlaceError("We couldn't confirm your order because of a connection problem. Please try again — you won't be charged or ordered twice.");
      } else {
        setPlaceError(err.message);
      }
    }
  };

  if (cartState === "ready" && !cart?.items?.length && !placing) {
    return <EmptyState title="Your bag is empty" action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>}>Add something beautiful before checking out.</EmptyState>;
  }
  if (addressesQ.loading || !cart) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-48" />)}</div>
        <div className="skeleton h-96" />
      </div>
    );
  }
  if (addressesQ.error) return <ErrorState message="We couldn't load your addresses." onRetry={addressesQ.refetch} />;

  const ship = quote?.shipping?.serviceability;
  const lines = quote?.lines || cart?.quote?.lines || [];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="space-y-6">
        <Step n={1} title="Delivery address">
          <Addresses
            addresses={addresses}
            selected={addressId}
            onSelect={setAddressId}
            onAdded={(addr) => {
              addressesQ.refetch();
              setAddressId(addr._id);
            }}
          />
          {ship ? (
            <p className={`mt-4 flex items-center gap-2 text-sm ${ship.serviceable ? "text-ink-soft" : "text-danger"}`}>
              <Icon name="truck" size={17} />
              {ship.serviceable ? <>Estimated delivery by <strong className="font-medium text-ink">{formatDay(ship.estimatedDeliveryDate)}</strong> (estimate, not a courier commitment)</> : `We don't deliver to ${ship.pincode} yet. Choose another address.`}
            </p>
          ) : null}
        </Step>

        <Step n={2} title="Payment">
          {!addressId ? <p className="text-sm text-muted">Add a delivery address to see the payment methods available for your PIN code.</p> : quoteState === "loading" && !quote ? <div className="skeleton h-32" /> : <PaymentOptions quote={quote} method={method} onChange={setMethod} phoneVerified={user?.phoneVerified} onPhoneVerified={loadQuote} />}
        </Step>

        <Step n={3} title="Gift options">
          <GiftOptions cart={cart} />
        </Step>
      </div>

      <aside className="card h-fit space-y-5 p-5 sm:p-6 lg:sticky lg:top-28" aria-label="Order summary">
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {lines.map((l) => (
            <li key={l.sku} className="flex gap-3 text-sm">
              <span className="relative h-16 w-14 shrink-0 overflow-hidden bg-cream-200">
                <Photo src={l.image} alt="" sizes="56px" />
                <span className="absolute -top-0 -right-0 flex h-5 min-w-5 items-center justify-center rounded-bl bg-olive-900 px-1 text-[0.6rem] text-cream-50">{l.quantity}</span>
              </span>
              <span className="flex-1">
                <span className="line-clamp-2 leading-snug">{l.name}</span>
                {l.variantTitle ? <span className="text-xs text-muted">{l.variantTitle}</span> : null}
              </span>
              <span>{money(l.total ?? l.subtotal)}</span>
            </li>
          ))}
        </ul>
        <CouponBox quote={quote} couponCode={cart.couponCode} />
        {quoteState === "error" ? (
          <Notice tone="error">
            {quoteError?.message || "We couldn't calculate your total."}{" "}
            <button type="button" className="underline" onClick={loadQuote}>Retry</button>
          </Notice>
        ) : quote ? (
          <div className={quoteState === "loading" ? "opacity-50 transition-opacity" : ""} aria-busy={quoteState === "loading"}>
            <Totals quote={quote} showShippingNote={false} />
          </div>
        ) : !addressId && cart.quote ? (
          <Totals quote={cart.quote} />
        ) : (
          <div className="skeleton h-40" />
        )}
        {blockingIssues.length ? (
          <div className="space-y-2">
            {blockingIssues.map((i, idx) => <Notice key={idx} tone="warn">{i.sku ? `${lines.find((l) => l.sku === i.sku)?.name || i.sku}: ` : ""}{i.message}</Notice>)}
            {blockingIssues.some((i) => i.sku) ? <Link href="/cart" className="text-sm text-olive-800 underline underline-offset-4">Update your bag</Link> : null}
          </div>
        ) : null}
        {issues.some((i) => i.code === "COUPON_INVALID") ? <Notice tone="warn">{issues.find((i) => i.code === "COUPON_INVALID").message}</Notice> : null}
        {placeError ? <Notice tone="error">{placeError}</Notice> : null}
        <button type="button" className="btn btn-primary w-full" onClick={place} disabled={!canPlace}>
          {placing ? <Spinner size={16} /> : null}
          {placing ? "Placing order…" : method === "cod" ? `Place order · ${quote ? money(quote.totals.total) : ""}` : `Pay ${quote ? money(quote.totals.total) : ""} with UPI`}
        </button>
        {!method && quoteState === "ready" ? <p className="text-xs text-danger">No payment method is available for this order right now.</p> : null}
        <p className="text-center text-xs leading-relaxed text-muted">The final amount is calculated by our server. Your order is confirmed only after we receive the payment confirmation (UPI) or immediately for Cash on Delivery.</p>
      </aside>
    </div>
  );
}
