"use client";

// Keeps open storefront tabs in sync with admin publishes. Listens (receive-only, no login) on the
// backend's /public Socket.IO namespace. Events carry identifiers only; on a relevant event we ask
// Next.js to re-render the current route (router.refresh), which reads fresh data because the backend
// has already revalidated the server cache before broadcasting. Missed events are recovered by a
// refresh after reconnecting, and hidden tabs refresh once when they become visible again.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SOCKET_URL } from "@/lib/config";
import { invalidate } from "@/lib/useQuery";

const DEBOUNCE_MS = 400;
// Pages whose server-rendered content never depends on catalog/content events.
const SKIP = [/^\/checkout/, /^\/account/, /^\/(login|register|forgot-password|reset-password|verify-email)/];
const isListing = (p) => p === "/" || p.startsWith("/shop") || p.startsWith("/category/") || p.startsWith("/collections") || p.startsWith("/search");

/** Decides whether an event affects the page at `path`. */
function affects(path, e) {
  if (SKIP.some((rx) => rx.test(path))) return false;
  switch (e.event) {
    case "product:published":
    case "product:updated":
    case "product:unpublished":
    case "inventory:updated":
      return isListing(path) || path === `/products/${e.slug}` || path === `/products/${e.id}`;
    case "category:updated":
    case "collection:updated":
    case "promotions:updated":
    case "banner:updated":
      return isListing(path) || path.startsWith("/products/");
    case "homepage:updated":
      return path === "/";
    case "content:updated": // footer, navigation, announcement bar, store settings: shown on every page
      return true;
    case "page:updated":
      return path === `/pages/${e.slug}` || (e.slug === "about" && path === "/about");
    default:
      return false;
  }
}

export default function LiveUpdates() {
  // The current path is read when an event arrives (no URL hook: this sits in the prerendered root layout).
  const router = useRouter();

  useEffect(() => {
    let socket;
    let cancelled = false;
    let timer = null;
    let pendingWhileHidden = false;
    let wasConnected = false;

    const refresh = () => {
      if (document.visibilityState === "hidden") {
        pendingWhileHidden = true;
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), DEBOUNCE_MS);
    };

    const onSync = (e) => {
      if (!e || typeof e.event !== "string") return;
      if (e.event === "promotions:updated") invalidate("coupons");
      window.dispatchEvent(new CustomEvent("store:sync", { detail: e }));
      if (affects(window.location.pathname, e)) refresh();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && pendingWhileHidden) {
        pendingWhileHidden = false;
        refresh();
      }
    };

    // Connect after the page is interactive so this never competes with first paint.
    const start = () =>
      import("socket.io-client").then(({ io }) => {
        if (cancelled) return;
        // forceNew: a separate connection, so it never shares (or alters) the signed-in chat socket's manager.
        socket = io(`${SOCKET_URL}/public`, { forceNew: true, transports: ["websocket", "polling"], reconnectionDelay: 1000, reconnectionDelayMax: 15000, withCredentials: false });
        socket.on("sync", onSync);
        socket.on("connect", () => {
          if (wasConnected) refresh(); // we may have missed events while disconnected
          wasConnected = true;
        });
      });
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 3000 }) : setTimeout(start, 1500);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      clearTimeout(idle);
      document.removeEventListener("visibilitychange", onVisible);
      socket?.off("sync", onSync);
      socket?.disconnect();
    };
  }, [router]);

  return null;
}
