import { Suspense } from "react";
import CmsPage from "@/components/content/CmsPage";
import PreviewBanner from "@/components/content/PreviewBanner";
import { getPagePreview } from "@/lib/api/server";

export const metadata = { title: "Preview", robots: { index: false, follow: false } };

async function Body({ params, searchParams }) {
  const [{ slug }, { token }] = await Promise.all([params, searchParams]);
  const page = token ? await getPagePreview(slug, token) : null;
  if (!page) return <PreviewBanner expired />;
  return (
    <>
      <PreviewBanner />
      <CmsPage page={page} />
    </>
  );
}

/** Draft page preview opened from the admin panel with a signed, short-lived token. */
export default function PagePreview({ params, searchParams }) {
  return (
    <Suspense fallback={<div className="container-lux min-h-[50vh] py-14" aria-busy="true" />}>
      <Body params={params} searchParams={searchParams} />
    </Suspense>
  );
}
