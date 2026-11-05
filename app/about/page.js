import Image from "next/image";
import Link from "next/link";
import { PHOTOS, unsplash } from "@/lib/images";
import { STORE_NAME } from "@/lib/config";

export const metadata = { title: "Our story", description: `${STORE_NAME}: premium home décor and home living, thoughtfully designed for beautiful living.` };

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
        <p className="font-display text-2xl leading-snug text-ink">{STORE_NAME} began with a simple belief: the objects we live with every day should make our homes feel warm, personal and beautiful.</p>
        <p>We curate vases, wall décor, candle stands, planters, photo frames, table décor and kitchen accents in materials we describe honestly — brass, marble, mango wood, ceramic, terracotta and glass — for the living room, bedroom, dining room, kitchen, balcony and entryway.</p>
        <p>Because fragile pieces deserve care, every order is packed for the journey, and if anything arrives damaged, reporting it takes a minute from your order page.</p>
        <div className="pt-4">
          <Link href="/shop" className="btn btn-primary">Explore the collection</Link>
        </div>
      </div>
    </>
  );
}
