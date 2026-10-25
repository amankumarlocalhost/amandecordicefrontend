"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartApi } from "@/lib/api/endpoints";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "./AuthProvider";

const CartContext = createContext(null);

/**
 * The cart lives on the server (guest cart via signed cookie, merged into the account on login).
 * Every mutation returns the cart with a fresh server-side quote, so prices and stock shown here are
 * never computed in the browser.
 */
export function CartProvider({ children }) {
  const toast = useToast();
  const { status } = useAuth();
  const [cart, setCart] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | ready | error
  const [pending, setPending] = useState(new Set()); // SKUs being updated
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loadId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++loadId.current;
    setState((s) => (s === "ready" ? s : "loading"));
    try {
      const r = await cartApi.get();
      if (id === loadId.current) {
        setCart(r.data);
        setState("ready");
      }
      return r.data;
    } catch (err) {
      if (id === loadId.current) setState(err.status === 403 ? "disabled" : "error");
      return null;
    }
  }, []);

  // Load once auth is known, and again whenever it changes (login merges the guest cart server-side).
  useEffect(() => {
    if (status === "loading") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [status, refresh]);

  const mark = (sku, on) =>
    setPending((p) => {
      const n = new Set(p);
      if (on) n.add(sku);
      else n.delete(sku);
      return n;
    });

  const run = useCallback(
    async (sku, fn, successMsg) => {
      mark(sku, true);
      try {
        const r = await fn();
        const next = r.data?.cart || r.data;
        loadId.current += 1; // supersede any in-flight refresh
        setCart(next);
        setState("ready");
        if (successMsg) toast.success(successMsg);
        return { ok: true, data: r.data };
      } catch (err) {
        toast.error(err.message);
        if (err.code === "OUT_OF_STOCK" || err.code === "NOT_FOUND") refresh();
        return { ok: false, error: err };
      } finally {
        mark(sku, false);
      }
    },
    [toast, refresh],
  );

  const addItem = useCallback(
    async (sku, quantity = 1, { openDrawer = true, silent = false } = {}) => {
      const res = await run(sku, () => cartApi.add(sku, quantity), silent || openDrawer ? null : "Added to your bag");
      if (res.ok && openDrawer) setDrawerOpen(true);
      return res;
    },
    [run],
  );
  const setQuantity = useCallback((sku, q) => run(sku, () => cartApi.setQty(sku, q)), [run]);
  const removeItem = useCallback((sku) => run(sku, () => cartApi.remove(sku), "Removed from your bag"), [run]);
  const applyCoupon = useCallback((code) => run("__coupon", () => cartApi.applyCoupon(code), "Coupon applied"), [run]);
  const removeCoupon = useCallback(() => run("__coupon", () => cartApi.removeCoupon(), "Coupon removed"), [run]);
  const setOptions = useCallback((body) => run("__options", () => cartApi.options(body)), [run]);

  const count = useMemo(() => (cart?.items || []).reduce((a, i) => a + i.quantity, 0), [cart]);

  const value = useMemo(
    () => ({ cart, state, count, pending, refresh, addItem, setQuantity, removeItem, applyCoupon, removeCoupon, setOptions, drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false) }),
    [cart, state, count, pending, refresh, addItem, setQuantity, removeItem, applyCoupon, removeCoupon, setOptions, drawerOpen],
  );
  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
