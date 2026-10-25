"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { wishlistApi } from "@/lib/api/endpoints";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "./AuthProvider";

const WishlistContext = createContext(null);
const EMPTY_SET = new Set();

/** Wishlist requires a customer account (backend: customer-only routes). */
export function WishlistProvider({ children }) {
  const { isAuthed } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [ids, setIds] = useState(() => new Set());
  const [state, setState] = useState("idle");

  const refresh = useCallback(async () => {
    setState("loading");
    try {
      const r = await wishlistApi.list();
      setItems(r.data);
      setIds(new Set(r.data.map((i) => String(i.productId))));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    // Load the signed-in customer's wishlist (signed-out state is derived below, not stored).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthed) refresh();
  }, [isAuthed, refresh]);

  const toggle = useCallback(
    async (productId, sku) => {
      if (!isAuthed) {
        toast.show("Sign in to save pieces to your wishlist", { action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`) } });
        return;
      }
      const id = String(productId);
      const had = ids.has(id);
      setIds((s) => {
        const n = new Set(s);
        if (had) n.delete(id);
        else n.add(id);
        return n;
      });
      try {
        if (had) await wishlistApi.remove(id);
        else await wishlistApi.add(id, sku);
        toast.success(had ? "Removed from wishlist" : "Saved to wishlist");
        refresh();
      } catch (err) {
        setIds((s) => {
          const n = new Set(s);
          if (had) n.add(id);
          else n.delete(id);
          return n;
        });
        toast.error(err.message);
      }
    },
    [isAuthed, ids, toast, router, refresh],
  );

  const value = useMemo(() => {
    // After sign-out the previous customer's wishlist is never exposed.
    const liveIds = isAuthed ? ids : EMPTY_SET;
    return { items: isAuthed ? items : [], ids: liveIds, state: isAuthed ? state : "idle", has: (id) => liveIds.has(String(id)), toggle, refresh, count: liveIds.size };
  }, [isAuthed, items, ids, state, toggle, refresh]);
  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
