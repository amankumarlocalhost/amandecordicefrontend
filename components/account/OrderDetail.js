"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { ErrorState, Notice, Photo, Spinner, StatusPill } from "@/components/ui/bits";
import { Dialog } from "@/components/ui/Overlay";
import { Field } from "@/components/forms/Field";
import { useToast } from "@/components/ui/Toast";
import PayNow from "@/components/checkout/PayNow";
import { openChat } from "@/components/chat/ChatLauncher";
import { orderApi, returnApi } from "@/lib/api/endpoints";
import { invalidate, useQuery } from "@/lib/useQuery";
import { formatDate, formatDateTime, formatDay, humanize, label, money, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, REFUND_STATUS_LABELS } from "@/lib/format";
import { orderTone } from "./OrdersList";

const CANCELLABLE = ["pending", "confirmed", "processing"];
const RETURNABLE = ["delivered", "completed", "return_requested", "replacement_processing"];
const FLOW = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

function Timeline({ order }) {
  const events = order.timeline || [];
  const reached = new Map(events.map((e) => [e.status, e.at]));
  const offFlow = ["cancelled", "delivery_failed", "returned_to_origin", "return_requested", "returned", "replacement_processing", "completed"];
  const normal = !events.some((e) => offFlow.includes(e.status)) && order.status !== "pending";
  if (!normal) {
    return (
      <ol className="relative space-y-4 border-l border-line pl-6">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <span className={`absolute top-1 -left-[1.92rem] h-3 w-3 rounded-full border-2 ${i === events.length - 1 ? "border-olive-900 bg-olive-900" : "border-olive-700 bg-cream-50"}`} />
            <p className="text-sm font-medium">{label(ORDER_STATUS_LABELS, e.status)}</p>
            <p className="text-xs text-muted">{formatDateTime(e.at)}</p>
          </li>
        ))}
      </ol>
    );
  }
  const lastIdx = Math.max(...FLOW.map((s, i) => (reached.has(s) ? i : -1)));
  return (
    <ol className="grid gap-4 sm:grid-cols-5 sm:gap-2">
      {FLOW.map((s, i) => {
        const done = i <= lastIdx;
        return (
          <li key={s} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span className="flex w-full items-center">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-olive-900 text-cream-50" : "border border-line bg-cream-50 text-muted"}`}>
                {done ? <Icon name="check" size={14} /> : <span className="text-[0.65rem]">{i + 1}</span>}
              </span>
              {i < FLOW.length - 1 ? <span className={`hidden h-px flex-1 sm:block ${i < lastIdx ? "bg-olive-900" : "bg-line"}`} /> : null}
            </span>
            <span>
              <span className={`block text-sm ${done ? "font-medium" : "text-muted"}`}>{label(ORDER_STATUS_LABELS, s)}</span>
              {reached.get(s) ? <span className="block text-xs text-muted">{formatDateTime(reached.get(s))}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Tracking({ orderRef }) {
  const { data, loading } = useQuery(`me:order:${orderRef}:tracking`, async () => (await orderApi.tracking(orderRef)).data);
  if (loading) return <div className="skeleton h-16" />;
  const shipments = data?.shipments || [];
  if (!shipments.length) return <p className="text-sm text-muted">Tracking details will appear here once your parcel is handed to the courier.</p>;
  return (
    <ul className="space-y-5">
      {shipments.map((s) => (
        <li key={s._id} className="text-sm">
          <p className="font-medium">{s.kind === "replacement" ? "Replacement shipment" : "Shipment"} · {s.courier ? humanize(s.courier) : "Courier"} {s.awb ? `· AWB ${s.awb}` : ""}</p>
          <p className="text-xs text-muted">{label(ORDER_STATUS_LABELS, s.status)}</p>
          {s.trackingUrl ? <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-olive-800 underline underline-offset-4">Track on courier website <Icon name="arrowRight" size={12} /></a> : null}
          {s.events?.length ? (
            <ol className="mt-3 space-y-2 border-l border-line pl-4">
              {[...s.events].reverse().map((e, i) => (
                <li key={i}>
                  <p className="text-xs">{humanize(e.status)}{e.location ? ` — ${e.location}` : ""}{e.note ? ` · ${e.note}` : ""}</p>
                  <p className="text-[0.68rem] text-muted">{formatDateTime(e.at)}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CancelDialog({ order, open, onClose, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    if (reason.trim().length < 3) return setError("Please tell us why (at least 3 characters).");
    setBusy(true);
    setError(null);
    try {
      const r = await orderApi.cancel(order.orderNumber, reason.trim());
      toast.success(r.data.refund ? `Order cancelled. Refund ${r.data.refund.refundNumber} (${money(r.data.refund.amount)}) — ${label(REFUND_STATUS_LABELS, r.data.refund.status).toLowerCase()}.` : "Order cancelled.");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={busy ? () => {} : onClose} title="Cancel order" size="sm" footer={
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={busy}>Keep order</button>
        <button type="button" className="btn btn-sm bg-danger text-cream-50" onClick={submit} disabled={busy}>{busy ? <Spinner size={14} /> : null} Cancel order</button>
      </div>
    }>
      <p className="mb-4 text-sm text-ink-soft">Orders can be cancelled until they are packed. {order.paymentStatus === "paid" ? "Your UPI payment will be refunded to the original account." : ""}</p>
      <label htmlFor="cancel-reason" className="field-label">Reason</label>
      <select id="cancel-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="">Select a reason</option>
        {["Ordered by mistake", "Found a better price", "Delivery date is too late", "Want to change items or address", "Other"].map((r) => <option key={r}>{r}</option>)}
      </select>
      {error ? <p className="field-error">{error}</p> : null}
    </Dialog>
  );
}

function Invoice({ orderRef, open, onClose }) {
  const { data, loading, error } = useQuery(open ? `me:order:${orderRef}:invoice` : null, async () => (await orderApi.invoice(orderRef)).data);
  return (
    <Dialog open={open} onClose={onClose} title="Tax invoice" size="lg" footer={<div className="flex justify-end"><button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>Print</button></div>}>
      {loading ? <div className="skeleton h-40" /> : error ? <p className="text-sm text-danger">{error.message}</p> : data ? (
        <div className="text-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-medium">{data.seller.name}</p>
              {data.seller.gstin ? <p className="text-xs text-muted">GSTIN {data.seller.gstin}</p> : null}
            </div>
            <div className="text-right text-xs text-muted">
              <p>{data.invoiceNumber}</p>
              <p>Order {data.orderNumber} · {formatDate(data.date)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">Bill to: {data.billTo?.fullName}, {[data.billTo?.line1, data.billTo?.city, data.billTo?.state, data.billTo?.pincode].filter(Boolean).join(", ")}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-xs">
              <thead className="border-b border-line text-left text-muted"><tr><th className="py-2 font-normal">Item</th><th className="font-normal">HSN</th><th className="font-normal">Qty</th><th className="font-normal">GST</th><th className="text-right font-normal">Taxable</th><th className="text-right font-normal">Tax</th><th className="text-right font-normal">Total</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.lines.map((l) => (
                  <tr key={l.sku}><td className="py-2">{l.description}</td><td>{l.hsn || "—"}</td><td>{l.quantity}</td><td>{l.gstRateBps ? `${l.gstRateBps / 100}%` : "—"}</td><td className="text-right">{money(l.taxable)}</td><td className="text-right">{money(l.taxAmount)}</td><td className="text-right">{money(l.gross)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-right text-xs">
            {data.charges.shipping ? <p>Shipping {money(data.charges.shipping)}</p> : null}
            {data.charges.codFee ? <p>COD fee {money(data.charges.codFee)}</p> : null}
            {data.charges.giftWrap ? <p>Gift wrap {money(data.charges.giftWrap)}</p> : null}
            <p>Total tax {money(data.taxTotal)}</p>
            <p className="text-sm font-medium">Grand total {money(data.total)}</p>
            <p className="text-muted">{data.note}</p>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function PayoutForm({ refund, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState("vpa");
  const [f, setF] = useState({ vpa: "", accountName: "", accountNumber: "", ifsc: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await returnApi.refundDestination(refund.id, mode === "vpa" ? { vpa: f.vpa.trim() } : { accountName: f.accountName.trim(), accountNumber: f.accountNumber.trim(), ifsc: f.ifsc.trim() });
      toast.success("Payout details saved");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-sm border border-dashed border-line p-4">
      <p className="text-xs text-ink-soft">This was a Cash on Delivery order, so tell us where to send your refund.</p>
      <div className="flex gap-2 text-xs">
        {[["vpa", "UPI ID"], ["bank", "Bank account"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setMode(k)} aria-pressed={mode === k} className={`chip ${mode === k ? "border-olive-900 bg-olive-900 text-cream-50" : ""}`}>{l}</button>
        ))}
      </div>
      {mode === "vpa" ? (
        <Field label="UPI ID" value={f.vpa} onChange={(e) => setF({ ...f, vpa: e.target.value })} placeholder="name@bank" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Account holder" value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} />
          <Field label="Account number" value={f.accountNumber} inputMode="numeric" onChange={(e) => setF({ ...f, accountNumber: e.target.value.replace(/\D/g, "") })} />
          <Field label="IFSC" value={f.ifsc} onChange={(e) => setF({ ...f, ifsc: e.target.value.toUpperCase() })} />
        </div>
      )}
      {error ? <p className="field-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? <Spinner size={14} /> : null} Save payout details</button>
      <p className="text-[0.68rem] text-muted">We store only the last 4 digits of bank accounts; our team confirms payout details with you before paying.</p>
    </form>
  );
}

export default function OrderDetail({ orderRef }) {
  const key = `me:order:${orderRef}`;
  const { data: o, error, loading, refetch } = useQuery(key, async () => (await orderApi.get(orderRef)).data, { staleMs: 5000 });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (loading) return <div className="space-y-4"><div className="skeleton h-12 w-64" /><div className="skeleton h-40" /><div className="skeleton h-64" /></div>;
  if (error) return <ErrorState title={error.status === 404 ? "Order not found" : "We couldn't load this order"} message={error.status === 404 ? "Check the order number in My Orders." : error.message} onRetry={error.status === 404 ? undefined : refetch} />;

  const refresh = () => {
    refetch();
    invalidate("me:orders");
  };
  const p = o.pricing;
  const canCancel = CANCELLABLE.includes(o.status);
  const canReturn = RETURNABLE.includes(o.status);
  const awaitingUpi = o.paymentMethod === "upi" && o.status === "pending";

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="link-arrow text-ink-soft"><Icon name="arrowLeft" size={15} /> All orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Order {o.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(o.createdAt)}</p>
        </div>
        <StatusPill tone={orderTone(o.status)}>{label(ORDER_STATUS_LABELS, o.status)}</StatusPill>
      </div>

      {awaitingUpi ? (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Payment pending</p>
            <p className="text-sm text-muted">This order will be confirmed once your UPI payment is verified.</p>
          </div>
          <PayNow order={o} onOutcome={() => setTimeout(refresh, 1500)} />
        </div>
      ) : null}
      {o.status === "cancelled" && o.cancelReason ? <Notice tone="info">Cancelled: {o.cancelReason}</Notice> : null}

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Status</h2>
          {o.estimatedDeliveryDate && !["delivered", "completed", "cancelled", "pending"].includes(o.status) ? <p className="text-sm text-ink-soft">Estimated delivery <strong className="font-medium text-ink">{formatDay(o.estimatedDeliveryDate)}</strong></p> : null}
        </div>
        <Timeline order={o} />
        {!["pending", "cancelled"].includes(o.status) ? (
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 text-[0.68rem] font-medium tracking-[0.18em] uppercase">Tracking</h3>
            <Tracking orderRef={o.orderNumber} />
          </div>
        ) : null}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display mb-4 text-2xl">Items</h2>
        <ul className="divide-y divide-line">
          {o.items.map((it) => (
            <li key={it.id} className="flex gap-4 py-4">
              <Link href={`/products/${it.slug}`} className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream-200"><Photo src={it.image} alt={it.name} sizes="64px" /></Link>
              <div className="flex-1 text-sm">
                <Link href={`/products/${it.slug}`} className="hover:underline">{it.name}</Link>
                {it.variantTitle ? <p className="text-xs text-muted">{it.variantTitle}</p> : null}
                <p className="text-xs text-muted">Qty {it.quantity} · {money(it.unitPrice)} each</p>
                {it.claimedQty ? <p className="text-xs text-warn">{it.claimedQty} under a return/replacement request</p> : null}
                {["delivered", "completed"].includes(o.status) ? <Link href={`/products/${it.slug}#reviews`} className="mt-1 inline-block text-xs text-olive-800 underline underline-offset-4">Write a review</Link> : null}
              </div>
              <p className="text-sm">{money(it.total)}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="font-display mb-4 text-2xl">Payment</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Method</dt><dd>{o.paymentMethod === "cod" ? "Cash on Delivery" : "UPI"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Status</dt><dd>{label(PAYMENT_STATUS_LABELS, o.paymentStatus)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{money(p.subtotal)}</dd></div>
            {p.promotionDiscount ? <div className="flex justify-between text-success"><dt>Offers</dt><dd>−{money(p.promotionDiscount)}</dd></div> : null}
            {p.couponDiscount ? <div className="flex justify-between text-success"><dt>Coupon {o.coupon?.code}</dt><dd>−{money(p.couponDiscount)}</dd></div> : null}
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{p.shippingFee ? money(p.shippingFee) : "Free"}</dd></div>
            {p.giftWrapFee ? <div className="flex justify-between"><dt className="text-muted">Gift wrap</dt><dd>{money(p.giftWrapFee)}</dd></div> : null}
            {p.codFee ? <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd>{money(p.codFee)}</dd></div> : null}
            <div className="flex justify-between border-t border-line pt-2 font-medium"><dt>Total</dt><dd>{money(p.total)}</dd></div>
            <p className="text-xs text-muted">Includes GST of {money(p.taxTotal)}</p>
          </dl>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="font-display mb-4 text-2xl">Delivery address</h2>
          <address className="text-sm leading-relaxed not-italic text-ink-soft">
            <span className="block font-medium text-ink">{o.shippingAddress?.fullName}</span>
            {[o.shippingAddress?.line1, o.shippingAddress?.line2, o.shippingAddress?.landmark].filter(Boolean).join(", ")}
            <br />
            {o.shippingAddress?.city}, {o.shippingAddress?.state} {o.shippingAddress?.pincode}
            <br />
            {o.shippingAddress?.phone}
          </address>
          {o.giftMessage ? <p className="mt-3 text-xs text-muted">Gift message: “{o.giftMessage}”</p> : null}
        </section>
      </div>

      {o.refunds?.length ? (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display mb-4 text-2xl">Refunds</h2>
          <ul className="space-y-4">
            {o.refunds.map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{r.refundNumber} · {money(r.amount)}</span>
                  <StatusPill tone={r.status === "processed" ? "good" : r.status === "rejected" || r.status === "failed" ? "bad" : "warn"}>{label(REFUND_STATUS_LABELS, r.status)}</StatusPill>
                </div>
                <p className="text-xs text-muted">{r.processedAt ? `Completed ${formatDate(r.processedAt)}` : `Requested ${formatDate(r.createdAt)}`}{r.reason ? ` · ${humanize(r.reason)}` : ""}</p>
                {r.needsPayoutDetails ? <PayoutForm refund={r} onDone={refresh} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {canReturn ? <Link href={`/account/returns/new?order=${encodeURIComponent(o.orderNumber)}`} className="btn btn-primary">Report a problem / Return</Link> : null}
        {canCancel ? <button type="button" className="btn btn-outline" onClick={() => setCancelOpen(true)}>Cancel order</button> : null}
        {!["pending", "cancelled"].includes(o.status) ? <button type="button" className="btn btn-outline" onClick={() => setInvoiceOpen(true)}>Invoice</button> : null}
        <button type="button" className="btn btn-ghost" onClick={openChat}><Icon name="chat" size={16} /> Get help</button>
      </div>

      <CancelDialog order={o} open={cancelOpen} onClose={() => setCancelOpen(false)} onDone={() => { setCancelOpen(false); refresh(); }} />
      <Invoice orderRef={o.orderNumber} open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  );
}
