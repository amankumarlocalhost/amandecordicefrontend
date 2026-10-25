"use client";

import { useState } from "react";
import { Field, fieldErrorsFrom, validators } from "@/components/forms/Field";
import PhoneVerify from "@/components/forms/PhoneVerify";
import { Notice, Spinner, StatusPill } from "@/components/ui/bits";
import { ConfirmDialog } from "@/components/ui/Overlay";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { authApi, userApi } from "@/lib/api/endpoints";
import { useQuery } from "@/lib/useQuery";
import { formatDateTime } from "@/lib/format";

function Card({ title, children, aside }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: user.name, email: user.email, phone: (user.phone || "").replace(/^\+91/, "") });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    const errs = { name: f.name.trim().length < 2 ? "Enter your name" : null, email: validators.email(f.email), phone: validators.phone(f.phone) };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const r = await userApi.update({ name: f.name.trim(), email: f.email.trim(), phone: f.phone });
      setUser((u) => ({ ...u, ...r.data }));
      toast.success("Profile updated");
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const emailChanged = f.email.trim().toLowerCase() !== user.email;
  const phoneChanged = f.phone && !(user.phone || "").endsWith(f.phone.replace(/\D/g, "").slice(-10));
  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field className="sm:col-span-2" label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} autoComplete="name" />
      <Field label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} autoComplete="email" hint={emailChanged ? "Changing your email requires verifying it again" : undefined} />
      <Field label="Mobile number" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={errors.phone} autoComplete="tel" hint={phoneChanged ? "Changing your number requires verifying it again" : undefined} />
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner size={16} /> : null} Save changes</button>
      </div>
    </form>
  );
}

function Verification() {
  const { user } = useAuth();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const resend = async () => {
    setSending(true);
    try {
      const r = await authApi.resendEmail();
      setDevToken(r.data?.devEmailToken || null);
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>Email · {user.email}</span>
        {user.emailVerified ? <StatusPill tone="good">Verified</StatusPill> : (
          <span className="flex items-center gap-3">
            <StatusPill tone="warn">Not verified</StatusPill>
            <button type="button" className="text-xs text-olive-800 underline underline-offset-4" onClick={resend} disabled={sending}>{sending ? "Sending…" : "Resend link"}</button>
          </span>
        )}
      </div>
      {devToken ? <Notice tone="info">Development mode: <a className="underline" href={`/verify-email?token=${encodeURIComponent(devToken)}`}>verify now</a></Notice> : null}
      <div className="border-t border-line pt-5 text-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span>Mobile · {user.phone}</span>
          <StatusPill tone={user.phoneVerified ? "good" : "warn"}>{user.phoneVerified ? "Verified" : "Not verified"}</StatusPill>
        </div>
        {!user.phoneVerified ? <PhoneVerify /> : null}
      </div>
    </div>
  );
}

function PasswordChange() {
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const errs = { currentPassword: f.currentPassword ? null : "Enter your current password", newPassword: validators.password(f.newPassword) };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      await authApi.changePassword(f);
      toast.success("Password changed. Other devices have been signed out.");
      setF({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setErrors(err.code === "INVALID_CREDENTIALS" ? { currentPassword: err.message } : fieldErrorsFrom(err));
      if (err.code !== "INVALID_CREDENTIALS") toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Current password" type="password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} error={errors.currentPassword} autoComplete="current-password" />
      <Field label="New password" type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} error={errors.newPassword} autoComplete="new-password" />
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-outline" disabled={busy}>{busy ? <Spinner size={16} /> : null} Update password</button>
      </div>
    </form>
  );
}

const CHANNELS = [["inApp", "In-app"], ["email", "Email"], ["sms", "SMS"], ["whatsapp", "WhatsApp"]];
const TOPICS = [["orders", "Orders & delivery"], ["support", "Support replies"], ["marketing", "Offers & launches"]];

function Preferences() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const prefs = user.notificationPreferences || {};
  const [busy, setBusy] = useState(null);
  const toggle = async (channel, topic) => {
    const next = !prefs?.[channel]?.[topic];
    setBusy(`${channel}.${topic}`);
    try {
      const r = await userApi.preferences({ [channel]: { [topic]: next } });
      setUser((u) => ({ ...u, notificationPreferences: r.data }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-3 font-normal">Notify me about</th>
            {CHANNELS.map(([k, l]) => <th key={k} className="pb-3 text-center font-normal">{l}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {TOPICS.map(([t, l]) => (
            <tr key={t}>
              <td className="py-3">{l}</td>
              {CHANNELS.map(([c, cl]) => (
                <td key={c} className="py-3 text-center">
                  <input type="checkbox" aria-label={`${l} via ${cl}`} className="h-4 w-4 accent-[var(--olive-800)]" checked={Boolean(prefs?.[c]?.[t])} disabled={busy === `${c}.${t}`} onChange={() => toggle(c, t)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">Important messages about your orders and payments may still be sent where required.</p>
    </div>
  );
}

function Sessions() {
  const { logout } = useAuth();
  const toast = useToast();
  const { data, loading, refetch } = useQuery("me:sessions", async () => (await authApi.sessions()).data);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = Array.isArray(data) ? data : data?.sessions || [];
  const revoke = async (id) => {
    try {
      await authApi.revokeSession(id);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <div>
      {loading ? <div className="skeleton h-16" /> : (
        <ul className="divide-y divide-line text-sm">
          {list.map((s) => (
            <li key={s.id || s._id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="block">{s.userAgent ? s.userAgent.slice(0, 60) : "Unknown device"}{s.current ? <span className="ml-2 text-xs text-success">This device</span> : null}</span>
                <span className="text-xs text-muted">Last active {formatDateTime(s.lastUsedAt || s.updatedAt || s.createdAt)}</span>
              </span>
              {!s.current ? <button type="button" className="text-xs text-danger underline" onClick={() => revoke(s.id || s._id)}>Sign out</button> : null}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => setConfirm(true)}>Sign out of all devices</button>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        busy={busy}
        title="Sign out everywhere?"
        confirmLabel="Sign out all"
        onConfirm={async () => {
          setBusy(true);
          try {
            await authApi.logoutAll();
          } finally {
            setBusy(false);
            setConfirm(false);
            logout();
          }
        }}
      >
        You&apos;ll be signed out on every device, including this one.
      </ConfirmDialog>
    </div>
  );
}

export default function ProfileView() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">My Profile</h1>
      <Card title="Personal details"><ProfileForm /></Card>
      <Card title="Verification"><Verification /></Card>
      <Card title="Notification preferences"><Preferences /></Card>
      <Card title="Password"><PasswordChange /></Card>
      <Card title="Signed-in devices"><Sessions /></Card>
    </div>
  );
}
