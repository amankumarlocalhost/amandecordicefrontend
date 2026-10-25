import { connection } from "next/server";
import { tryPublic } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";

// Built at request time (cached via the API helper) so the build never depends on the backend.
export default async function sitemap() {
  await connection();
  const staticPages = ["", "/shop", "/collections", "/about", "/contact", "/help/faq", "/help/shipping", "/help/returns", "/help/care"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 }));
  const [cats, cols, pages] = await Promise.all([tryPublic("/categories"), tryPublic("/collections"), tryPublic("/pages")]);
  const cmsPages = (pages?.data || []).map((p) => ({ url: `${SITE_URL}/pages/${p.slug}`, changeFrequency: "monthly", priority: 0.5 }));
  const flat = (nodes) => nodes.flatMap((n) => [n, ...flat(n.children || [])]);
  const catPages = flat(cats?.data || []).map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, changeFrequency: "weekly", priority: 0.7 }));
  const colPages = (cols?.data || []).map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, changeFrequency: "weekly", priority: 0.6 }));
  const products = [];
  for (let page = 1; page <= 50; page++) {
    const r = await tryPublic("/products", { page, limit: 100, sort: "newest" });
    if (!r?.data?.length) break;
    products.push(...r.data.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, changeFrequency: "daily", priority: 0.8 })));
    if (page >= (r.meta?.totalPages || 1)) break;
  }
  return [...staticPages, ...catPages, ...colPages, ...cmsPages, ...products];
}
