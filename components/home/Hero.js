import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Photo } from "@/components/ui/bits";
import { CATEGORY_PHOTOS, PHOTOS, unsplash } from "@/lib/images";
import { cmsImage } from "@/lib/cms";

const DEFAULTS = {
  eyebrow: "The Home Décor Edit",
  heading: "Make Every\nCorner\nBeautiful.",
  subheading: "Discover thoughtfully curated home décor pieces that bring elegance, warmth and personality to every space.",
  primaryCta: { label: "Explore Collection", href: "/#shop-by-category" },
  secondaryCta: { label: "Shop Now", href: "/shop" },
};

// Brand lines for the slow band under the hero.
const BRAND_LINES = ["Make Every Corner Beautiful", "Thoughtfully Designed for Beautiful Living", "Bring Your Home to Life", "Little Details. Beautiful Homes."];

function BrandBand({ lines }) {
  if (!lines?.length) return null;
  const row = (hidden) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {lines.map((line) => (
        <li key={line} className="flex items-center">
          <span className="display-italic px-6 text-[1.05rem] whitespace-nowrap text-cream-100/90 sm:px-9 sm:text-[1.2rem]">{line}</span>
          <span className="text-[0.55rem] text-gold-soft" aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden border-y border-cream-50/10 bg-olive-950 py-3.5 sm:py-4">
      <div className="animate-marquee flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/**
 * Hero: content from the published CMS homepage (`content` = homepage.hero), falling back to the
 * built-in design for anything not set. Part of the prerendered shell, with the LCP image preloaded.
 */
export default function Hero({ content = null }) {
  const c = { ...DEFAULTS, ...Object.fromEntries(Object.entries(content || {}).filter(([, v]) => v !== "" && v != null)) };
  const img = cmsImage(content?.image, { src: unsplash(PHOTOS.hero.src, 1920, 75), alt: PHOTOS.hero.alt });
  const position = content?.imagePosition || "62% 50%";
  const lines = String(c.heading).split("\n");
  // Featured corner card (admin: Landing page → Hero → Featured card); built-in: Sculptural Vases.
  const f = content?.featured || {};
  const featured = f.enabled === false ? null : {
    eyebrow: f.eyebrow || "Featured",
    title: f.title || "Sculptural Vases",
    href: f.href || "/category/vases",
    linkLabel: f.linkLabel || "Discover",
    image: cmsImage(f.image, { src: unsplash(CATEGORY_PHOTOS.vases.src, 200), alt: "" }, { size: "thumb" }),
  };
  const brandLines = content?.brandLines?.length ? content.brandLines : BRAND_LINES;
  return (
    <section className="relative isolate overflow-hidden bg-cream-100">
      <div className="relative h-[36rem] sm:h-[40rem] lg:h-[44rem]">
        <div className="animate-ken-burns absolute inset-0">
          <Photo src={img.src} alt={img.alt} preload sizes="100vw" quality={75} style={{ objectPosition: position }} />
        </div>
        {/* Ivory wash on the left keeps the headline legible over any photo. */}
        <div className="absolute inset-0 bg-gradient-to-r from-cream-100 via-cream-100/85 to-transparent sm:via-cream-100/60 lg:w-[72%]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cream-100/80 to-transparent sm:hidden" />

        <div className="container-lux relative flex h-full items-center">
          <div className="max-w-[33rem]">
            <p className="eyebrow eyebrow-rule animate-fade-up text-gold-ink">{c.eyebrow}</p>
            <h1 className="font-display animate-fade-up anim-delay-1 mt-5 text-[3.2rem] leading-[0.98] text-ink sm:text-[4.4rem] lg:text-[5.2rem]">
              {lines.map((line, i) => (
                <span key={i} className={`block ${i === lines.length - 1 && lines.length > 1 ? "display-italic text-gold-ink" : ""}`}>
                  {line}
                </span>
              ))}
            </h1>
            {c.subheading ? <p className="animate-fade-up anim-delay-2 mt-7 max-w-[25rem] text-[0.98rem] leading-relaxed text-ink-soft">{c.subheading}</p> : null}
            <div className="animate-fade-up anim-delay-3 mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              {c.primaryCta?.href ? (
                <Link href={c.primaryCta.href} className="btn btn-primary px-7">
                  {c.primaryCta.label} <Icon name="arrowRight" size={15} />
                </Link>
              ) : null}
              {c.secondaryCta?.href ? (
                <Link href={c.secondaryCta.href} className="btn btn-outline bg-cream-50/40 px-7 backdrop-blur-[2px]">
                  {c.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Desktop details: scroll cue and a small featured card. */}
        <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex" aria-hidden="true">
          <span className="eyebrow text-[0.55rem] text-ink-soft">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-ink/15">
            <span className="animate-scroll-cue absolute inset-0 bg-ink/60" />
          </span>
        </div>
        {featured ? (
        <Link href={featured.href} className="group animate-fade-up anim-delay-3 absolute right-6 bottom-8 hidden items-center gap-4 rounded-[6px] border border-cream-50/60 bg-cream-50/80 p-2.5 pr-5 shadow-[var(--shadow-pop)] backdrop-blur-md transition-transform duration-500 hover:-translate-y-1 lg:flex xl:right-10">
          <span className="relative h-16 w-16 overflow-hidden rounded-[4px] bg-cream-200">
            <Photo src={featured.image.src} alt={featured.image.alt || ""} sizes="64px" className="transition-transform duration-700 group-hover:scale-110" />
          </span>
          <span>
            <span className="eyebrow block text-[0.55rem] text-gold-ink">{featured.eyebrow}</span>
            <span className="font-display mt-0.5 block text-[1.15rem] leading-tight">{featured.title}</span>
            <span className="link-arrow mt-1 text-[0.55rem] text-ink-soft">
              {featured.linkLabel} <Icon name="arrowRight" size={12} />
            </span>
          </span>
        </Link>
        ) : null}
      </div>
      <BrandBand lines={brandLines} />
    </section>
  );
}
