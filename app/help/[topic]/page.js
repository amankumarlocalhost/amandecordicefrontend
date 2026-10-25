import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/bits";
import { getSettings } from "@/lib/api/server";
import { money } from "@/lib/format";

// Policy numbers (fees, thresholds, windows) are read live from GET /settings/public, never hardcoded.
const TOPICS = {
  shipping: { title: "Shipping & Delivery" },
  returns: { title: "Returns & Replacements" },
  care: { title: "Care Guide" },
  faq: { title: "Frequently Asked Questions" },
};

export function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }) {
  const { topic } = await params;
  return { title: TOPICS[topic]?.title || "Help" };
}

function Section({ title, children }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

function Shipping({ s }) {
  return (
    <>
      <Section title="Delivery charges">
        {s ? (
          <>
            <p>Orders above <strong>{money(s.shipping.freeShippingThreshold)}</strong> ship free. Below that, shipping starts at {money(s.shipping.baseFee)} for the first {s.shipping.includedWeightGrams / 1000} kg, plus {money(s.shipping.perKgFee)} per additional kg.</p>
            {s.shipping.fragileSurcharge ? <p>Fragile items such as glassware and fine china need extra protective packing, which adds {money(s.shipping.fragileSurcharge)}.</p> : null}
            <p>The exact charge for your order is calculated at checkout for your PIN code.</p>
          </>
        ) : <p>Shipping charges are calculated at checkout for your PIN code.</p>}
      </Section>
      <Section title="Delivery times">
        <p>Most orders arrive in about {s?.shipping?.defaultEstimatedDays || "a few"} working days. Check the estimate for your PIN code on any product page — it is an estimate, not a courier commitment.</p>
      </Section>
      <Section title="Cash on Delivery">
        {s?.cod?.enabled ? (
          <p>Cash on Delivery is available on eligible PIN codes{s.cod.maxOrderValue ? ` for orders up to ${money(s.cod.maxOrderValue)}` : ""}{s.cod.fee ? `, with a ${money(s.cod.fee)} COD fee` : ""}.{s.cod.requireVerifiedPhone ? " You'll need to verify your mobile number once." : ""}</p>
        ) : <p>Cash on Delivery is currently unavailable. You can pay securely with UPI.</p>}
      </Section>
      <Section title="Tracking"><p>Track every order from <Link href="/account/orders" className="underline">My Orders</Link>. We&apos;ll also notify you when it ships.</p></Section>
    </>
  );
}

function Returns({ s }) {
  const r = s?.returns;
  return (
    <>
      <Section title="Arrived broken, chipped or incomplete?">
        <p>Fragile pieces travel a long way. If anything arrives broken, chipped, with missing pieces from a set, or is the wrong item or variant, report it from <Link href="/account/orders" className="underline">My Orders</Link> → choose the order → <em>Report a problem</em>{r?.damageReportWindowDays ? <> within <strong>{r.damageReportWindowDays} days</strong> of delivery</> : null}.</p>
        {r?.requirePhotosForDamage ? <p>Please add clear photos of the damaged item and the outer box — this lets us approve most claims quickly.</p> : null}
      </Section>
      <Section title="Returns">
        <p>Eligible items can be returned or replaced{r?.defaultWindowDays ? ` within ${r.defaultWindowDays} days of delivery` : ""}. Some items are replacement-only or non-returnable; this is shown on each product page.</p>
        <p>{r?.allowChangeOfMind ? "Change-of-mind returns are accepted on eligible items." : "We currently accept returns for damaged, defective, incorrect or not-as-described items."}</p>
        {r?.pickupRequiredForReturn ? <p>For returns we arrange a pickup — please pack the item securely.</p> : null}
      </Section>
      <Section title="Refunds">
        <p>UPI payments are refunded to the original account. For Cash on Delivery orders you&apos;ll be asked for a UPI ID or bank details. Refund status is shown on your order page.</p>
      </Section>
    </>
  );
}

function Care() {
  return (
    <>
      <Section title="Check each product's care details">
        <p>Microwave, dishwasher, oven and freezer suitability differs from piece to piece. We only list these attributes once they&apos;re verified, on each product page under <em>Care &amp; safety</em>.</p>
      </Section>
      <Section title="Fine china and metallic rims"><p>Pieces with gold or platinum rims should not go in the microwave. Hand wash them with a soft sponge and mild detergent.</p></Section>
      <Section title="Glassware"><p>Avoid sudden temperature changes — don&apos;t pour boiling liquids into cold glass, or rinse hot glass in cold water. Borosilicate glass is more resistant to thermal shock than regular glass.</p></Section>
      <Section title="Stoneware & handmade ceramics"><p>Reactive glazes vary naturally from piece to piece. Let pieces cool before washing and avoid abrasive scrubbers to protect the glaze.</p></Section>
    </>
  );
}

function Faq({ s }) {
  const qs = [
    ["Which payment methods do you accept?", "UPI (through Razorpay) and Cash on Delivery on eligible orders. Your order is confirmed only after the payment is verified by our server."],
    ["Can I cancel my order?", "Yes — until it's packed. Open the order in My Orders and choose Cancel. Prepaid amounts are refunded to the original UPI account."],
    ["What if something arrives broken?", `Report it with photos from My Orders${s?.returns?.damageReportWindowDays ? ` within ${s.returns.damageReportWindowDays} days of delivery` : ""}. Most damage claims are resolved with a replacement or refund.`],
    ["Do you offer gift wrapping?", s?.giftWrap?.enabled ? `Yes, on eligible items for ${money(s.giftWrap.fee)}. You can add a gift message at checkout.` : "Gift wrapping is currently unavailable."],
    ["Are your reviews genuine?", "Only customers whose order has been delivered can write a review, and reviews are moderated before they appear."],
  ];
  return (
    <div className="divide-y divide-line border-y border-line">
      {qs.map(([q, a]) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-medium">
            {q}
            <span className="text-xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  );
}

async function Body({ topic }) {
  const s = (await getSettings())?.data;
  if (topic === "shipping") return <Shipping s={s} />;
  if (topic === "returns") return <Returns s={s} />;
  if (topic === "care") return <Care />;
  return <Faq s={s} />;
}

async function Content({ params }) {
  const { topic } = await params;
  if (!TOPICS[topic]) notFound();
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help", href: "/help/faq" }, { label: TOPICS[topic].title }]} />
      <h1 className="font-display mt-6 mb-8 text-4xl sm:text-5xl">{TOPICS[topic].title}</h1>
      <nav aria-label="Help topics" className="mb-6 flex flex-wrap gap-2">
        {Object.entries(TOPICS).map(([k, v]) => (
          <Link key={k} href={`/help/${k}`} aria-current={k === topic ? "page" : undefined} className={`chip px-4 py-1.5 ${k === topic ? "border-olive-900 bg-olive-900 text-cream-50" : "hover:border-ink"}`}>{v.title}</Link>
        ))}
      </nav>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Body topic={topic} />
      </Suspense>
      <p className="mt-10 text-sm text-muted">Still need help? <Link href="/contact" className="underline">Contact us</Link>.</p>
    </>
  );
}

export default function HelpPage({ params }) {
  return (
    <div className="container-lux max-w-3xl py-8 sm:py-12">
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}
