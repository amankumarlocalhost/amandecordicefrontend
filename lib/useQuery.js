"use client";

// Minimal request cache for client components: deduplicates concurrent requests for the same key,
// serves cached data while revalidating, and lets mutations invalidate by key prefix.
// Keys for customer data start with "me:" and are dropped on login/logout so nothing leaks between users.

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isAbort } from "./api/client";

const store = new Map(); // key -> { data, error, ts, promise, listeners:Set, fetcher }
const EMPTY = { data: undefined, error: undefined, ts: 0, promise: null };

function entry(key) {
  let e = store.get(key);
  if (!e) {
    e = { ...EMPTY, listeners: new Set(), snapshot: { data: undefined, error: undefined, fetching: false } };
    store.set(key, e);
  }
  return e;
}

function emit(e) {
  e.snapshot = { data: e.data, error: e.error, fetching: Boolean(e.promise) };
  e.listeners.forEach((l) => l());
}

export function load(key, fetcher) {
  const e = entry(key);
  if (fetcher) e.fetcher = fetcher;
  if (e.promise) return e.promise;
  if (!e.fetcher) return Promise.resolve(e.data);
  e.promise = e
    .fetcher()
    .then((data) => {
      e.data = data;
      e.error = undefined;
      e.ts = Date.now();
      return data;
    })
    .catch((err) => {
      if (!isAbort(err)) e.error = err;
      return undefined;
    })
    .finally(() => {
      e.promise = null;
      emit(e);
    });
  emit(e);
  return e.promise;
}

export function setQueryData(key, updater) {
  const e = entry(key);
  e.data = typeof updater === "function" ? updater(e.data) : updater;
  e.error = undefined;
  e.ts = Date.now();
  emit(e);
}

export function invalidate(prefix) {
  for (const [key, e] of store) {
    if (key.startsWith(prefix)) {
      e.ts = 0;
      if (e.listeners.size) load(key);
    }
  }
}

/** Removes customer data (keys starting with "me:"). Called on login/logout. */
export function clearUserQueries() {
  for (const [key, e] of store) {
    if (key.startsWith("me:")) {
      e.data = undefined;
      e.error = undefined;
      e.ts = 0;
      emit(e);
    }
  }
}

const noop = () => () => {};
const emptySnap = { data: undefined, error: undefined, fetching: false };

/**
 * useQuery(key, fetcher, { enabled, staleMs }) → { data, error, loading, fetching, refetch }
 * fetcher returns the value to cache (usually `(await api.get(...)).data`). A null key disables the query.
 */
export function useQuery(key, fetcher, { enabled = true, staleMs = 30000 } = {}) {
  const active = Boolean(key) && enabled;
  const subscribe = useCallback(
    (cb) => {
      if (!active) return () => {};
      const e = entry(key);
      e.listeners.add(cb);
      return () => e.listeners.delete(cb);
    },
    [key, active],
  );
  const snap = useSyncExternalStore(
    active ? subscribe : noop,
    () => (active ? entry(key).snapshot : emptySnap),
    () => emptySnap,
  );

  useEffect(() => {
    if (!active) return;
    const e = entry(key);
    e.fetcher = fetcher;
    if (!e.promise && (e.data === undefined || Date.now() - e.ts > staleMs)) load(key);
    // fetcher identity changes every render; the key captures its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active, staleMs]);

  const refetch = useCallback(() => (active ? load(key, fetcher) : Promise.resolve()), [key, active, fetcher]);

  return {
    data: snap.data,
    error: snap.error,
    loading: active && snap.data === undefined && !snap.error,
    fetching: snap.fetching,
    refetch,
  };
}
