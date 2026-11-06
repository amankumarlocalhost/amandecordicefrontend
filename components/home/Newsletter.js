"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { userApi } from "@/lib/api/endpoints";
import { PHOTOS, unsplash } from "@/lib/images";
import { cmsImage } from "@/lib/cms";

/**
 * The backend has no standalone newsletter list; updates are sent to customers who opt in to
 * marketing emails (users.notificationPreferences.email.marketing). Signed-in customers opt in
 * directly; guests are taken to sign-up with their email pre-filled and the opt-in pre-ticked.
 */
export default function Newsletter({ content = null }) {
  const { isAuthed, user, setUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const optedIn = Boolean(user?.notificationPreferences?.email?.marketing);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthed) {
      router.push(`/register?email=${encodeURIComponent(email.trim())}&updates=1`);
      return;
    }
    setBusy(true);
    try {
      const r = await userApi.preferences({ email: { marketing: true } });
      setUser((u) => ({ ...u, notificationPreferences: r.data }));
      toast.success(`You're subscribed. Updates will go to ${user.email}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-line bg-cream-100" aria-labelledby="newsletter-title">
      <div className="container-lux flex flex-col items-center gap-6 py-12 sm:flex-row sm:gap-10 sm:py-14">
        <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-full sm:block">
          <Image src={cmsImage(content?.image, { src: unsplash(PHOTOS.newsletter.src, 300), alt: "" }, { size: "thumb" }).src} alt="" fill sizes="112px" className="object-cover" />
        </div>
        <div className="text-center sm:text-left">
          <h2 id="newsletter-title" className="font-display text-[2rem] leading-tight sm:text-[2.3rem]">
            {content?.heading || (
              <>
                Let’s Stay <span className="display-italic text-gold-ink">in Touch</span>
              </>
            )}
          </h2>
          <p className="mt-1 text-[0.8rem] text-muted">{content?.body || "Sign up for updates, new launches and exclusive offers."}</p>
        </div>
        {isAuthed && optedIn ? (
          <p className="flex items-center gap-2 text-sm text-success sm:ml-auto">
            <Icon name="check" size={18} /> You&apos;re subscribed with {user.email}
          </p>
        ) : (
          <form onSubmit={submit} className="flex w-full max-w-md sm:ml-auto">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            {isAuthed ? (
              <p className="input flex items-center text-sm text-ink-soft">{user.email}</p>
            ) : (
              <input id="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="input" autoComplete="email" />
            )}
            <button type="submit" className="btn btn-primary min-w-12 px-4" disabled={busy} aria-label="Subscribe">
              {busy ? <Spinner size={16} /> : <Icon name="arrowRight" size={18} />}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
