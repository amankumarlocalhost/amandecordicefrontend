import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { Photo } from "@/components/ui/bits";
import { CATEGORY_CARDS } from "@/lib/content";
import { unsplash } from "@/lib/images";
import { cmsImage } from "@/lib/cms";

/** Category tiles: the CMS list when published (homepage.categoryCards.items), else the built-in four. */
export default function CategoryCards({ content = null }) {
  const cards = content?.items?.length
    ? content.items.map((c, i) => ({ ...c, photo: cmsImage(c.image, { src: unsplash(CATEGORY_CARDS[i % CATEGORY_CARDS.length].photo.src, 900), alt: c.title }, { size: "medium" }) }))
    : CATEGORY_CARDS.map((c) => ({ ...c, photo: { src: unsplash(c.photo.src, 900), alt: c.photo.alt } }));
  return (
    <section className="container-lux py-12 sm:py-16" aria-labelledby="cat-title">
      <h2 id="cat-title" className="sr-only">Shop by category</h2>
      <ul className={`grid grid-cols-2 gap-3 sm:gap-5 ${cards.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {cards.map((c, i) => (
          <li key={`${c.title}-${i}`} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
            <Link href={c.href} className="group relative block aspect-[4/5] overflow-hidden rounded-[4px] bg-olive-900 sm:aspect-[5/6]">
              <Photo src={c.photo.src} alt={c.photo.alt} sizes="(min-width:1024px) 24vw, 48vw" className="transition-transform duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-olive-950/85 via-olive-950/20 to-transparent" />
              {c.badge ? (
                <span className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-cream-50 text-[0.55rem] font-medium tracking-[0.15em] text-ink uppercase">{c.badge}</span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 p-4 text-cream-50 sm:p-6">
                <h3 className="font-display text-[1.55rem] leading-tight sm:text-[2rem]">{c.title}</h3>
                {c.subtitle ? <p className="mt-0.5 text-[0.72rem] text-cream-200/85 sm:text-xs">{c.subtitle}</p> : null}
                <span className="link-arrow mt-3 text-[0.6rem] text-cream-50">
                  <span className="border-b border-cream-50/60 pb-0.5">Shop now</span>
                  <Icon name="arrowRight" size={14} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
