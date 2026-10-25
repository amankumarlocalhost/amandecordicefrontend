"use client";

import { useEffect } from "react";

/** Removes the intro overlay from the DOM after it has faded (hard cap 3.4 s), so it can't intercept anything. */
export default function IntroController() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-intro") !== "play") return;
    const el = document.getElementById("brand-intro");
    const done = () => {
      root.removeAttribute("data-intro");
      el?.remove();
    };
    el?.addEventListener("animationend", (e) => e.animationName === "di-out" && done());
    const cap = setTimeout(done, 3400);
    return () => clearTimeout(cap);
  }, []);
  return null;
}
