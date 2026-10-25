"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { EmptyState, ErrorState, Notice, Spinner, StatusPill } from "@/components/ui/bits";
import { ConfirmDialog } from "@/components/ui/Overlay";
import { Field } from "@/components/forms/Field";
import { useToast } from "@/components/ui/Toast";
import AddressForm from "./AddressForm";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useCart } from "@/components/providers/CartProvider";
import { addressApi, notificationApi, supportApi, wishlistApi } from "@/lib/api/endpoints";
import { useQuery } from "@/lib/useQuery";
import { formatDate, formatDateTime, humanize } from "@/lib/format";

// ------------------------------------------------------------------ addresses
export function AddressesView() {
  const toast = useToast();
  const { data, error, loading, refetch } = useQuery("me:addresses", async () => (await addressApi.list()).data);
  const [editing, setEditing] = useState(null); // null | "new" | address
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="space-y-4"><div className="skeleton h-12 w-56" /><div className="skeleton h-40" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Addresses</h1>
        {editing ? null : <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing("new")}><Icon name="plus" size={15} /> Add address</button>}
      </div>
      {editing ? (
        <div className="card mt-6 p-5 sm:p-6">
          <h2 className="font-display mb-4 text-2xl">{editing === "new" ? "New address" : "Edit address"}</h2>
          <AddressForm address={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); toast.success("Address saved"); }} />
        </div>
      ) : null}
      {!data.length && !editing ? (
        <EmptyState icon="pin" title="No saved addresses">Add one now to check out faster.</EmptyState>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {data.map((a) => (
            <li key={a._id} className="card flex flex-col p-5 text-sm">
              <p className="flex items-center gap-2 font-medium">{a.fullName} <span className="badge bg-cream-200 text-ink-soft">{a.type}</span>{a.isDefault ? <StatusPill tone="good">Default</StatusPill> : null}</p>
              <p className="mt-2 leading-relaxed text-ink-soft">{[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <button type="button" className="text-olive-800 underline underline-offset-4" onClick={() => setEditing(a)}>Edit</button>
                {!a.isDefault ? <button type="button" className="text-olive-800 underline underline-offset-4" onClick={async () => { try { await addressApi.makeDefault(a._id); refetch(); } catch (e) { toast.error(e.message); } }}>Set as default</button> : null}
                <button type="button" className="text-danger underline underline-offset-4" onClick={() => setRemoving(a)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} busy={busy} title="Delete this address?" confirmLabel="Delete" tone="danger" onConfirm={async () => {
        setBusy(true);
        try {
          await addressApi.remove(removing._id);
          refetch();
        } catch (e) {
          toast.error(e.message);
        } finally {
          setBusy(false);
          setRemoving(null);
        }
      }}>
        {removing ? `${removing.fullName}, ${removing.city} ${removing.pincode}` : null}
      </ConfirmDialog>
    </div>
  );
}

// ------------------------------------------------------------------ wishlist
export function WishlistView() {
  const { items, state, refresh } = useWishlist();
  const { refresh: refreshCart, openDrawer } = useCart();
  const toast = useToast();
  const [moving, setMoving] = useState(null);
  const move = async (it) => {
    setMoving(it.productId);
    try {
      await wishlistApi.moveToCart(it.productId, it.sku || it.product.defaultSku);
      await Promise.all([refresh(), refreshCart()]);
      openDrawer();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setMoving(null);
    }
  };
  return (
    <div>
      <h1 className="font-display text-4xl">Wishlist</h1>
      {state === "loading" && !items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton aspect-[4/5]" />)}</div>
      ) : state === "error" ? (
        <ErrorState message="We couldn't load your wishlist." onRetry={refresh} />
      ) : !items.length ? (
        <EmptyState icon="heart" title="Nothing saved yet" action={<Link href="/shop" className="btn btn-primary">Discover pieces</Link>}>Tap the heart on any product to save it here.</EmptyState>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
          {items.map((it) => (
            <li key={it.productId}>
              {it.product ? (
                <>
                  <ProductCard product={it.product} />
                  {it.product.inStock ? (
                    <button type="button" className="btn btn-outline btn-sm mt-3 w-full" disabled={moving === it.productId} onClick={() => move(it)}>
                      {moving === it.productId ? <Spinner size={14} /> : null} Move to bag
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="card p-4 text-sm text-muted">This product is no longer available.</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ notifications
export function NotificationsView() {
  const n = useNotifications();
  const { data, error, loading, refetch } = useQuery("me:notifications", async () => (await notificationApi.list({ limit: 50 })).data, { staleMs: 0 });
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  const linkFor = (x) => (x.data?.orderNumber ? `/account/orders/${encodeURIComponent(x.data.orderNumber)}` : x.data?.returnId ? `/account/returns/${x.data.returnId}` : x.data?.slug ? `/products/${x.data.slug}` : null);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Notifications</h1>
        {n?.unread ? <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={async () => { setBusy(true); await n.markRead().catch(() => {}); await refetch(); setBusy(false); }}>Mark all as read</button> : null}
      </div>
      {!data.length ? (
        <EmptyState icon="bell" title="You're all caught up">Order, delivery and support updates will appear here.</EmptyState>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {data.map((x) => {
            const href = linkFor(x);
            const body = (
              <div className="flex gap-3 py-4">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${x.readAt ? "bg-transparent" : "bg-olive-900"}`} aria-label={x.readAt ? undefined : "Unread"} />
                <div className="text-sm">
                  <p className={x.readAt ? "text-ink-soft" : "font-medium"}>{x.title}</p>
                  {x.body ? <p className="mt-0.5 text-ink-soft">{x.body}</p> : null}
                  <p className="mt-1 text-xs text-muted">{formatDateTime(x.createdAt)}</p>
                </div>
              </div>
            );
            return (
              <li key={x._id}>
                {href ? <Link href={href} onClick={() => !x.readAt && n.markRead([x._id]).catch(() => {})} className="block hover:bg-cream-50">{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ support tickets
const CATEGORIES = ["order", "delivery", "return", "payment", "product", "account", "other"];

export function SupportView() {
  const toast = useToast();
  const { data, error, loading, refetch } = useQuery("me:tickets", async () => (await supportApi.tickets({ limit: 30 })).data);
  const [f, setF] = useState({ subject: "", description: "", category: "order" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const errs = { subject: f.subject.trim().length < 5 ? "At least 5 characters" : null, description: f.description.trim().length < 10 ? "Please describe the issue (at least 10 characters)" : null };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const r = await supportApi.createTicket({ subject: f.subject.trim(), description: f.description.trim(), category: f.category });
      toast.success(`Ticket ${r.data.ticketNumber} created. We'll reply soon.`);
      setF({ subject: "", description: "", category: "order" });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Help &amp; Support</h1>
      <Notice tone="info">For the fastest help with orders and returns, use the chat assistant (bottom right). For anything else, raise a ticket below.</Notice>
      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6" noValidate>
        <h2 className="font-display text-2xl sm:col-span-2">New ticket</h2>
        <Field label="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} error={errors.subject} maxLength={200} />
        <div>
          <label htmlFor="t-cat" className="field-label">Topic</label>
          <select id="t-cat" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
          </select>
        </div>
        <Field className="sm:col-span-2" textarea label="How can we help?" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} error={errors.description} maxLength={4000} />
        <div className="sm:col-span-2"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner size={16} /> : null} Submit ticket</button></div>
      </form>
      <section>
        <h2 className="font-display mb-4 text-2xl">Your tickets</h2>
        {loading ? <div className="skeleton h-20" /> : error ? <ErrorState message={error.message} onRetry={refetch} /> : !data.length ? <p className="text-sm text-muted">No tickets yet.</p> : (
          <ul className="space-y-3">
            {data.map((t) => (
              <li key={t._id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{t.ticketNumber} · {t.subject}</p>
                  <p className="text-xs text-muted">{humanize(t.category)} · opened {formatDate(t.createdAt)}{t.resolvedAt ? ` · resolved ${formatDate(t.resolvedAt)}` : ""}</p>
                </div>
                <StatusPill tone={["resolved", "closed"].includes(t.status) ? "good" : "warn"}>{humanize(t.status)}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
