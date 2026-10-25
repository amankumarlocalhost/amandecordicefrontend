"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { rememberCsrf } from "@/lib/api/client";
import { authApi, userApi } from "@/lib/api/endpoints";
import { clearUserQueries } from "@/lib/useQuery";
import { disconnectSocket } from "@/lib/socket";

const AuthContext = createContext(null);

// Non-sensitive hint that this browser had a session, so guests don't pay for a refresh round-trip.
// It never grants anything: the HttpOnly cookies remain the only credential.
const HINT = "auth:hint";
const hint = {
  get: () => {
    try {
      return localStorage.getItem(HINT) === "1";
    } catch {
      return true;
    }
  },
  set: (on) => {
    try {
      if (on) localStorage.setItem(HINT, "1");
      else localStorage.removeItem(HINT);
    } catch {
      /* storage unavailable */
    }
  },
};

/**
 * Session restoration: GET /users/me (the API client refreshes an expired access token once).
 * A 401 after that means "guest". Staff accounts can sign in only through the admin app, so they
 * are treated as signed out here.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | guest

  const loadMe = useCallback(async () => {
    try {
      const r = await userApi.me({ auth: hint.get() });
      if (r.data?.role && r.data.role !== "customer") {
        setUser(null);
        setStatus("guest");
        return null;
      }
      hint.set(true);
      setUser(r.data);
      setStatus("authenticated");
      return r.data;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        hint.set(false);
        setUser(null);
        setStatus("guest");
      } else {
        // Network/server failure: don't pretend the user is signed out; retry on next focus.
        setStatus((s) => (s === "loading" ? "guest" : s));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    // Restore the session once on load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMe();
    const onExpired = () => {
      hint.set(false);
      setUser(null);
      setStatus("guest");
      clearUserQueries();
      disconnectSocket();
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [loadMe]);

  const establish = useCallback((payload) => {
    rememberCsrf(payload?.csrfToken);
    clearUserQueries();
    disconnectSocket();
    if (payload?.user) {
      hint.set(true);
      setUser(payload.user);
      setStatus("authenticated");
    }
    window.dispatchEvent(new CustomEvent("auth:changed"));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const r = await authApi.login({ identifier, password });
    establish(r.data);
    return r.data.user;
  }, [establish]);

  const loginWithOtp = useCallback(async (phone, code) => {
    const r = await authApi.otpLogin({ phone, code });
    establish(r.data);
    return r.data.user;
  }, [establish]);

  const register = useCallback(async (body) => {
    const r = await authApi.register(body);
    establish(r.data);
    return r.data;
  }, [establish]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      hint.set(false);
      setUser(null);
      setStatus("guest");
      clearUserQueries();
      disconnectSocket();
      window.dispatchEvent(new CustomEvent("auth:changed"));
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthed: status === "authenticated", login, loginWithOtp, register, logout, refreshUser: loadMe, setUser }),
    [user, status, login, loginWithOtp, register, logout, loadMe],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
