"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { notificationApi } from "@/lib/api/endpoints";
import { getSocket } from "@/lib/socket";
import { invalidate } from "@/lib/useQuery";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "./AuthProvider";

const NotificationContext = createContext(null);

/**
 * Unread count from REST, kept live through the shared socket once the browser is idle (so the
 * Socket.IO client never competes with the initial page load). No polling.
 */
export function NotificationProvider({ children }) {
  const { isAuthed } = useAuth();
  const toast = useToast();
  const [unread, setUnread] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const r = await notificationApi.unreadCount();
      setUnread(r.data.unread);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) return; // signed-out count is derived as 0 below
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCount();
    let cancelled = false;
    let sock = null;
    const onNew = (n) => {
      setUnread((u) => u + 1);
      invalidate("me:notifications");
      if (n?.category === "orders" || /order|payment|refund|return|replacement/i.test(n?.type || "")) {
        invalidate("me:orders");
        invalidate("me:order:");
        invalidate("me:returns");
      }
      if (n?.title) toast.show(n.title);
    };
    const start = () => {
      getSocket().then((s) => {
        if (cancelled) return;
        sock = s;
        s.off("notification:new", onNew); // never double-register (e.g. Strict Mode / re-login)
        s.on("notification:new", onNew);
      });
    };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 2500);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      clearTimeout(idle);
      sock?.off("notification:new", onNew);
    };
  }, [isAuthed, refreshCount, toast]);

  const markRead = useCallback(async (ids) => {
    await notificationApi.read(ids ? { ids } : { all: true });
    invalidate("me:notifications");
    refreshCount();
  }, [refreshCount]);

  const value = useMemo(() => ({ unread: isAuthed ? unread : 0, refreshCount, markRead }), [isAuthed, unread, refreshCount, markRead]);
  return <NotificationContext value={value}>{children}</NotificationContext>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
