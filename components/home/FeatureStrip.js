import Icon from "@/components/ui/Icon";
import { getSettings } from "@/lib/api/server";
import { money } from "@/lib/format";

// Store promises only. Product safety attributes (microwave/dishwasher safe, lead-free…) are verified
// per product by the backend and shown on product pages — never claimed store-wide here.
function items(s) {
  const list = [
    { icon: "diamond", title: "Premium Quality", text: "Curated to last" },
    { icon: "box", title: "Packed With Care", text: "Fragile-safe packaging" },
  ];
  if (s?.shipping?.freeShippingThreshold) list.push({ icon: "truck", title: "Free Shipping", text: `On orders above ${money(s.shipping.freeShippingThreshold)}` });
  if (s?.cod?.enabled) list.push({ icon: "hand", title: "Cash on Delivery", text: "Pay at your doorstep" });
  if (s?.returns?.damageReportWindowDays) list.push({ icon: "shield", title: "Breakage Support", text: `Report within ${s.returns.damageReportWindowDays} days of delivery` });
  return list;
}

export function FeatureStripView({ settings, content = null }) {
  // Custom promises from the admin (Landing page → Store promises) replace the built-in list.
  const list = content?.items?.length ? content.items : items(settings);
  return (
    <section aria-label="Why shop with us" className="border-b border-line bg-cream-50">
      <ul className="container-lux grid grid-cols-2 gap-y-6 py-7 sm:grid-cols-3 lg:flex lg:justify-center lg:py-9">
        {list.map((f, i) => (
          <li key={f.title} className={`flex flex-col items-center gap-2 px-3 text-center lg:flex-1 lg:px-6 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
            <Icon name={f.icon || "diamond"} size={24} strokeWidth={1} className="text-gold-ink" />
            <p className="eyebrow text-[0.6rem] text-ink">{f.title}</p>
            <p className="text-[0.72rem] text-muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function FeatureStrip({ content = null }) {
  const s = content?.items?.length ? null : (await getSettings())?.data;
  return <FeatureStripView settings={s} content={content} />;
}
