"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, validators } from "@/components/forms/Field";
import { Notice, Spinner } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/endpoints";
import { safeNext } from "@/lib/nav";

function PasswordLogin({ onDone }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (identifier.trim().length < 3 || !password) return setError("Enter your email or phone and your password.");
    setBusy(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      onDone();
    } catch (err) {
      setError(err.status === 401 ? "That email/phone and password don't match." : err.message);
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Email or mobile number" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-olive-800 underline underline-offset-4">Forgot password?</Link>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? <Spinner size={16} /> : null} Sign in
      </button>
    </form>
  );
}

function OtpLogin({ onDone }) {
  const { loginWithOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const send = async (e) => {
    e.preventDefault();
    const err = validators.phone(phone);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      const r = await authApi.otpSend({ purpose: "login_phone", phone });
      setDevCode(r.data?.devCode || null);
      setSent(true);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  };
  const verify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError(null);
    try {
      await loginWithOtp(phone, code);
      onDone();
    } catch (e2) {
      setError(e2.message);
      setBusy(false);
    }
  };
  return (
    <form onSubmit={sent ? verify : send} className="space-y-5" noValidate>
      <Field label="Mobile number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" disabled={sent} placeholder="98765 43210" />
      {sent ? (
        <>
          <p className="text-sm text-ink-soft">If this number has an account, we&apos;ve sent a 6-digit code.</p>
          {devCode ? <Notice tone="info">Development mode: your code is <strong>{devCode}</strong></Notice> : null}
          <Field label="Verification code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" />
        </>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? <Spinner size={16} /> : null} {sent ? "Verify & sign in" : "Send code"}
      </button>
      {sent ? (
        <button type="button" className="w-full text-xs text-olive-800 underline underline-offset-4" onClick={() => { setSent(false); setCode(""); }}>
          Use a different number
        </button>
      ) : null}
    </form>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { isAuthed, status } = useAuth();
  const [mode, setMode] = useState("password");
  const next = safeNext(sp.get("next"));

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  if (isAuthed) return null;

  return (
    <div>
      <h1 className="font-display text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to track orders, save favourites and check out faster.</p>
      <div className="mt-7 grid grid-cols-2 border-b border-line" role="tablist">
        {[["password", "Password"], ["otp", "Mobile OTP"]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`pb-3 text-[0.7rem] tracking-[0.18em] uppercase ${mode === k ? "border-b-2 border-ink text-ink" : "text-muted"}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6">{mode === "password" ? <PasswordLogin onDone={() => router.replace(next)} /> : <OtpLogin onDone={() => router.replace(next)} />}</div>
      <p className="mt-8 text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/register${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-olive-800 underline underline-offset-4">Create an account</Link>
      </p>
    </div>
  );
}
