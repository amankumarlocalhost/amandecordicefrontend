"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, fieldErrorsFrom, validators } from "@/components/forms/Field";
import PhoneVerify from "@/components/forms/PhoneVerify";
import { Notice, Spinner } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";
import { userApi } from "@/lib/api/endpoints";
import { safeNext } from "@/lib/nav";

export default function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const { register, setUser } = useAuth();
  const next = safeNext(sp.get("next"), "/account");
  const [form, setForm] = useState({ name: "", email: sp.get("email") || "", phone: "", password: "" });
  const [updates, setUpdates] = useState(sp.get("updates") === "1");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {
      name: form.name.trim().length < 2 ? "Enter your full name" : null,
      email: validators.email(form.email),
      phone: validators.phone(form.phone),
      password: validators.password(form.password),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    setError(null);
    try {
      const data = await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
      if (updates) {
        // Opt-in to marketing emails is stored as a notification preference on the account.
        const r = await userApi.preferences({ email: { marketing: true } }).catch(() => null);
        if (r) setUser((u) => ({ ...u, notificationPreferences: r.data }));
      }
      setCreated(data);
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setError(err.status === 409 ? "An account with this email or phone already exists. Try signing in." : err.message);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div>
        <h1 className="font-display text-4xl">Welcome, {created.user.name.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-muted">Your account is ready. Verify your mobile number to enable Cash on Delivery.</p>
        {created.devEmailToken ? (
          <Notice tone="info" className="mt-4">
            Development mode: <Link href={`/verify-email?token=${encodeURIComponent(created.devEmailToken)}`} className="underline">verify your email</Link>
          </Notice>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">We&apos;ve also emailed a link to verify {created.user.email}.</p>
        )}
        <div className="card mt-6 p-5">
          <PhoneVerify initialDevCode={created.devCode} onVerified={() => router.replace(next)} />
        </div>
        <button type="button" onClick={() => router.replace(next)} className="btn btn-outline mt-6 w-full">
          I&apos;ll do this later
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Create an account</h1>
      <p className="mt-2 text-sm text-muted">Save your addresses, track deliveries and report any breakage in seconds.</p>
      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <Field label="Full name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Field label="Mobile number" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" hint="Used for delivery updates and Cash on Delivery verification" />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" hint="At least 8 characters, with letters and numbers" />
        <label className="flex items-start gap-2.5 text-sm text-ink-soft">
          <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--olive-800)]" />
          Email me about new launches and offers (you can change this anytime)
        </label>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? <Spinner size={16} /> : null} Create account
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-olive-800 underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}
