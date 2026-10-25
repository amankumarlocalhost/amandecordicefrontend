"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

/** Scroll-snap carousel with arrows and page dots, as in the reference "Best Sellers" row. Native scrolling, no library. */
export default function ProductRail({ products, label }) {
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const n = Math.max(1, Math.ceil((el.scrollWidth - 4) / el.clientWidth));
    setPages(n);
    setPage(Math.min(n - 1, Math.round(el.scrollLeft / el.clientWidth)));
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [measure, products]);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={measure}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:gap-5 sm:scroll-px-0 sm:px-0"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {products.map((p) => (
          <div key={p.id} className="w-[64%] shrink-0 snap-start sm:w-[40%] md:w-[30%] lg:w-[calc((100%-4*1.25rem)/5)]">
            <ProductCard product={p} sizes="(min-width:1024px) 19vw, (min-width:768px) 30vw, 64vw" aspect="aspect-square" />
          </div>
        ))}
      </div>
      {pages > 1 ? (
        <>
          <button type="button" onClick={() => scrollBy(-1)} disabled={page === 0} className="absolute top-[38%] -left-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-olive-900 text-cream-50 shadow-[var(--shadow-card)] transition-opacity disabled:opacity-0 md:flex lg:-left-5" aria-label="Previous products">
            <Icon name="chevronLeft" size={18} />
          </button>
          <button type="button" onClick={() => scrollBy(1)} disabled={page >= pages - 1} className="absolute top-[38%] -right-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-olive-900 text-cream-50 shadow-[var(--shadow-card)] transition-opacity disabled:opacity-0 md:flex lg:-right-5" aria-label="Next products">
            <Icon name="chevronRight" size={18} />
          </button>
          <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
            {Array.from({ length: pages }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? "w-5 bg-olive-900" : "w-1.5 bg-cream-300"}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-[64%] shrink-0 sm:w-[40%] md:w-[30%] lg:w-[calc((100%-4*1.25rem)/5)]">
          <ProductCardSkeleton aspect="aspect-square" />
        </div>
      ))}
    </div>
  );
}
