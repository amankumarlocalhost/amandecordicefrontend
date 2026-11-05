import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Icon from "@/components/ui/Icon";
import { FOOTER_ABOUT, FOOTER_COLLECTIONS, FOOTER_HELP, FOOTER_SHOP } from "@/lib/content";
import { LEGAL, SOCIAL, STORE_NAME } from "@/lib/config";
import { cacheLife } from "next/cache";

// Reading the clock must happen inside a cache scope with Cache Components.
async function Year() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function Column({ title, links }) {
  return (
    <div>
      <h3 className="eyebrow mb-4 text-cream-50">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="link-underline text-[0.82rem] text-cream-200/80 hover:text-cream-50">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DEFAULT_COLUMNS = [
  { title: "Shop", links: FOOTER_SHOP },
  { title: "Collections", links: FOOTER_COLLECTIONS },
  { title: "Help", links: FOOTER_HELP },
  { title: "About", links: FOOTER_ABOUT },
];
const DEFAULT_ABOUT = "Premium home décor and home living pieces, packed with care for every journey and chosen to bring beauty to your everyday moments.";
const GRID = { 2: "lg:grid-cols-[1.4fr_repeat(2,1fr)]", 3: "lg:grid-cols-[1.4fr_repeat(3,1fr)]", 4: "lg:grid-cols-[1.4fr_repeat(4,1fr)]", 5: "lg:grid-cols-[1.4fr_repeat(5,1fr)]" };

/** `content` is the published CMS footer (or null); every part falls back to the built-in footer. */
export default function Footer({ content = null, extraLinks = [], shopLinks = null }) {
  const social = { ...SOCIAL, ...(content?.social || {}) };
  const legal = { ...LEGAL, ...(content?.legal || {}) };
  // Built-in "Shop" column follows the live category tree when the layout provides it.
  const base = content?.columns?.length ? content.columns : DEFAULT_COLUMNS.map((c) => (c.title === "Shop" && shopLinks?.length ? { ...c, links: shopLinks } : c));
  // Published CMS pages marked "Listed in footer" join the last column.
  const columns = extraLinks.length ? base.map((c, i) => (i === base.length - 1 ? { ...c, links: [...(c.links || []), ...extraLinks.filter((x) => !(c.links || []).some((l) => l.href === x.href))] } : c)) : base;
  const socials = [
    social.instagram && { href: social.instagram, icon: "instagram", label: "Instagram" },
    social.pinterest && { href: social.pinterest, icon: "pinterest", label: "Pinterest" },
    social.facebook && { href: social.facebook, icon: "facebook", label: "Facebook" },
  ].filter(Boolean);
  return (
    <footer className="bg-olive-950 text-cream-100">
      <div className={`container-lux grid gap-10 py-14 sm:grid-cols-2 lg:py-16 ${GRID[columns.length] || "lg:grid-cols-[1.4fr_1fr]"}`}>
        <div className="max-w-xs">
          <Logo inverted />
          <p className="mt-5 text-[0.82rem] leading-relaxed text-cream-200/75">{content?.about || DEFAULT_ABOUT}</p>
          {socials.length ? (
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200/25 text-cream-200 transition-colors hover:border-cream-50 hover:text-cream-50" aria-label={s.label}>
                  <Icon name={s.icon} size={16} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
        {columns.map((c) => (
          <Column key={c.title} title={c.title} links={c.links || []} />
        ))}
      </div>
      <div className="border-t border-cream-200/15">
        <div className="container-lux flex flex-col items-center justify-between gap-3 py-5 text-[0.72rem] text-cream-200/60 sm:flex-row">
          <p>© <Year /> {STORE_NAME}. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-5">
            {legal.privacy ? <li><a href={legal.privacy} className="hover:text-cream-50">Privacy Policy</a></li> : null}
            {legal.terms ? <li><a href={legal.terms} className="hover:text-cream-50">Terms &amp; Conditions</a></li> : null}
            <li><Link href="/sitemap.xml" prefetch={false} className="hover:text-cream-50">Sitemap</Link></li>
            <li>{content?.paymentNote || "Payments: UPI · Cash on Delivery"}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
