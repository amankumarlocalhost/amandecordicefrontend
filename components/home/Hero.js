import Link from "next/link";
import { Photo } from "@/components/ui/bits";
import { PHOTOS, unsplash } from "@/lib/images";
import { cmsImage } from "@/lib/cms";

const DEFAULTS = {
  heading: "Make Every\nCorner\nBeautiful.",
  subheading: "Discover thoughtfully curated home décor pieces that bring elegance, warmth and personality to every space.",
  primaryCta: { label: "Explore Collection", href: "/#shop-by-category" },
  secondaryCta: { label: "Shop Now", href: "/shop" },
};

/**
 * Hero: content from the published CMS homepage (`content` = homepage.hero), falling back to the
 * built-in design for anything not set. Part of the prerendered shell, with the LCP image preloaded.
 */
export default function Hero({ content = null }) {
  const c = { ...DEFAULTS, ...Object.fromEntries(Object.entries(content || {}).filter(([, v]) => v !== "" && v != null)) };
  const img = cmsImage(content?.image, { src: unsplash(PHOTOS.hero.src, 1920, 75), alt: PHOTOS.hero.alt });
  const position = content?.imagePosition || "62% 50%";
  const lines = String(c.heading).split("\n");
  return (
    <section className="relative isolate overflow-hidden bg-cream-100">
      <div className="relative h-[34rem] sm:h-[38rem] lg:h-[40rem]">
        <Photo src={img.src} alt={img.alt} preload sizes="100vw" quality={75} style={{ objectPosition: position }} />
        {/* Cream wash on the left keeps the headline legible, as in the reference. */}
        <div className="absolute inset-0 bg-gradient-to-r from-cream-100 via-cream-100/80 to-transparent sm:via-cream-100/55 lg:w-[70%]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cream-100/70 to-transparent sm:hidden" />
        <div className="container-lux relative flex h-full items-center">
          <div className="max-w-[30rem] animate-fade-up">
            <h1 className="font-display text-[3.1rem] leading-[1.02] text-ink sm:text-[4.1rem] lg:text-[4.6rem]">
              {lines.map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h1>
            {c.subheading ? <p className="mt-6 max-w-[23rem] text-[0.95rem] leading-relaxed text-ink-soft">{c.subheading}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {c.primaryCta?.href ? <Link href={c.primaryCta.href} className="btn btn-primary">{c.primaryCta.label}</Link> : null}
              {c.secondaryCta?.href ? <Link href={c.secondaryCta.href} className="btn btn-outline bg-cream-50/40 backdrop-blur-[2px]">{c.secondaryCta.label}</Link> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
