"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/endpoints";
import { Notice, Spinner } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Verifies the signed-in customer's phone with a 6-digit OTP (required by the store for COD).
 * `initialDevCode` is only ever present when the backend runs with DEV_EXPOSE_OTP in development.
 */
export default function PhoneVerify({ onVerified, autoSend = false, initialDevCode }) {
  const { user, setUser } = useAuth();
  const [code, setCode] = useState("");
  const [state, setState] = useState(initialDevCode || !autoSend ? "idle" : "sending");
  const [devCode, setDevCode] = useState(initialDevCode || null);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(Boolean(initialDevCode));
  const [cooldown, setCooldown] = useState(0);

  const send = async () => {
    setError(null);
    setState("sending");
    try {
      const r = await authApi.otpSend({ purpose: "verify_phone" });
      setDevCode(r.data?.devCode || null);
      setSent(true);
      setCooldown(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setState("idle");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoSend && !initialDevCode) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    setError(null);
    setState("verifying");
    try {
      await authApi.verifyPhone(code);
      setUser((u) => ({ ...u, phoneVerified: true }));
      onVerified?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setState("idle");
    }
  };

  if (user?.phoneVerified) return <Notice tone="success">Your phone number {user.phone} is verified.</Notice>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        {sent ? <>We sent a 6-digit code to <strong className="font-medium text-ink">{user?.phone}</strong>.</> : <>Verify <strong className="font-medium text-ink">{user?.phone}</strong> with a one-time code.</>}
      </p>
      {devCode ? <Notice tone="info">Development mode: your code is <strong>{devCode}</strong></Notice> : null}
      <form onSubmit={verify} className="flex gap-2">
        <label htmlFor="otp-code" className="sr-only">Verification code</label>
        <input id="otp-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" className="input max-w-44 tracking-[0.4em]" />
        <button type="submit" className="btn btn-primary btn-sm" disabled={state !== "idle" || !sent}>
          {state === "verifying" ? <Spinner size={14} /> : "Verify"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={send} disabled={state !== "idle" || cooldown > 0}>
          {state === "sending" ? <Spinner size={14} /> : cooldown ? `Resend in ${cooldown}s` : sent ? "Resend" : "Send code"}
        </button>
      </form>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
