"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { EmptyState, ErrorState, Notice, Photo, Spinner } from "@/components/ui/bits";
import { useToast } from "@/components/ui/Toast";
import { newIdempotencyKey } from "@/lib/api/client";
import { returnApi, uploadApi } from "@/lib/api/endpoints";
import { invalidate, useQuery } from "@/lib/useQuery";
import { formatDate, label, money, RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from "@/lib/format";

const DAMAGE = ["arrived_broken", "arrived_chipped", "damaged_in_shipping", "defective"];

/**
 * All rules (windows, allowed reasons per item, resolutions, photo requirement) come from
 * GET /returns/eligibility/:order — nothing about the policy is hardcoded here.
 */
export default function NewReturn() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const orderRef = sp.get("order");
  const { data: el, error, loading, refetch } = useQuery(orderRef ? `me:eligibility:${orderRef}` : null, async () => (await returnApi.eligibility(orderRef)).data, { staleMs: 0 });
  const [qty, setQty] = useState({});
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState("");
  const [description, setDescription] = useState("");
  const [missing, setMissing] = useState({});
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const keyRef = useRef(null);

  const selected = useMemo(() => (el?.items || []).filter((i) => qty[i.orderItemId] > 0), [el, qty]);
  // Reasons valid for every selected item.
  const reasons = useMemo(() => {
    if (!selected.length) return [];
    return selected.map((i) => i.allowedReasons).reduce((a, b) => a.filter((r) => b.includes(r)));
  }, [selected]);
  const resolutions = useMemo(() => (selected.length ? selected.map((i) => i.allowedResolutions).reduce((a, b) => a.filter((r) => b.includes(r))) : []), [selected]);
  const needPhotos = el?.policy?.requirePhotosForDamage && DAMAGE.includes(reason);
  const isMissing = reason === "missing_item";
  const effectiveResolution = resolution || (resolutions.length === 1 ? resolutions[0] : "");
  const type = isMissing ? "missing_item" : effectiveResolution === "refund" ? "return" : "replacement";

  if (!orderRef) return <ErrorState title="Choose an order first" message="Open the order you have a problem with from My Orders." />;
  if (loading) return <div className="space-y-4"><div className="skeleton h-12 w-72" /><div className="skeleton h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const eligibleItems = el.items.filter((i) => i.eligible);
  if (!el.orderEligible || !eligibleItems.length) {
    return (
      <EmptyState icon="info" title="Nothing on this order can be returned right now" action={<Link href={`/account/orders/${encodeURIComponent(el.orderNumber)}`} className="btn btn-outline">Back to order</Link>}>
        {el.items.map((i) => i.blockedReason).filter(Boolean)[0] || "Returns open once your order is delivered."}
        {el.openRequests?.length ? <span className="mt-2 block">You already have an open request: {el.openRequests.map((r) => r.requestNumber).join(", ")}.</span> : null}
      </EmptyState>
    );
  }

  const upload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setErr(null);
    try {
      const r = await uploadApi.upload([...files].slice(0, 8 - photos.length), "return");
      setPhotos((p) => [...p, ...r.data].slice(0, 8));
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!selected.length) return setErr("Select at least one item.");
    if (!reason) return setErr("Choose what went wrong.");
    if (needPhotos && !photos.length) return setErr("Please add at least one photo of the damage.");
    if (!isMissing && !effectiveResolution) return setErr("Choose a refund or a replacement.");
    setBusy(true);
    keyRef.current ??= newIdempotencyKey(); // same key on retry → no duplicate claim
    try {
      const body = {
        orderId: el.orderNumber,
        type,
        reason,
        preferredResolution: isMissing ? undefined : effectiveResolution,
        description: description.trim() || undefined,
        photoIds: photos.map((p) => p.id),
        items: selected.map((i) => ({
          orderItemId: i.orderItemId,
          quantity: qty[i.orderItemId],
          ...(isMissing && i.isBundle && missing[i.orderItemId]?.length ? { missingComponents: missing[i.orderItemId] } : {}),
        })),
      };
      const r = await returnApi.create(body, keyRef.current);
      toast.success(r.message);
      invalidate("me:returns");
      invalidate(`me:order:${el.orderNumber}`);
      router.replace(`/account/returns/${r.data.id}`);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Link href={`/account/orders/${encodeURIComponent(el.orderNumber)}`} className="link-arrow text-ink-soft"><Icon name="arrowLeft" size={15} /> Order {el.orderNumber}</Link>
      <div>
        <h1 className="font-display text-4xl">Report a problem</h1>
        <p className="mt-2 text-sm text-muted">Delivered {formatDate(el.deliveredAt)}. Broken, chipped, missing or wrong items — we&apos;ll make it right.</p>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display mb-4 text-2xl">1. Which items?</h2>
        <ul className="divide-y divide-line">
          {el.items.map((i) => (
            <li key={i.orderItemId} className={`py-4 text-sm ${i.eligible ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p>{i.name}</p>
                  <p className="text-xs text-muted">{i.eligible ? `Up to ${i.claimableQty} · ${money(i.unitValue)} each${i.deadlines?.damageReport ? ` · damage reports until ${formatDate(i.deadlines.damageReport)}` : ""}` : i.blockedReason}</p>
                </div>
                {i.eligible ? (
                  <label className="flex items-center gap-2 text-xs">
                    Quantity
                    <select className="input min-h-9 w-20 py-1" value={qty[i.orderItemId] || 0} onChange={(e) => setQty((q) => ({ ...q, [i.orderItemId]: Number(e.target.value) }))}>
                      {Array.from({ length: i.claimableQty + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                ) : null}
              </div>
              {isMissing && i.isBundle && qty[i.orderItemId] > 0 && i.components?.length ? (
                <div className="mt-3 rounded-sm bg-cream-100 p-3">
                  <p className="mb-2 text-xs text-muted">Which pieces were missing?</p>
                  {i.components.map((c) => (
                    <label key={c.sku} className="flex items-center justify-between gap-3 py-1 text-xs">
                      <span>{c.name || c.sku}</span>
                      <input type="number" min="0" max={c.quantity * qty[i.orderItemId]} className="input min-h-8 w-20 py-1 text-xs" onChange={(e) => {
                        const n = Number(e.target.value);
                        setMissing((m) => ({ ...m, [i.orderItemId]: [...(m[i.orderItemId] || []).filter((x) => x.sku !== c.sku), ...(n > 0 ? [{ sku: c.sku, quantity: n }] : [])] }));
                      }} />
                    </label>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display mb-4 text-2xl">2. What went wrong?</h2>
        {!selected.length ? <p className="text-sm text-muted">Select an item above to see the options available for it.</p> : !reasons.length ? <Notice tone="warn">The selected items don&apos;t share a common reason. Submit them in separate requests.</Notice> : (
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
            {reasons.map((r) => (
              <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-[3px] border p-3 text-sm ${reason === r ? "border-olive-900 bg-cream-100" : "border-line hover:border-ink-soft"}`}>
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="h-4 w-4 accent-[var(--olive-800)]" />
                {label(RETURN_REASON_LABELS, r)}
              </label>
            ))}
          </div>
        )}
        {reason && !isMissing && resolutions.length ? (
          <fieldset className="mt-5">
            <legend className="field-label">How should we resolve it?</legend>
            <div className="flex flex-wrap gap-2">
              {resolutions.map((r) => (
                <label key={r} className={`chip cursor-pointer px-4 py-1.5 ${effectiveResolution === r ? "border-olive-900 bg-olive-900 text-cream-50" : ""}`}>
                  <input type="radio" name="res" className="sr-only" checked={resolution === r} onChange={() => setResolution(r)} />
                  {r === "refund" ? "Refund" : "Replacement"}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="mt-5">
          <label htmlFor="ret-desc" className="field-label">Details (optional)</label>
          <textarea id="ret-desc" className="input min-h-24 text-sm" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g. 2 of the 6 glasses were shattered in the box" />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display mb-1 text-2xl">3. Photos {needPhotos ? <span className="text-sm text-danger">(required)</span> : <span className="text-sm text-muted">(optional)</span>}</h2>
        <p className="mb-4 text-sm text-muted">Clear photos of the item and the outer box help us resolve damage claims fastest.</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-[3px] bg-cream-200">
              <Photo src={p.thumbUrl || p.url} alt="Uploaded evidence" sizes="96px" />
              <button type="button" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} className="absolute top-1 right-1 rounded-full bg-cream-50/90 p-1" aria-label="Remove photo"><Icon name="close" size={12} /></button>
            </div>
          ))}
          {photos.length < 8 ? (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[3px] border border-dashed border-line text-xs text-muted hover:border-ink">
              {uploading ? <Spinner /> : <Icon name="camera" size={22} />}
              {uploading ? "Uploading" : "Add photos"}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={uploading} />
            </label>
          ) : null}
        </div>
      </section>

      {el.openRequests?.length ? <Notice tone="info">Open requests on this order: {el.openRequests.map((r) => `${r.requestNumber} (${label(RETURN_STATUS_LABELS, r.status).toLowerCase()})`).join(", ")}</Notice> : null}
      {err ? <Notice tone="error">{err}</Notice> : null}
      <button type="submit" className="btn btn-primary" disabled={busy || uploading}>{busy ? <Spinner size={16} /> : null} Submit request</button>
    </form>
  );
}
