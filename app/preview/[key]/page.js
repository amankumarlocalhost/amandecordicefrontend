import { Suspense } from "react";
import { notFound } from "next/navigation";
import HomeSections from "@/components/home/HomeSections";
import Footer from "@/components/layout/Footer";
import { AnnouncementShell } from "@/components/layout/AnnouncementBar";
import PreviewBanner from "@/components/content/PreviewBanner";
import { getContentPreview, getShellContent } from "@/lib/api/server";

export const metadata = { title: "Preview", robots: { index: false, follow: false } };

const KEYS = new Set(["homepage", "footer", "announcement", "navigation"]);

async function Body({ params, searchParams }) {
  const [{ key }, { token }] = await Promise.all([params, searchParams]);
  if (!KEYS.has(key)) notFound();
  const draft = token ? await getContentPreview(key, token) : null;
  if (!draft) return <PreviewBanner expired />;
  if (key === "homepage") {
    return (
      <>
        <PreviewBanner />
        <HomeSections content={draft} footer={await getShellContent("footer")} />
      </>
    );
  }
  if (key === "footer") {
    return (
      <>
        <PreviewBanner />
        <div className="container-lux py-10 text-sm text-muted">Footer draft:</div>
        <Footer content={draft} />
      </>
    );
  }
  if (key === "announcement") {
    return (
      <>
        <PreviewBanner />
        <div className="container-lux py-10 text-sm text-muted">Announcement bar draft:</div>
        <AnnouncementShell>{draft.enabled === false ? null : (draft.messages || []).join("  |  ") || "(messages derived from store settings)"}</AnnouncementShell>
      </>
    );
  }
  return (
    <>
      <PreviewBanner />
      <div className="container-lux py-10">
        <p className="mb-4 text-sm text-muted">Navigation draft:</p>
        <ul className="space-y-3">
          {(draft.items || []).map((item) => (
            <li key={item.label}>
              <span className="font-medium">{item.label}</span> <span className="text-muted">→ {item.href}</span>
              {item.children?.length ? (
                <ul className="mt-1 ml-5 list-disc text-sm text-ink-soft">
                  {item.children.map((c) => (
                    <li key={c.label}>
                      {c.label} <span className="text-muted">→ {c.href}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Draft preview of a CMS block, opened from the admin panel with a signed, short-lived token. */
export default function ContentPreview({ params, searchParams }) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Body params={params} searchParams={searchParams} />
    </Suspense>
  );
}
