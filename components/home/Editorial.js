import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Photo } from "@/components/ui/bits";
import { PHOTOS, unsplash } from "@/lib/images";
import { SOCIAL } from "@/lib/config";
import { cmsImage } from "@/lib/cms";

// Editorial sections. Each takes the matching block of the published CMS homepage as `content` and
// falls back to the built-in copy and photography for anything that is not set.

function Sprig({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 120 160" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden="true">
      <path d="M20 155C40 110 60 70 105 8" />
      {[[34, 120, -1], [44, 100, 1], [55, 82, -1], [66, 64, 1], [78, 46, -1], [90, 28, 1]].map(([x, y, s], i) => (
        <path key={i} d={`M${x} ${y}c${s * 14} -4 ${s * 22} -14 ${s * 24} -26c${s * -14} 4 ${s * -22} 12 ${s * -24} 26Z`} />
      ))}
    </svg>
  );
}

/** Multi-line heading; the last line is set in italic serif as an editorial accent. */
function Lines({ text, accentLast = true }) {
  const lines = String(text).split("\n");
  return lines.map((line, i) => (
    <span key={i} className={`block ${accentLast && lines.length > 1 && i === lines.length - 1 ? "display-italic text-gold-ink" : ""}`}>
      {line}
    </span>
  ));
}

export function Inspiration({ content = null }) {
  const c = content || {};
  const main = cmsImage(c.image, { src: unsplash(PHOTOS.inspiration.src, 1800), alt: PHOTOS.inspiration.alt });
  const thumbs = c.thumbs?.length
    ? c.thumbs.map((t, i) => cmsImage(t, { src: unsplash(PHOTOS.inspirationThumbs[i % 4].src, 400), alt: "" }, { size: "thumb" }))
    : PHOTOS.inspirationThumbs.map((p) => ({ src: unsplash(p.src, 400), alt: p.alt }));
  return (
    <section className="bg-cream-50" aria-labelledby="inspiration-title">
      <div className="grid lg:grid-cols-[1.25fr_1fr]">
        <div className="frame-inset relative min-h-[22rem] sm:min-h-[28rem] lg:min-h-[36rem]" data-reveal>
          <Photo src={main.src} alt={main.alt} sizes="(min-width:1024px) 56vw, 100vw" />
        </div>
        <div className="relative flex flex-col justify-center overflow-hidden px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
          <Sprig className="pointer-events-none absolute -top-4 -right-6 h-56 w-44 text-olive-700/25" />
          <div data-reveal className="relative max-w-md">
            <p className="eyebrow eyebrow-rule mb-4 text-gold-ink">{c.eyebrow || "The Lookbook"}</p>
            <h2 id="inspiration-title" className="font-display text-[2.5rem] leading-[1.04] sm:text-[3.3rem]">
              <Lines text={c.heading || "Home Styling\nInspiration"} />
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">{c.body || "Layer textures, mix materials and let a few beautiful pieces set the mood — ideas for every room in your home."}</p>
            <Link href={c.cta?.href || "/collections"} className="btn btn-primary mt-7">
              {c.cta?.label || "Explore lookbook"} <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <ul className="relative mt-10 grid grid-cols-4 gap-2 sm:gap-3" data-reveal>
            {thumbs.map((p, i) => (
              <li key={`${p.src}-${i}`} className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-cream-200">
                <Photo src={p.src} alt={p.alt} sizes="(min-width:1024px) 9vw, 22vw" className="transition-transform duration-700 hover:scale-105" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const WHY = [
  { icon: "leaf", title: "Thoughtful Design", text: "Timeless pieces that never go out of style." },
  { icon: "diamond", title: "Premium Materials", text: "Brass, marble, mango wood, ceramic and glass, described exactly as they are." },
  { icon: "box", title: "Packed for Fragile Journeys", text: "Multi-layer protective packing, and quick help if anything arrives damaged." },
  { icon: "users", title: "Honest Reviews", text: "Ratings come only from verified buyers — never invented." },
];

export function WhyChoose({ storeName, content = null }) {
  const c = content || {};
  const items = c.items?.length ? c.items : WHY;
  const img = cmsImage(c.image, { src: unsplash(PHOTOS.why.src, 1600), alt: PHOTOS.why.alt });
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="why-title">
      <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.35fr] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow eyebrow-rule mb-4 text-gold-ink">{c.eyebrow || "Our promise"}</p>
          <h2 id="why-title" className="font-display text-[2.3rem] leading-[1.06] sm:text-[2.9rem]">
            {c.heading ? (
              <Lines text={c.heading} />
            ) : (
              <>
                <span className="block">Why Choose</span>
                <span className="display-italic block text-gold-ink">{storeName}?</span>
              </>
            )}
          </h2>
          <ul className="mt-9 divide-y divide-line border-y border-line">
            {items.map((w, i) => (
              <li key={w.title} className="flex items-start gap-5 py-5">
                <span className="display-italic w-8 shrink-0 text-[1.6rem] leading-none text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-[0.92rem] font-medium">
                    <Icon name={w.icon || "leaf"} size={17} strokeWidth={1.2} className="shrink-0 text-ink-soft" /> {w.title}
                  </h3>
                  <p className="mt-1 text-[0.84rem] leading-relaxed text-muted">{w.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="frame-inset relative aspect-[4/3] overflow-hidden rounded-[6px] bg-cream-200 lg:aspect-[16/11]" data-reveal>
          <Photo src={img.src} alt={img.alt} sizes="(min-width:1024px) 60vw, 100vw" />
        </div>
      </div>
    </section>
  );
}

/** Editorial image strip (styled like the reference's social row). Links out only when a profile URL is configured. */
export function Gallery({ content = null, social = null }) {
  const c = content || {};
  const s = { ...SOCIAL, ...(social || {}) };
  const handle = s.instagramHandle;
  const images = c.images?.length
    ? c.images.map((img, i) => cmsImage(img, { src: unsplash(PHOTOS.gallery[i % PHOTOS.gallery.length].src, 500), alt: "" }, { size: "medium" }))
    : PHOTOS.gallery.map((p) => ({ src: unsplash(p.src, 500), alt: p.alt }));
  return (
    <section className="bg-olive-900 py-14 text-cream-50 sm:py-16" aria-labelledby="gallery-title">
      <div className="container-lux">
        <p className="eyebrow eyebrow-rule is-centered mb-3 flex justify-center text-gold-soft">{c.eyebrow || "Inspired living"}</p>
        <h2 id="gallery-title" className="display-italic mb-8 text-center text-[1.8rem] sm:text-[2.2rem]">
          {c.heading || (handle ? `Follow @${handle.replace(/^@/, "")} for daily inspiration` : "Little details. Beautiful homes.")}
        </h2>
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-6 sm:px-0">
          {images.map((p, i) => (
            <li key={`${p.src}-${i}`} className="relative aspect-square w-[42%] shrink-0 snap-start overflow-hidden rounded-[3px] sm:w-auto">
              <Photo src={p.src} alt={p.alt} sizes="(min-width:640px) 16vw, 42vw" className="transition-transform duration-700 hover:scale-105" />
            </li>
          ))}
        </ul>
        {s.instagram ? (
          <div className="mt-7 text-center">
            <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm border border-cream-200/50 text-cream-50 hover:bg-cream-50 hover:text-ink">
              View on Instagram <Icon name="arrowRight" size={14} />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
