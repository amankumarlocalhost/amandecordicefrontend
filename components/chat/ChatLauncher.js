"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/bits";

// The chat UI and the Socket.IO client are downloaded only when a customer opens the assistant.
const ChatPanel = dynamic(() => import("./ChatPanel"), {
  ssr: false,
  loading: () => (
    <div className="fixed right-4 bottom-20 z-[60] flex h-40 w-[min(24rem,calc(100vw-2rem))] items-center justify-center bg-cream-50 shadow-[var(--shadow-pop)] sm:right-6 sm:bottom-24">
      <Spinner className="text-olive-800" />
    </div>
  ),
});

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setEverOpened(true);
      setOpen(true);
    };
    window.addEventListener("chat:open", onOpen);
    return () => window.removeEventListener("chat:open", onOpen);
  }, []);

  return (
    <>
      {everOpened ? <ChatPanel open={open} onClose={() => setOpen(false)} /> : null}
      <button
        type="button"
        onClick={() => {
          setEverOpened(true);
          setOpen((o) => !o);
        }}
        className="no-print fixed right-4 bottom-4 z-[60] flex h-13 w-13 items-center justify-center rounded-full bg-olive-900 text-cream-50 shadow-[var(--shadow-pop)] transition-transform duration-300 hover:scale-105 sm:right-6 sm:bottom-6"
        style={{ width: 52, height: 52 }}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        aria-expanded={open}
      >
        <Icon name={open ? "close" : "chat"} size={22} />
      </button>
    </>
  );
}

/** Lets any component open the assistant (e.g. "Ask our assistant" links). */
export function openChat() {
  window.dispatchEvent(new CustomEvent("chat:open"));
}
