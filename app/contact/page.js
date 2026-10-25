import Link from "next/link";
import { Suspense } from "react";
import Icon from "@/components/ui/Icon";
import { getSettings } from "@/lib/api/server";

export const metadata = { title: "Contact us", description: "Get help with orders, deliveries, returns and products." };

async function Details() {
  const store = (await getSettings())?.data?.store;
  return (
    <ul className="space-y-4 text-sm">
      {store?.supportEmail ? <li className="flex items-center gap-3"><Icon name="mail" size={18} className="text-olive-800" /><a href={`mailto:${store.supportEmail}`} className="underline underline-offset-4">{store.supportEmail}</a></li> : null}
      {store?.supportPhone ? <li className="flex items-center gap-3"><Icon name="phone" size={18} className="text-olive-800" /><a href={`tel:${store.supportPhone}`} className="underline underline-offset-4">{store.supportPhone}</a></li> : null}
      {!store ? <li className="text-muted">Contact details are temporarily unavailable.</li> : null}
    </ul>
  );
}

export default function ContactPage() {
  return (
    <div className="container-lux max-w-3xl py-12 sm:py-16">
      <h1 className="font-display text-4xl sm:text-5xl">Contact Us</h1>
      <p className="mt-3 text-sm text-ink-soft">We&apos;re here to help with orders, deliveries, damaged items and product questions.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-2xl">Reach us</h2>
          <div className="mt-4">
            <Suspense fallback={<div className="skeleton h-12" />}>
              <Details />
            </Suspense>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-2xl">Fastest help</h2>
          <p className="mt-3 text-sm text-ink-soft">Signed-in customers can chat with our assistant (bottom-right) to track orders, start a return, or reach a person — or raise a ticket.</p>
          <Link href="/account/support" className="btn btn-primary btn-sm mt-5">Raise a ticket</Link>
        </div>
      </div>
    </div>
  );
}
