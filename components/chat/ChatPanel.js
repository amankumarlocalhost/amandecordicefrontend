"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { CrestMark } from "@/components/ui/Logo";
import { Photo, Spinner } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";
import { aiApi, uploadApi } from "@/lib/api/endpoints";
import { newIdempotencyKey } from "@/lib/api/client";
import { emitAck, getSocket, onSocketStatus, socketStatus } from "@/lib/socket";
import { humanize } from "@/lib/format";
import { STORE_NAME } from "@/lib/config";

const STATUS_TEXT = {
  connecting: "Connecting…",
  connected: "Online",
  reconnecting: "Reconnecting…",
  offline: "You're offline",
  unauthorized: "Session expired — please sign in again",
  idle: "Disconnected",
};

function mergeMessages(list, incoming) {
  const out = [...list];
  for (const m of incoming) {
    const i = out.findIndex((x) => (m.id && x.id === m.id) || (m.clientMessageId && x.clientMessageId === m.clientMessageId));
    if (i >= 0) out[i] = { ...out[i], ...m, status: "sent" };
    else out.push({ ...m, status: "sent" });
  }
  return out.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function PreviewBlock({ preview }) {
  if (!preview) return null;
  if (typeof preview === "string") return <p className="mt-2 text-xs text-ink-soft">{preview}</p>;
  return (
    <dl className="mt-2 space-y-1 text-xs">
      {Object.entries(preview).map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt className="shrink-0 text-muted">{humanize(k)}:</dt>
          <dd className="text-ink-soft">{Array.isArray(v) ? v.map((x) => (typeof x === "object" ? Object.values(x).join(" × ") : x)).join(", ") : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Message({ m, onAction, proposalState }) {
  const mine = m.sender?.type === "customer";
  const system = m.sender?.type === "system";
  const who = m.sender?.type === "agent" ? m.sender.name || "Support" : m.sender?.type === "ai" ? "Assistant" : null;
  if (system && m.kind !== "action_result") {
    return <p className="mx-auto max-w-[85%] text-center text-[0.7rem] text-muted">{m.body}</p>;
  }
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {who ? <span className="mb-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">{who}</span> : null}
        <div className={`rounded-[10px] px-3.5 py-2.5 text-[0.85rem] leading-relaxed whitespace-pre-line ${mine ? "rounded-br-sm bg-olive-900 text-cream-50" : m.kind === "action_result" ? "border border-line bg-cream-100" : "rounded-bl-sm bg-cream-200/80 text-ink"}`}>
          {m.body}
          {m.attachments?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.attachments.map((a) => (
                <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="relative block h-16 w-16 overflow-hidden rounded-sm bg-cream-300">
                  <Photo src={a.thumbUrl || a.url} alt="Attachment" sizes="64px" />
                </a>
              ))}
            </div>
          ) : null}
          {m.kind === "products" && m.payload?.products?.length ? (
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {m.payload.products.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className="block overflow-hidden rounded-sm border border-line bg-cream-50 text-ink hover:border-olive-700">
                    <span className="relative block aspect-square bg-cream-200">
                      <Photo src={p.image} alt={p.name} sizes="140px" />
                    </span>
                    <span className="block p-2">
                      <span className="line-clamp-2 text-[0.72rem] leading-snug">{p.name}</span>
                      <span className="mt-1 block text-[0.75rem] font-medium">{p.price}</span>
                      {!p.inStock ? <span className="text-[0.65rem] text-danger">Out of stock</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {m.kind === "action_proposal" ? (
            <div className="mt-2 rounded-sm border border-line bg-cream-50 p-3 text-ink">
              <PreviewBlock preview={m.payload?.preview} />
              {proposalState === "done" ? (
                <p className="mt-2 text-xs text-muted">Handled — see the update below.</p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn btn-primary btn-sm" disabled={proposalState === "busy"} onClick={() => onAction("confirm", m.payload.proposalId)}>
                    {proposalState === "busy" ? <Spinner size={14} /> : "Confirm"}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" disabled={proposalState === "busy"} onClick={() => onAction("decline", m.payload.proposalId)}>
                    Cancel
                  </button>
                </div>
              )}
              <p className="mt-2 text-[0.65rem] text-muted">Nothing is submitted until you confirm and our system accepts it.</p>
            </div>
          ) : null}
          {m.payload?.actions?.some((a) => a.type === "handoff") && m.kind !== "action_proposal" ? (
            <button type="button" className="mt-2 block text-xs font-medium text-olive-800 underline underline-offset-4" onClick={() => onAction("handoff")}>
              Talk to a person
            </button>
          ) : null}
        </div>
        {mine && m.status === "sending" ? <span className="mt-1 text-[0.62rem] text-muted">Sending…</span> : null}
        {mine && m.status === "failed" ? (
          <button type="button" className="mt-1 text-[0.65rem] text-danger underline" onClick={() => onAction("resend", m)}>
            Not sent — tap to retry
          </button>
        ) : null}
        {mine && m.status === "sent" && m.readAt ? <span className="mt-1 text-[0.62rem] text-muted">Seen</span> : null}
      </div>
    </div>
  );
}

function ChatBody() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(socketStatus());
  const [typing, setTyping] = useState(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(null);
  const [proposals, setProposals] = useState({});
  const listRef = useRef(null);
  const convRef = useRef(null);
  const fileRef = useRef(null);

  const start = useCallback(async () => {
    setError(null);
    const res = await emitAck("chat:start", { channel: "ai" });
    if (!res.ok) {
      setError(res.error?.message || "Chat is unavailable right now.");
      return;
    }
    convRef.current = res.data.conversation;
    setConversation(res.data.conversation);
    setMessages((m) => mergeMessages(m, res.data.messages));
    emitAck("chat:read", { conversationId: res.data.conversation.id });
  }, []);

  useEffect(() => {
    aiApi.status().then((r) => setAiEnabled(r.data.enabled)).catch(() => setAiEnabled(false));
    const offStatus = onSocketStatus(setStatus);
    let sock;
    let cancelled = false;
    const onMessage = (msg) => {
      if (!convRef.current || String(msg.conversationId) !== String(convRef.current.id)) return;
      setMessages((m) => mergeMessages(m, [msg]));
      if (msg.kind === "action_result" && msg.payload?.proposalId) setProposals((p) => ({ ...p, [msg.payload.proposalId]: "done" }));
      if (msg.sender?.type !== "customer") {
        setTyping(null);
        emitAck("chat:read", { conversationId: convRef.current.id });
      }
    };
    const onTyping = ({ conversationId, from, typing: t }) => {
      if (convRef.current && String(conversationId) === String(convRef.current.id) && from !== "customer") setTyping(t ? from : null);
    };
    const onRead = ({ conversationId, by, at }) => {
      if (convRef.current && String(conversationId) === String(convRef.current.id) && by !== "customer") setMessages((m) => m.map((x) => (x.sender?.type === "customer" && !x.readAt ? { ...x, readAt: at } : x)));
    };
    // After a reconnect, re-join the room and merge any messages missed while offline.
    const onConnect = async () => {
      if (!convRef.current) return;
      const res = await emitAck("chat:join", { conversationId: convRef.current.id });
      if (res.ok) {
        setConversation(res.data.conversation);
        setMessages((m) => mergeMessages(m, res.data.messages));
      }
    };
    getSocket().then((s) => {
      if (cancelled) return;
      sock = s;
      s.on("chat:message", onMessage);
      s.on("chat:typing", onTyping);
      s.on("chat:read", onRead);
      s.on("connect", onConnect);
      start();
    });
    return () => {
      cancelled = true;
      offStatus();
      if (sock) {
        sock.off("chat:message", onMessage);
        sock.off("chat:typing", onTyping);
        sock.off("chat:read", onRead);
        sock.off("connect", onConnect);
      }
    };
  }, [start]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const sendMessage = async (msg) => {
    setMessages((m) => mergeMessages(m, []).map((x) => (x.clientMessageId === msg.clientMessageId ? { ...x, status: "sending" } : x)));
    const res = await emitAck("chat:message", { conversationId: conversation.id, clientMessageId: msg.clientMessageId, body: msg.body, attachmentIds: msg.attachmentIds || [] });
    if (res.ok) setMessages((m) => mergeMessages(m, [res.data.message]));
    else setMessages((m) => m.map((x) => (x.clientMessageId === msg.clientMessageId ? { ...x, status: "failed", error: res.error?.message } : x)));
  };

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !files.length) || !conversation) return;
    let attachmentIds = [];
    let attachments = [];
    if (files.length) {
      setUploading(true);
      try {
        const r = await uploadApi.upload(files, "chat");
        attachmentIds = r.data.map((u) => u.id);
        attachments = r.data.map((u) => ({ url: u.url, thumbUrl: u.thumbUrl }));
      } catch (err) {
        setError(err.message);
        setUploading(false);
        return;
      }
      setUploading(false);
      setFiles([]);
    }
    // Same clientMessageId on retry → the server de-duplicates (no double AI reply).
    const msg = { id: undefined, clientMessageId: newIdempotencyKey(), body, attachmentIds, attachments, sender: { type: "customer" }, kind: "text", createdAt: new Date().toISOString(), status: "sending" };
    setMessages((m) => [...m, msg]);
    setText("");
    await sendMessage(msg);
  };

  const onAction = async (type, arg) => {
    if (type === "resend") return sendMessage(arg);
    if (type === "handoff") {
      const res = await emitAck("chat:handoff", { conversationId: conversation.id, reason: "Customer asked for a person" });
      if (res.ok) setConversation(res.data);
      else setError(res.error?.message);
      return;
    }
    setProposals((p) => ({ ...p, [arg]: "busy" }));
    const res = await emitAck(type === "confirm" ? "ai:confirm" : "ai:decline", { proposalId: arg });
    if (!res.ok) {
      setProposals((p) => ({ ...p, [arg]: "idle" }));
      setError(res.error?.message || "That action could not be completed.");
    }
    // On success the server posts an action_result message, which marks the proposal handled.
  };

  const handedOff = conversation?.channel === "human" || conversation?.status === "waiting_agent";

  return (
    <>
      <div className="flex items-center gap-2 border-b border-line bg-cream-100 px-4 py-2 text-[0.68rem] text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-success" : status === "unauthorized" ? "bg-danger" : "bg-warn"}`} aria-hidden="true" />
        <span role="status">{STATUS_TEXT[status] || status}</span>
        <span className="ml-auto">{handedOff ? "Support team" : aiEnabled === false ? "Quick help mode" : "AI assistant"}</span>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {!conversation && !error ? (
          <div className="flex h-full items-center justify-center text-muted">
            <Spinner />
          </div>
        ) : null}
        {conversation && !messages.length ? (
          <div className="rounded-sm bg-cream-100 p-4 text-sm text-ink-soft">
            <p className="font-display text-xl text-ink">Hello! How can we help?</p>
            <p className="mt-1">Ask about dinner sets, glassware, a budget, your order status, or report a broken item.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Dinner set for 6 under ₹5,000", "Where is my order?", "An item arrived broken"].map((s) => (
                <button key={s} type="button" className="chip text-xs hover:border-ink" onClick={() => setText(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((m) => (
          <Message key={m.id || m.clientMessageId} m={m} onAction={onAction} proposalState={m.payload?.proposalId ? proposals[m.payload.proposalId] : undefined} />
        ))}
        {typing ? (
          <div className="flex items-center gap-1 text-muted" aria-label={`${typing === "ai" ? "Assistant" : "Support"} is typing`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-current" style={{ animation: `typing 1.2s ${i * 0.15}s infinite` }} />
            ))}
          </div>
        ) : null}
        {error ? (
          <div role="alert" className="rounded-sm bg-[#f6e3dd] p-3 text-xs text-[#7a2f20]">
            {error}{" "}
            {!conversation ? (
              <button type="button" className="underline" onClick={start}>
                Retry
              </button>
            ) : (
              <button type="button" className="underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            )}
          </div>
        ) : null}
      </div>
      {files.length ? (
        <div className="flex flex-wrap gap-2 border-t border-line px-4 pt-3 text-xs">
          {files.map((f, i) => (
            <span key={f.name + i} className="chip">
              {f.name.slice(0, 18)}
              <button type="button" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3">
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles([...e.target.files].slice(0, 4))} />
        <button type="button" className="p-2 text-ink-soft hover:text-ink" onClick={() => fileRef.current?.click()} aria-label="Attach photos" disabled={!conversation}>
          <Icon name="camera" size={19} />
        </button>
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea
          id="chat-input"
          rows={1}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form.requestSubmit();
            }
          }}
          placeholder="Type your message…"
          className="input max-h-28 min-h-10 flex-1 resize-none py-2 text-sm"
          disabled={!conversation}
        />
        <button type="submit" className="btn btn-primary min-h-10 px-3" disabled={!conversation || uploading || (!text.trim() && !files.length)} aria-label="Send message">
          {uploading ? <Spinner size={16} /> : <Icon name="send" size={17} />}
        </button>
      </form>
      {!handedOff && conversation ? (
        <button type="button" className="border-t border-line py-2 text-center text-[0.68rem] tracking-[0.14em] text-muted uppercase hover:text-ink" onClick={() => onAction("handoff")}>
          Talk to a person instead
        </button>
      ) : null}
    </>
  );
}

export default function ChatPanel({ open, onClose }) {
  const { isAuthed, status } = useAuth();
  return (
    <section
      className={`no-print fixed right-4 bottom-20 z-[60] flex h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-line bg-cream-50 shadow-[var(--shadow-pop)] transition-[opacity,transform] duration-300 sm:right-6 sm:bottom-24 ${open ? "translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-3 opacity-0"}`}
      aria-label="Shopping assistant"
      aria-hidden={!open}
    >
      <header className="flex items-center justify-between bg-olive-900 px-4 py-3 text-cream-50">
        <div className="flex items-center gap-2.5">
          <CrestMark tone="dark" size={34} className="shrink-0" />
          <div>
          <p className="font-display text-lg leading-none">{STORE_NAME} Assistant</p>
          <p className="mt-1 text-[0.65rem] text-cream-200/80">Product help, orders, returns</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-cream-200 hover:text-cream-50" aria-label="Close assistant">
          <Icon name="close" size={18} />
        </button>
      </header>
      {status === "loading" ? (
        <div className="flex flex-1 items-center justify-center"><Spinner /></div>
      ) : isAuthed ? (
        <ChatBody />
      ) : (
        <div className="flex flex-1 flex-col justify-center p-6 text-center">
          <p className="font-display text-2xl">Sign in to chat</p>
          <p className="mt-2 text-sm text-muted">Our assistant can look up your orders and start returns, so it needs to know it&apos;s you.</p>
          <Link href="/login" onClick={onClose} className="btn btn-primary mt-5">Sign in</Link>
          <div className="mt-6 space-y-2 text-sm">
            <Link href="/help/shipping" onClick={onClose} className="block text-olive-800 underline underline-offset-4">Shipping & delivery</Link>
            <Link href="/help/returns" onClick={onClose} className="block text-olive-800 underline underline-offset-4">Returns & replacements</Link>
            <Link href="/contact" onClick={onClose} className="block text-olive-800 underline underline-offset-4">Contact us</Link>
          </div>
        </div>
      )}
    </section>
  );
}
