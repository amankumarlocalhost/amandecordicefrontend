import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { Photo } from "@/components/ui/bits";
import { tryPublic } from "@/lib/api/server";
import { PHOTOS, unsplash } from "@/lib/images";
import { cmsImage } from "@/lib/cms";

function Shell({ script, title, children, href, cta, image }) {
  return (
    <section className="bg-olive-950 text-cream-50" aria-label={`${script} ${title}`}>
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)]">
        <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-1320px)/2+2.5rem))]">
          <p className="font-script text-5xl leading-none text-gold-soft sm:text-6xl">{script}</p>
          <h2 className="font-display mt-1 text-[2.4rem] leading-[1.05] sm:text-[3.3rem]">{title}</h2>
          <span className="mt-6 block h-px w-14 bg-gold-soft/60" aria-hidden="true" />
          <div className="mt-5 max-w-xs text-sm leading-relaxed text-cream-200/85">{children}</div>
          <Link href={href} className="btn btn-light mt-8 self-start">
            {cta} <Icon name="arrowRight" size={15} />
          </Link>
        </div>
        <div className="frame-inset relative min-h-[20rem] sm:min-h-[26rem] lg:min-h-[30rem]">{image}</div>
      </div>
    </section>
  );
}

/**
 * Live campaign from GET /promotions/active. The "up to X% off" line is computed from the live
 * percentage promotions; with no live campaign an editorial gifting banner (no discount claim) is shown.
 */
export default async function PromoBanner({ content = null }) {
  const data = (await tryPublic("/promotions/active"))?.data;
  const campaign = data?.campaigns?.[0];
  if (campaign) {
    const [first, ...rest] = campaign.name.split(" ");
    const pct = Math.max(0, ...(data.promotions || []).filter((p) => p.discountType === "percentage").map((p) => p.value / 100)); // percentage promotions are stored in basis points
    return (
      <Shell
        script={first}
        title={rest.join(" ") || "Sale"}
        href="/shop?discounted=true&sort=discount"
        cta="Shop the sale"
        image={campaign.banner?.url ? <Photo src={campaign.banner.url} alt={campaign.name} sizes="(min-width:1024px) 64vw, 100vw" /> : <Image src={unsplash(PHOTOS.promo.src, 1800)} alt={PHOTOS.promo.alt} fill sizes="(min-width:1024px) 64vw, 100vw" className="object-cover" />}
      >
        {campaign.description ? <p>{campaign.description}</p> : null}
        {pct > 0 ? (
          <p className="mt-5">
            <span className="block text-[0.7rem] tracking-[0.2em] uppercase">Up to</span>
            <span className="font-display block text-5xl">{Math.round(pct)}% Off</span>
            <span className="mt-1 block text-[0.68rem] tracking-[0.2em] uppercase">Select collections</span>
          </p>
        ) : null}
      </Shell>
    );
  }
  // No live campaign: the editorial banner from the CMS (homepage.promo), else the built-in one.
  const c = content || {};
  const img = cmsImage(c.image, { src: unsplash(PHOTOS.promo.src, 1800), alt: PHOTOS.promo.alt });
  return (
    <Shell
      script={c.script || "Gifted"}
      title={c.title || "Bring Your Home to Life"}
      href={c.cta?.href || "/collections?type=gift"}
      cta={c.cta?.label || "Explore gifting"}
      image={<Photo src={img.src} alt={img.alt} sizes="(min-width:1024px) 64vw, 100vw" />}
    >
      <p>{c.body || "Sculptural vases, statement wall décor and warm candlelight — pieces chosen to give every room its own personality."}</p>
      <p className="mt-4 text-[0.7rem] tracking-[0.2em] text-gold-soft uppercase">{c.note || "Gift wrap available at checkout"}</p>
    </Shell>
  );
}

export function PromoBannerSkeleton() {
  return <div className="h-[30rem] bg-olive-950 lg:h-[27rem]" aria-hidden="true" />;
}
