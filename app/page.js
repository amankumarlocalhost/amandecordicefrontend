import HomeSections from "@/components/home/HomeSections";
import { getShellContent } from "@/lib/api/server";

// Homepage content is managed in the admin panel (CMS "homepage"). It is read through a tagged cache,
// so it is part of the prerendered shell and refreshed the moment an admin publishes; with nothing
// published (or the API unreachable) the built-in design is shown.
export async function generateMetadata() {
  const seo = (await getShellContent("homepage"))?.seo;
  return seo?.title || seo?.description ? { ...(seo.title ? { title: { absolute: seo.title } } : {}), ...(seo.description ? { description: seo.description } : {}) } : {};
}

export default async function HomePage() {
  const [content, footer] = await Promise.all([getShellContent("homepage"), getShellContent("footer")]);
  return <HomeSections content={content} footer={footer} />;
}
