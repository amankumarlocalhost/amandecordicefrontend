"use client";

// One Socket.IO connection per tab, created lazily (socket.io-client is only downloaded once a signed-in
// customer needs real-time features). Auth uses the same HttpOnly cookie as the REST API; the server
// disconnects with `auth:expired` when the access token lapses, and we refresh and reconnect.

import { SOCKET_URL } from "./config";
import { api } from "./api/client";

let socketPromise = null;
let socket = null;
const statusListeners = new Set();
let status = "idle"; // idle | connecting | connected | reconnecting | offline | unauthorized

function setStatus(s) {
  status = s;
  statusListeners.forEach((l) => l(s));
}

export function socketStatus() {
  return status;
}

export function onSocketStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function getSocket() {
  if (socketPromise) return socketPromise;
  setStatus("connecting");
  socketPromise = import("socket.io-client").then(({ io }) => {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    let authRetries = 0;
    socket.on("connect", () => {
      authRetries = 0;
      setStatus("connected");
    });
    socket.on("disconnect", (reason) => setStatus(reason === "io client disconnect" ? "idle" : "reconnecting"));
    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));
    socket.on("connect_error", async (err) => {
      if (err?.message === "unauthorized" && authRetries < 2) {
        authRetries += 1;
        setStatus("reconnecting");
        if (await api.refreshSession()) socket.connect();
        else setStatus("unauthorized");
        return;
      }
      if (err?.message === "unauthorized") setStatus("unauthorized");
      else setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "reconnecting");
    });
    socket.on("auth:expired", async () => {
      if (await api.refreshSession()) socket.connect();
      else setStatus("unauthorized");
    });
    return socket;
  });
  return socketPromise;
}

/** Emits with an ack and a timeout; resolves to the server's `{ ok, data | error }`. */
export async function emitAck(event, payload, timeout = 15000) {
  const s = await getSocket();
  return new Promise((resolve) => {
    s.timeout(timeout).emit(event, payload, (err, res) => {
      if (err) resolve({ ok: false, error: { code: "TIMEOUT", message: "The server did not respond. Please try again." } });
      else resolve(res || { ok: false, error: { code: "NO_RESPONSE", message: "No response" } });
    });
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  socketPromise = null;
  setStatus("idle");
}
