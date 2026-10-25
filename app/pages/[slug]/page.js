import { Suspense } from "react";
import { notFound } from "next/navigation";
import CmsPage from "@/components/content/CmsPage";
import { getShellPage } from "@/lib/api/server";

// Informational pages published from the admin panel (care guide, policies, brand story…).

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getShellPage(slug);
  if (!p) return { title: "Page not found" };
  return { title: p.seo?.title || p.title, description: p.seo?.description || p.summary, alternates: { canonical: `/pages/${slug}` } };
}

async function Body({ params }) {
  const { slug } = await params;
  const page = await getShellPage(slug);
  if (!page) notFound();
  return <CmsPage page={page} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<div className="container-lux min-h-[50vh] py-14" aria-busy="true" />}>
      <Body params={params} />
    </Suspense>
  );
}
