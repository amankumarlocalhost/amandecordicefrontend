"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Icon from "./Icon";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message, { tone = "default", action, duration = 4000 } = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, message, tone, action }]);
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      show,
      success: (m, o) => show(m, { ...o, tone: "success" }),
      error: (m, o) => show(m, { ...o, tone: "error", duration: 6000 }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`animate-pop-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-sm px-4 py-3 text-sm shadow-[var(--shadow-pop)] ${
              t.tone === "error" ? "bg-[#4a2119] text-cream-50" : "bg-olive-900 text-cream-50"
            }`}
          >
            <Icon name={t.tone === "error" ? "alert" : "check"} size={18} className="mt-0.5 shrink-0 text-gold-soft" />
            <div className="flex-1">
              <p>{t.message}</p>
              {t.action ? (
                <button type="button" onClick={() => { t.action.onClick(); dismiss(t.id); }} className="mt-1 text-xs uppercase tracking-[0.16em] text-gold-soft underline-offset-4 hover:underline">
                  {t.action.label}
                </button>
              ) : null}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="text-cream-200/70 hover:text-cream-50" aria-label="Dismiss notification">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
