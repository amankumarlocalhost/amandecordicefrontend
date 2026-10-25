"use client";

import { useEffect } from "react";

/**
 * Subtle section reveal. Content is visible by default (no-JS, crawlers, reduced motion); only once
 * this runs do [data-reveal] elements below the fold get the fade-up treatment. One shared observer,
 * plus a MutationObserver so sections streamed in later are picked up.
 */
export default function RevealObserver() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const seen = new WeakSet();
    const scan = () => {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        // Anything already on screen stays visible: no flash for above-the-fold content.
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
        else io.observe(el);
      });
    };
    scan();
    document.documentElement.classList.add("reveal-armed");
    let raf = 0;
    const mo = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        scan();
      });
    });
    mo.observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
