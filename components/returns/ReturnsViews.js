"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { EmptyState, ErrorState, Notice, Photo, Spinner, StatusPill } from "@/components/ui/bits";
import { ConfirmDialog } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { returnApi } from "@/lib/api/endpoints";
import { invalidate, useQuery } from "@/lib/useQuery";
import { formatDate, formatDateTime, humanize, label, money, REFUND_STATUS_LABELS, REPLACEMENT_STATUS_LABELS, RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from "@/lib/format";

const tone = (s) => (["resolved", "closed", "approved", "delivered"].includes(s) ? "good" : ["rejected", "cancelled"].includes(s) ? "bad" : "warn");
const TYPE_LABEL = { return: "Return", replacement: "Replacement", missing_item: "Missing item" };

export function ReturnsList() {
  const [tab, setTab] = useState("requests");
  const requests = useQuery(tab === "requests" ? "me:returns:list" : null, async () => (await returnApi.list({ limit: 50 })).data);
  const replacements = useQuery(tab === "replacements" ? "me:returns:replacements" : null, async () => (await returnApi.replacements({ limit: 50 })).data);
  const q = tab === "requests" ? requests : replacements;
  return (
    <div>
      <h1 className="font-display text-4xl">Returns &amp; Replacements</h1>
      <p className="mt-2 text-sm text-muted">To report a broken, chipped, missing or wrong item, open the order in <Link href="/account/orders" className="underline">My Orders</Link> and choose “Report a problem”.</p>
      <div className="mt-6 flex gap-2" role="tablist">
        {[["requests", "Requests"], ["replacements", "Replacement shipments"]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`chip px-4 py-1.5 ${tab === k ? "border-olive-900 bg-olive-900 text-cream-50" : ""}`}>{l}</button>
        ))}
      </div>
      {q.loading ? (
        <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : q.error ? (
        <ErrorState message={q.error.message} onRetry={q.refetch} />
      ) : !q.data?.length ? (
        <EmptyState icon="refresh" title={tab === "requests" ? "No requests yet" : "No replacement shipments"}>Nothing here — we hope everything arrived perfectly.</EmptyState>
      ) : tab === "requests" ? (
        <ul className="mt-6 space-y-3">
          {q.data.map((r) => (
            <li key={r.id}>
              <Link href={`/account/returns/${r.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 hover:border-ink-soft">
                <div className="text-sm">
                  <p className="font-medium">{r.requestNumber} · {TYPE_LABEL[r.type] || humanize(r.type)}</p>
                  <p className="text-xs text-muted">Order {r.orderNumber} · {label(RETURN_REASON_LABELS, r.reason)} · {formatDate(r.createdAt)}</p>
                </div>
                <StatusPill tone={tone(r.status)}>{label(RETURN_STATUS_LABELS, r.status)}</StatusPill>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 space-y-3">
          {q.data.map((r) => (
            <li key={r._id} className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
              <div>
                <p className="font-medium">{r.replacementNumber} · Order {r.orderNumber}</p>
                <p className="text-xs text-muted">{r.items?.map((i) => `${i.quantity}× ${i.name || i.sku}`).join(", ")}</p>
                {r.shippedAt ? <p className="text-xs text-muted">Shipped {formatDate(r.shippedAt)}</p> : null}
              </div>
              <StatusPill tone={tone(r.status)}>{label(REPLACEMENT_STATUS_LABELS, r.status)}</StatusPill>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReturnDetail({ id }) {
  const toast = useToast();
  const { data: r, error, loading, refetch } = useQuery(`me:returns:${id}`, async () => (await returnApi.get(id)).data, { staleMs: 5000 });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="space-y-4"><div className="skeleton h-12 w-64" /><div className="skeleton h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  const cancellable = ["requested", "awaiting_review"].includes(r.status);

  return (
    <div className="space-y-6">
      <Link href="/account/returns" className="link-arrow text-ink-soft"><Icon name="arrowLeft" size={15} /> All requests</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{TYPE_LABEL[r.type] || "Request"} {r.requestNumber}</h1>
          <p className="mt-1 text-sm text-muted">For order <Link className="underline" href={`/account/orders/${encodeURIComponent(r.orderNumber)}`}>{r.orderNumber}</Link> · {formatDateTime(r.createdAt)}</p>
        </div>
        <StatusPill tone={tone(r.status)}>{label(RETURN_STATUS_LABELS, r.status)}</StatusPill>
      </div>
      {r.status === "awaiting_review" ? <Notice tone="info">Our team is reviewing your request and usually responds within 24 hours. We&apos;ll notify you of any update.</Notice> : null}
      {r.pickup ? <Notice tone="info">Pickup {r.pickup.scheduledAt ? `scheduled for ${formatDateTime(r.pickup.scheduledAt)}` : "will be scheduled"}. {r.pickup.instructions || "Please pack the item securely."}</Notice> : null}

      <section className="card p-5 sm:p-6">
        <h2 className="font-display mb-4 text-2xl">Details</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted">Reason</dt><dd>{label(RETURN_REASON_LABELS, r.reason)}</dd></div>
          {r.preferredResolution ? <div><dt className="text-xs text-muted">Preferred resolution</dt><dd>{humanize(r.preferredResolution)}</dd></div> : null}
          {r.claimValue ? <div><dt className="text-xs text-muted">Claim value</dt><dd>{money(r.claimValue)}</dd></div> : null}
        </dl>
        <ul className="mt-4 space-y-1 text-sm">
          {r.items.map((i) => (
            <li key={i.orderItemId}>{i.quantity}× {i.name}{i.missingComponents?.length ? ` — missing: ${i.missingComponents.map((c) => `${c.quantity}× ${c.sku}`).join(", ")}` : ""}</li>
          ))}
        </ul>
        {r.photos?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {r.photos.map((p) => (
              <li key={p.url} className="relative h-20 w-20 overflow-hidden rounded-[3px] bg-cream-200"><a href={p.url} target="_blank" rel="noopener noreferrer"><Photo src={p.thumbUrl || p.url} alt="Evidence photo" sizes="80px" /></a></li>
            ))}
          </ul>
        ) : null}
      </section>

      {r.resolution ? (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display mb-3 text-2xl">Resolution</h2>
          <p className="text-sm">{humanize(r.resolution.type)}{r.resolution.amount ? ` · ${money(r.resolution.amount)}` : ""}</p>
          {r.resolution.note ? <p className="mt-1 text-sm text-ink-soft">{r.resolution.note}</p> : null}
          {r.refund?.status ? <p className="mt-2 text-sm">Refund: {label(REFUND_STATUS_LABELS, r.refund.status)}</p> : null}
          {r.replacement?.status ? <p className="mt-2 text-sm">Replacement: {label(REPLACEMENT_STATUS_LABELS, r.replacement.status)}</p> : null}
        </section>
      ) : null}

      <section className="card p-5 sm:p-6">
        <h2 className="font-display mb-4 text-2xl">Progress</h2>
        <ol className="relative space-y-4 border-l border-line pl-6">
          {(r.timeline || []).map((t, i, arr) => (
            <li key={i} className="relative">
              <span className={`absolute top-1 -left-[1.92rem] h-3 w-3 rounded-full border-2 ${i === arr.length - 1 ? "border-olive-900 bg-olive-900" : "border-olive-700 bg-cream-50"}`} />
              <p className="text-sm font-medium">{label(RETURN_STATUS_LABELS, t.status)}</p>
              <p className="text-xs text-muted">{formatDateTime(t.at)}</p>
            </li>
          ))}
        </ol>
      </section>

      {cancellable ? <button type="button" className="btn btn-outline" onClick={() => setConfirm(true)}>Withdraw request</button> : null}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        busy={busy}
        title="Withdraw this request?"
        confirmLabel="Withdraw"
        tone="danger"
        onConfirm={async () => {
          setBusy(true);
          try {
            await returnApi.cancel(r.id);
            toast.success("Request withdrawn");
            invalidate("me:returns");
            refetch();
          } catch (err) {
            toast.error(err.message);
          } finally {
            setBusy(false);
            setConfirm(false);
          }
        }}
      >
        The items will become claimable again if you change your mind within the policy window.
      </ConfirmDialog>
      {busy ? <Spinner /> : null}
    </div>
  );
}
