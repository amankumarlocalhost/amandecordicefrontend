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

function Lines({ text }) {
  return String(text)
    .split("\n")
    .map((line, i) => (
      <span key={i}>
        {i > 0 ? <br /> : null}
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
        <div className="relative min-h-[20rem] sm:min-h-[26rem] lg:min-h-[32rem]" data-reveal>
          <Photo src={main.src} alt={main.alt} sizes="(min-width:1024px) 56vw, 100vw" />
        </div>
        <div className="relative flex flex-col justify-center overflow-hidden px-6 py-12 sm:px-12 lg:py-16">
          <Sprig className="pointer-events-none absolute -top-4 -right-6 h-56 w-44 text-olive-700/25" />
          <div data-reveal className="relative max-w-md">
            <h2 id="inspiration-title" className="font-display text-[2.4rem] leading-[1.08] sm:text-5xl">
              <Lines text={c.heading || "Inspiration\nFor Every Table"} />
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">{c.body || "From cozy breakfasts to festive dinners, find pieces that make every moment memorable."}</p>
            <Link href={c.cta?.href || "/collections"} className="btn btn-primary mt-7">
              {c.cta?.label || "Explore lookbook"} <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <ul className="relative mt-9 grid grid-cols-4 gap-2 sm:gap-3" data-reveal>
            {thumbs.map((p, i) => (
              <li key={`${p.src}-${i}`} className="relative aspect-square overflow-hidden rounded-[3px] bg-cream-200">
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
  { icon: "diamond", title: "Premium Materials", text: "Bone china, stoneware, porcelain and fine glass, described exactly as they are." },
  { icon: "box", title: "Packed for Fragile Journeys", text: "Multi-layer protective packing, and quick help if anything arrives damaged." },
  { icon: "users", title: "Honest Reviews", text: "Ratings come only from verified buyers — never invented." },
];

export function WhyChoose({ storeName, content = null }) {
  const c = content || {};
  const items = c.items?.length ? c.items : WHY;
  const img = cmsImage(c.image, { src: unsplash(PHOTOS.why.src, 1600), alt: PHOTOS.why.alt });
  return (
    <section className="container-lux py-14 sm:py-20" aria-labelledby="why-title">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-14">
        <div data-reveal>
          <h2 id="why-title" className="font-display text-[2.3rem] leading-[1.08] sm:text-[2.7rem]">
            {c.heading ? (
              <Lines text={c.heading} />
            ) : (
              <>
                Why Choose
                <br />
                {storeName}?
              </>
            )}
          </h2>
          <ul className="mt-8 space-y-6">
            {items.map((w) => (
              <li key={w.title} className="flex gap-4">
                <Icon name={w.icon || "leaf"} size={28} strokeWidth={1.2} className="shrink-0 text-olive-800" />
                <div>
                  <h3 className="text-sm font-medium">{w.title}</h3>
                  <p className="mt-0.5 text-[0.82rem] leading-relaxed text-muted">{w.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-cream-200 lg:aspect-[16/11]" data-reveal>
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
    <section className="bg-olive-900 py-10 text-cream-50 sm:py-12" aria-labelledby="gallery-title">
      <div className="container-lux">
        <h2 id="gallery-title" className="font-display mb-6 text-center text-2xl sm:text-[1.7rem]">
          {c.heading || (handle ? `Follow @${handle.replace(/^@/, "")} for daily inspiration` : "Set beautifully, every day")}
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
