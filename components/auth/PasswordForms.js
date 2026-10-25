"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Field, validators } from "@/components/forms/Field";
import { Notice, Spinner } from "@/components/ui/bits";
import { authApi } from "@/lib/api/endpoints";

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const isPhone = /^[+\d\s-]{10,}$/.test(identifier.trim()) && !identifier.includes("@");

  const submit = async (e) => {
    e.preventDefault();
    if (identifier.trim().length < 3) return setError("Enter your email or mobile number.");
    setBusy(true);
    setError(null);
    try {
      const r = await authApi.forgot(identifier.trim());
      setDone({ message: r.message, dev: r.data, phone: isPhone ? identifier.trim() : null });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div>
        <h1 className="font-display text-4xl">Check your {done.phone ? "phone" : "inbox"}</h1>
        <p className="mt-3 text-sm text-ink-soft">{done.message}.</p>
        {done.dev?.devEmailToken ? <Notice tone="info" className="mt-4">Development mode: <Link className="underline" href={`/reset-password?token=${encodeURIComponent(done.dev.devEmailToken)}`}>open the reset link</Link></Notice> : null}
        {done.dev?.devCode ? <Notice tone="info" className="mt-4">Development mode: your code is <strong>{done.dev.devCode}</strong></Notice> : null}
        {done.phone ? (
          <Link href={`/reset-password?phone=${encodeURIComponent(done.phone)}`} className="btn btn-primary mt-6 w-full">Enter the code</Link>
        ) : (
          <Link href="/login" className="btn btn-outline mt-6 w-full">Back to sign in</Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">Enter your email for a reset link, or your mobile number for a one-time code.</p>
      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <Field label="Email or mobile number" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? <Spinner size={16} /> : null} Continue
        </button>
      </form>
      <p className="mt-8 text-center text-sm"><Link href="/login" className="text-olive-800 underline underline-offset-4">Back to sign in</Link></p>
    </div>
  );
}

export function ResetPasswordForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token");
  const phone = sp.get("phone");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!token && !phone) {
    return (
      <div>
        <h1 className="font-display text-4xl">Link expired or invalid</h1>
        <p className="mt-2 text-sm text-muted">Request a new password reset to continue.</p>
        <Link href="/forgot-password" className="btn btn-primary mt-6 w-full">Request a new link</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const errs = { password: validators.password(password), confirm: password !== confirm ? "Passwords don't match" : null, code: phone && !/^\d{6}$/.test(code) ? "Enter the 6-digit code" : null };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.reset(token ? { token, newPassword: password } : { phone, code, newPassword: password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <Notice tone="success">Your password has been updated. Redirecting you to sign in…</Notice>;

  return (
    <div>
      <h1 className="font-display text-4xl">Choose a new password</h1>
      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        {phone ? <Field label={`Code sent to ${phone}`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" error={errors.code} /> : null}
        <Field label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" error={errors.password} hint="At least 8 characters, with letters and numbers" />
        <Field label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" error={errors.confirm} />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? <Spinner size={16} /> : null} Update password
        </button>
      </form>
    </div>
  );
}

export function VerifyEmail() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [state, setState] = useState(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  const ran = useRef(false);
  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setState("done"))
      .catch((err) => {
        setMessage(err.message);
        setState("error");
      });
  }, [token]);
  return (
    <div className="text-center">
      <h1 className="font-display text-4xl">Email verification</h1>
      <div className="mt-6">
        {state === "verifying" ? <Spinner className="mx-auto text-olive-800" /> : null}
        {state === "done" ? <Notice tone="success">Your email address is verified. Thank you!</Notice> : null}
        {state === "error" ? <Notice tone="error">{message || "This link is invalid or has expired."} You can request a new link from your account.</Notice> : null}
        {state === "missing" ? <Notice tone="warn">This verification link is incomplete.</Notice> : null}
      </div>
      <Link href="/account" className="btn btn-outline mt-6">Go to my account</Link>
    </div>
  );
}
