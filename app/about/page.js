import Image from "next/image";
import Link from "next/link";
import { PHOTOS, unsplash } from "@/lib/images";
import { STORE_NAME } from "@/lib/config";

export const metadata = { title: "Our story", description: `${STORE_NAME}: ceramics, glassware and tableware for beautiful everyday dining.` };

export default function AboutPage() {
  return (
    <>
      <section className="relative h-[22rem] sm:h-[28rem]">
        <Image src={unsplash(PHOTOS.inspiration.src, 2000)} alt={PHOTOS.inspiration.alt} fill preload sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-olive-950/45" />
        <div className="container-lux relative flex h-full items-end pb-12">
          <h1 className="font-display text-5xl text-cream-50 sm:text-6xl">Our Story</h1>
        </div>
      </section>
      <div className="container-lux max-w-3xl space-y-6 py-14 text-[0.95rem] leading-relaxed text-ink-soft">
        <p className="font-display text-2xl leading-snug text-ink">{STORE_NAME} began with a simple belief: the plates, bowls and glasses we use every day should be as beautiful as the moments they hold.</p>
        <p>We curate dinnerware, serveware, glassware and home decor in materials we describe honestly — bone china, porcelain, stoneware, borosilicate and crystal-style glass — and we only list care and safety attributes once they&apos;re verified.</p>
        <p>Because fragile pieces deserve care, every order is packed for the journey, and if anything arrives damaged, reporting it takes a minute from your order page.</p>
        <div className="pt-4">
          <Link href="/shop" className="btn btn-primary">Explore the collection</Link>
        </div>
      </div>
    </>
  );
}
