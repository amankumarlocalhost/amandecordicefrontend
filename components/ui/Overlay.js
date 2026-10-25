"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let openCount = 0;

/** Focus trap, Escape to close, scroll lock, and focus restoration shared by dialogs and drawers. */
function useModal(open, onClose, panelRef) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    openCount += 1;
    document.documentElement.style.overflow = "hidden";
    const panel = panelRef.current;
    const first = panel?.querySelector("[data-autofocus]") || panel?.querySelector(FOCUSABLE);
    (first || panel)?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      openCount -= 1;
      if (openCount === 0) document.documentElement.style.overflow = "";
      if (previous && typeof previous.focus === "function") previous.focus({ preventScroll: true });
    };
  }, [open, onClose, panelRef]);
}

export function Dialog({ open, onClose, title, children, size = "md", footer }) {
  const ref = useRef(null);
  const id = useId();
  useModal(open, onClose, ref);
  if (!open || typeof document === "undefined") return null;
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="animate-fade-in absolute inset-0 bg-olive-950/55" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} tabIndex={-1} className={`animate-pop-in relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-md bg-cream-50 shadow-[var(--shadow-pop)] sm:rounded-md`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2 id={`${id}-t`} className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 p-2 text-ink-soft hover:text-ink" aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-line bg-cream-100 px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, side = "right", footer, width = "max-w-md" }) {
  const ref = useRef(null);
  const id = useId();
  useModal(open, onClose, ref);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="animate-fade-in absolute inset-0 bg-olive-950/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        className={`absolute top-0 bottom-0 flex w-full ${width} flex-col bg-cream-50 shadow-[var(--shadow-pop)] ${side === "right" ? "right-0" : "left-0"}`}
        style={{ animation: `${side === "right" ? "slide-in-right" : "slide-in-left"} 0.35s var(--ease-lux) both` }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={`${id}-t`} className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 p-2 text-ink-soft hover:text-ink" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="border-t border-line bg-cream-100 px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/** Promise-free confirm dialog: renders a Dialog with confirm/cancel actions. */
export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = "Confirm", busy = false, tone = "primary" }) {
  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={busy}>
            Keep it
          </button>
          <button type="button" className={`btn btn-sm ${tone === "danger" ? "bg-danger text-cream-50 hover:opacity-90" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-sm leading-relaxed text-ink-soft">{children}</div>
    </Dialog>
  );
}
