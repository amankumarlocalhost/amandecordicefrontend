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

export function FeatureStripView({ settings }) {
  const list = items(settings);
  return (
    <section aria-label="Why shop with us" className="border-y border-line bg-cream-50">
      <ul className="container-lux grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:grid-cols-3 lg:flex lg:justify-between lg:py-7">
        {list.map((f) => (
          <li key={f.title} className="flex items-center gap-3">
            <Icon name={f.icon} size={26} strokeWidth={1.2} className="shrink-0 text-olive-800" />
            <div>
              <p className="text-[0.72rem] font-medium tracking-wide text-ink">{f.title}</p>
              <p className="text-[0.68rem] text-muted">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function FeatureStrip() {
  const s = (await getSettings())?.data;
  return <FeatureStripView settings={s} />;
}
