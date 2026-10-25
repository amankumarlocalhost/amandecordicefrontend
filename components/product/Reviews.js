"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { EmptyState, ErrorState, Notice, Photo, Spinner, Stars } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { reviewApi, uploadApi } from "@/lib/api/endpoints";
import { useQuery } from "@/lib/useQuery";
import { formatDate } from "@/lib/format";

const SORTS = [
  ["recent", "Most recent"],
  ["helpful", "Most helpful"],
  ["rating_high", "Highest rating"],
  ["rating_low", "Lowest rating"],
];

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="text-gold"
        >
          <Icon name="star" size={26} filled={(hover || value) >= n} strokeWidth={1.2} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!rating) return setError("Please choose a star rating.");
    if (body && body.trim().length < 10) return setError("Your review should be at least 10 characters.");
    setBusy(true);
    try {
      let imageIds = [];
      if (files.length) imageIds = (await uploadApi.upload(files, "review")).data.map((u) => u.id);
      const r = await reviewApi.create(productId, { rating, title: title.trim() || undefined, body: body.trim() || undefined, imageIds });
      toast.success(r.message);
      onDone();
    } catch (err) {
      setError(err.code === "PURCHASE_REQUIRED" ? "You can review products after they've been delivered to you." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-5">
      <div>
        <span className="field-label">Your rating</span>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div>
        <label htmlFor="rv-title" className="field-label">Title (optional)</label>
        <input id="rv-title" className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label htmlFor="rv-body" className="field-label">Your review</label>
        <textarea id="rv-body" className="input min-h-28" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="How does it look and feel on your table?" />
      </div>
      <div>
        <label htmlFor="rv-photos" className="field-label">Photos (optional, up to 5)</label>
        <input id="rv-photos" type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 5))} className="text-sm" />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Spinner size={16} /> : null} Submit review
        </button>
        <p className="text-xs text-muted">Reviews are published after moderation.</p>
      </div>
    </form>
  );
}

export default function Reviews({ productId, slug }) {
  const { isAuthed } = useAuth();
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const key = `reviews:${productId}:${sort}:${page}`;
  const { data, error, loading, refetch } = useQuery(key, async () => {
    const r = await reviewApi.list(productId, { sort, page, limit: 6 });
    return { items: r.data, meta: r.meta };
  });
  const summary = data?.meta?.summary;
  const dist = summary?.distribution || [0, 0, 0, 0, 0];
  const total = summary?.count || 0;

  return (
    <section id="reviews" className="scroll-mt-28" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="reviews-heading" className="font-display text-3xl sm:text-[2.2rem]">Customer Reviews</h2>
        {isAuthed ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setWriting((w) => !w)} aria-expanded={writing}>
            {writing ? "Cancel" : "Write a review"}
          </button>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/products/${slug}#reviews`)}`} className="btn btn-outline btn-sm">Sign in to review</Link>
        )}
      </div>
      {writing ? <ReviewForm productId={productId} onDone={() => { setWriting(false); refetch(); }} /> : null}

      {loading ? (
        <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : error ? (
        <ErrorState message="Reviews couldn't be loaded." onRetry={refetch} />
      ) : !total ? (
        <EmptyState icon="star" title="No reviews yet">Reviews come only from customers whose order has been delivered.</EmptyState>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div>
            <p className="font-display text-5xl">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} size={16} className="mt-1" />
            <p className="mt-1 text-xs text-muted">Based on {total} {total === 1 ? "review" : "reviews"}</p>
            <ul className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n} className="flex items-center gap-2 text-xs text-muted">
                  <span className="w-3">{n}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-300"><span className="block h-full bg-gold" style={{ width: `${total ? (dist[n - 1] / total) * 100 : 0}%` }} /></span>
                  <span className="w-6 text-right">{dist[n - 1]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted">Sort</span>
                <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input min-h-9 w-auto py-1 text-sm">
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            <ul className="divide-y divide-line">
              {data.items.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars value={r.rating} />
                    {r.title ? <h3 className="text-sm font-medium">{r.title}</h3> : null}
                  </div>
                  {r.body ? <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.body}</p> : null}
                  {r.images?.length ? (
                    <ul className="mt-3 flex gap-2">
                      {r.images.map((im) => (
                        <li key={im.url} className="relative h-20 w-20 overflow-hidden rounded-[3px] bg-cream-200">
                          <a href={im.url} target="_blank" rel="noopener noreferrer"><Photo src={im.thumbUrl || im.url} alt="Customer photo" sizes="80px" /></a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-3 text-xs text-muted">
                    {r.author} · {formatDate(r.createdAt)}
                    {r.verifiedPurchase ? <span className="ml-2 text-success">✓ Verified purchase</span> : null}
                  </p>
                </li>
              ))}
            </ul>
            {data.meta?.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span className="text-muted">Page {page} of {data.meta.totalPages}</span>
                <button type="button" className="btn btn-outline btn-sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
