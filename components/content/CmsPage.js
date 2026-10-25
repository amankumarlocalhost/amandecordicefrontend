import { Photo } from "@/components/ui/bits";
import RichText from "./RichText";

/** An informational page managed in the admin panel (published CMS page, or a draft in preview). */
export default function CmsPage({ page }) {
  const hero = page.heroImage?.url ? page.heroImage : null;
  return (
    <>
      {hero ? (
        <section className="relative h-[22rem] sm:h-[28rem]">
          <Photo src={hero.url} alt={hero.alt || page.title} preload sizes="100vw" />
          <div className="absolute inset-0 bg-olive-950/45" />
          <div className="container-lux relative flex h-full items-end pb-12">
            <h1 className="font-display text-5xl text-cream-50 sm:text-6xl">{page.title}</h1>
          </div>
        </section>
      ) : (
        <div className="container-lux max-w-3xl pt-14">
          <h1 className="font-display text-5xl sm:text-6xl">{page.title}</h1>
        </div>
      )}
      <div className="container-lux max-w-3xl space-y-6 py-12">
        {page.summary ? <p className="font-display text-2xl leading-snug text-ink">{page.summary}</p> : null}
        <RichText source={page.body} />
      </div>
    </>
  );
}
