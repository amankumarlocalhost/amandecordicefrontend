"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, Photo, StatusPill } from "@/components/ui/bits";
import { orderApi } from "@/lib/api/endpoints";
import { useQuery } from "@/lib/useQuery";
import { formatDate, formatDay, label, money, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/format";

export function orderTone(status) {
  if (["delivered", "completed"].includes(status)) return "good";
  if (["cancelled", "delivery_failed", "returned_to_origin"].includes(status)) return "bad";
  if (["pending", "return_requested", "replacement_processing"].includes(status)) return "warn";
  return "neutral";
}

const FILTERS = [
  ["", "All"],
  ["pending", "Awaiting payment"],
  ["confirmed", "Confirmed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];

export default function OrdersList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, error, loading, fetching, refetch } = useQuery(`me:orders:${status}:${page}`, async () => {
    const r = await orderApi.list({ page, limit: 10, status: status || undefined });
    return { items: r.data, meta: r.meta };
  });

  return (
    <div>
      <h1 className="font-display text-4xl">My Orders</h1>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {FILTERS.map(([v, l]) => (
          <button key={v} type="button" onClick={() => { setStatus(v); setPage(1); }} aria-pressed={status === v} className={`chip shrink-0 px-4 py-1.5 ${status === v ? "border-olive-900 bg-olive-900 text-cream-50" : "hover:border-ink"}`}>
            {l}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-6 space-y-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-32" />)}</div>
      ) : error ? (
        <ErrorState message="We couldn't load your orders." onRetry={refetch} />
      ) : !data.items.length ? (
        <EmptyState icon="box" title={status ? "No orders with this status" : "No orders yet"} action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>}>Your orders will appear here once you place one.</EmptyState>
      ) : (
        <>
          <ul className={`mt-6 space-y-4 ${fetching ? "opacity-70" : ""}`}>
            {data.items.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${encodeURIComponent(o.orderNumber)}`} className="card block p-5 transition-colors hover:border-ink-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted">Placed {formatDate(o.createdAt)} · {money(o.total)} · {o.paymentMethod === "cod" ? "COD" : "UPI"} ({label(PAYMENT_STATUS_LABELS, o.paymentStatus).toLowerCase()})</p>
                    </div>
                    <StatusPill tone={orderTone(o.status)}>{label(ORDER_STATUS_LABELS, o.status)}</StatusPill>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {o.items.slice(0, 5).map((it, i) => (
                      <span key={it.sku + i} className="relative h-14 w-14 overflow-hidden bg-cream-200" title={it.name}>
                        <Photo src={it.image} alt={it.name} sizes="56px" />
                      </span>
                    ))}
                    {o.items.length > 5 ? <span className="text-xs text-muted">+{o.items.length - 5} more</span> : null}
                    <span className="ml-auto text-right text-xs text-muted">
                      {o.deliveredAt ? `Delivered ${formatDate(o.deliveredAt)}` : o.estimatedDeliveryDate && !["cancelled", "pending"].includes(o.status) ? `Arriving by ${formatDay(o.estimatedDeliveryDate)}` : null}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {data.meta?.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-muted">Page {page} of {data.meta.totalPages}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
