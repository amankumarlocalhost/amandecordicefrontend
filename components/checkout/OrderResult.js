"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { ErrorState, Notice, Spinner } from "@/components/ui/bits";
import { orderApi } from "@/lib/api/endpoints";
import { useQuery } from "@/lib/useQuery";
import { formatDay, label, money, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/format";
import PayNow from "./PayNow";

const PAYMENT_NOTES = {
  init_failed: "We couldn't open the payment window. Your items are reserved — tap Pay now to try again.",
  dismissed: "The payment window was closed before paying. Your items are reserved for a short time.",
  failed: "The payment didn't go through. No money is taken for failed attempts; you can try again.",
  verifying: "We received a response from the payment provider and are confirming it with the bank.",
  refunding: "Your payment was received but the order couldn't be fulfilled. A full refund has been initiated.",
};

export default function OrderResult() {
  const sp = useSearchParams();
  const router = useRouter();
  const ref = sp.get("order");
  const paymentHint = sp.get("payment");
  const { data: order, error, loading, refetch } = useQuery(ref ? `me:order:${ref}` : null, async () => (await orderApi.get(ref)).data, { staleMs: 0 });
  const [polls, setPolls] = useState(0);
  const timer = useRef(null);

  // While a UPI payment is being confirmed (webhook/verification), poll briefly. Capped: never forever.
  const awaiting = order && order.paymentMethod === "upi" && order.status === "pending" && ["verifying", "confirmed", "duplicate"].includes(paymentHint);
  useEffect(() => {
    if (!awaiting || polls >= 20) return;
    timer.current = setTimeout(() => {
      setPolls((p) => p + 1);
      refetch();
    }, 3000);
    return () => clearTimeout(timer.current);
  }, [awaiting, polls, refetch]);

  if (!ref) return <ErrorState title="No order specified" message="Open your order from My Orders." />;
  if (loading) return <div className="flex justify-center py-24"><Spinner size={26} className="text-olive-800" /></div>;
  if (error) return <ErrorState title="We couldn't load this order" message={error.message} onRetry={refetch} />;

  const confirmed = order.status !== "pending" && order.status !== "cancelled";
  const paid = ["paid", "cod_due", "cod_collected"].includes(order.paymentStatus) || order.paymentMethod === "cod";
  const onOutcome = (o) => {
    const p = o.status === "verified" ? o.result.outcome : o.status === "verify_error" ? "verifying" : o.lastError ? "failed" : "dismissed";
    setPolls(0);
    router.replace(`/checkout/result?order=${encodeURIComponent(order.orderNumber)}&payment=${p}`);
    refetch();
  };

  return (
    <div className="mx-auto max-w-2xl text-center">
      {confirmed ? (
        <>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive-900 text-cream-50"><Icon name="check" size={28} /></span>
          <h1 className="font-display mt-6 text-4xl sm:text-5xl">Thank you for your order</h1>
          <p className="mt-3 text-ink-soft">Order <strong className="font-medium text-ink">{order.orderNumber}</strong> is {label(ORDER_STATUS_LABELS, order.status).toLowerCase()}.</p>
        </>
      ) : order.status === "cancelled" ? (
        <>
          <h1 className="font-display text-4xl">Order {order.orderNumber} was cancelled</h1>
          {order.cancelReason ? <p className="mt-3 text-ink-soft">{order.cancelReason}</p> : null}
        </>
      ) : (
        <>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-warn">{awaiting && polls < 20 ? <Spinner size={26} /> : <Icon name="info" size={28} />}</span>
          <h1 className="font-display mt-6 text-4xl">{awaiting && polls < 20 ? "Confirming your payment…" : "Awaiting payment"}</h1>
          <p className="mt-3 text-ink-soft">Order <strong className="font-medium text-ink">{order.orderNumber}</strong> · {money(order.pricing.total)}</p>
          {PAYMENT_NOTES[paymentHint] ? <Notice tone={paymentHint === "failed" ? "error" : "info"} className="mt-5 text-left">{PAYMENT_NOTES[paymentHint]}</Notice> : null}
          {awaiting && polls >= 20 ? <Notice tone="info" className="mt-5 text-left">This is taking longer than usual. If money left your account, the order will be confirmed automatically, or refunded in full — you don&apos;t need to pay again. Check My Orders for updates.</Notice> : null}
          {!awaiting ? <div className="mt-6 flex justify-center"><PayNow order={order} onOutcome={onOutcome} /></div> : null}
        </>
      )}

      <div className="card mt-10 p-6 text-left">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted">Payment</dt><dd className="mt-0.5">{order.paymentMethod === "cod" ? "Cash on Delivery" : "UPI"} · {label(PAYMENT_STATUS_LABELS, order.paymentStatus)}</dd></div>
          <div><dt className="text-xs text-muted">Total</dt><dd className="mt-0.5 font-medium">{money(order.pricing.total)}</dd></div>
          {order.estimatedDeliveryDate && confirmed ? <div><dt className="text-xs text-muted">Estimated delivery</dt><dd className="mt-0.5">{formatDay(order.estimatedDeliveryDate)}</dd></div> : null}
          <div><dt className="text-xs text-muted">Delivering to</dt><dd className="mt-0.5">{order.shippingAddress?.fullName}, {order.shippingAddress?.city} {order.shippingAddress?.pincode}</dd></div>
        </dl>
        {confirmed && paid ? <p className="mt-4 text-xs text-muted">We&apos;ll notify you as your order is packed and shipped.</p> : null}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="btn btn-primary">View order</Link>
        <Link href="/shop" className="btn btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
