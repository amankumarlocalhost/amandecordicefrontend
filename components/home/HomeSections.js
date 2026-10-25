import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import FeatureStrip, { FeatureStripView } from "@/components/home/FeatureStrip";
import CategoryCards from "@/components/home/CategoryCards";
import PromoBanner, { PromoBannerSkeleton } from "@/components/home/PromoBanner";
import { BestSellers, NewArrivals, RailSectionSkeleton } from "@/components/home/ProductSections";
import { Gallery, Inspiration, WhyChoose } from "@/components/home/Editorial";
import GiftCollections from "@/components/home/GiftCollections";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";
import { STORE_NAME } from "@/lib/config";
import { sectionOrder } from "@/lib/cms";

/**
 * The homepage, composed from the published CMS content (`content` = homepage block, or null for the
 * built-in design). Admins control section order and visibility; static sections are prerendered,
 * sections that need live catalog data stream in behind their own skeletons.
 */
export default function HomeSections({ content = null, footer = null }) {
  const c = content || {};
  const render = {
    hero: () => <Hero content={c.hero} />,
    features: () => (
      <Suspense fallback={<FeatureStripView settings={null} />}>
        <FeatureStrip />
      </Suspense>
    ),
    categories: () => <CategoryCards content={c.categoryCards} />,
    promo: () => (
      <Suspense fallback={<PromoBannerSkeleton />}>
        <PromoBanner content={c.promo} />
      </Suspense>
    ),
    bestSellers: () => (
      <Suspense fallback={<RailSectionSkeleton title={c.bestSellers?.title || "Best Sellers"} />}>
        <BestSellers content={c.bestSellers} />
      </Suspense>
    ),
    inspiration: () => <Inspiration content={c.inspiration} />,
    newArrivals: () => (
      <Suspense fallback={null}>
        <NewArrivals content={c.newArrivals} />
      </Suspense>
    ),
    collections: () => (
      <Suspense fallback={null}>
        <GiftCollections content={c.collections} />
      </Suspense>
    ),
    whyChoose: () => <WhyChoose storeName={STORE_NAME} content={c.whyChoose} />,
    testimonials: () => (
      <Suspense fallback={null}>
        <Testimonials content={c.testimonials} />
      </Suspense>
    ),
    gallery: () => <Gallery content={c.gallery} social={footer?.social} />,
    newsletter: () => <Newsletter content={c.newsletter} />,
  };
  return (
    <>
      {sectionOrder(content).map((id) => (
        <div key={id} className="contents" data-section={id}>
          {render[id]()}
        </div>
      ))}
    </>
  );
}
