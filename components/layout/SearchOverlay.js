"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import { Photo, Spinner } from "@/components/ui/bits";
import { catalogApi } from "@/lib/api/endpoints";
import { isAbort } from "@/lib/api/client";
import { money } from "@/lib/format";

const POPULAR = ["Dinner set", "Wine glasses", "Serving bowl", "Mugs", "Vase", "Bone china"];

/** Debounced autocomplete (GET /search/suggest). Stale requests are aborted. */
export default function SearchOverlay({ onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState("idle");
  const [active, setActive] = useState(-1);

  useEffect(() => {
    inputRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return; // the short-query view ignores results/state
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setState("loading");
      try {
        const r = await catalogApi.suggest(term, ctrl.signal);
        setResults(r.data);
        setState("done");
      } catch (err) {
        if (!isAbort(err)) setState("error");
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href) => {
    onClose();
    router.push(href);
  };

  const submit = (e) => {
    e.preventDefault();
    if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`);
    const term = q.trim();
    if (term) go(`/shop?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="animate-fade-in absolute inset-0 bg-olive-950/50" onClick={onClose} aria-hidden="true" />
      <div className="animate-pop-in relative bg-cream-50 shadow-[var(--shadow-pop)]">
        <div className="container-lux py-5 sm:py-8">
          <form onSubmit={submit} className="flex items-center gap-3 border-b border-ink pb-3" role="search">
            <Icon name="search" size={22} className="text-muted" />
            <label htmlFor="site-search" className="sr-only">Search the store</label>
            <input
              ref={inputRef}
              id="site-search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(-1);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search dinner sets, glassware, vases…"
              autoComplete="off"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-activedescendant={active >= 0 ? `sr-${active}` : undefined}
              className="font-display w-full bg-transparent text-2xl outline-none placeholder:text-muted/70 sm:text-3xl"
            />
            {state === "loading" ? <Spinner className="text-muted" /> : null}
            <button type="button" onClick={onClose} className="p-1 text-ink-soft hover:text-ink" aria-label="Close search">
              <Icon name="close" />
            </button>
          </form>

          <div className="mt-5 min-h-24">
            {q.trim().length < 2 ? (
              <div>
                <p className="eyebrow mb-3 text-muted">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((p) => (
                    <button key={p} type="button" onClick={() => go(`/shop?q=${encodeURIComponent(p)}`)} className="chip hover:border-ink">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : state === "error" ? (
              <p className="text-sm text-danger">Search is unavailable right now. Press Enter to try the full search.</p>
            ) : state === "done" && !results.length ? (
              <p className="text-sm text-muted">No quick matches for “{q.trim()}”. Press Enter to search the full catalogue.</p>
            ) : (
              <ul id="search-results" role="listbox" className="grid gap-2 sm:grid-cols-2">
                {results.map((r, i) => (
                  <li key={r.slug} id={`sr-${i}`} role="option" aria-selected={i === active}>
                    <Link href={`/products/${r.slug}`} onClick={onClose} className={`flex items-center gap-4 rounded-sm p-2 transition-colors hover:bg-cream-100 ${i === active ? "bg-cream-100" : ""}`}>
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-cream-200">
                        <Photo src={r.image} alt="" sizes="56px" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm">{r.name}</span>
                        <span className="text-xs text-muted">from {money(r.priceMin)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {q.trim().length >= 2 ? (
              <button type="button" onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`)} className="link-arrow mt-5 text-olive-800">
                See all results for “{q.trim()}” <Icon name="arrowRight" size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
