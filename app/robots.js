import { SITE_URL } from "@/lib/config";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/cart", "/login", "/register", "/reset-password", "/forgot-password", "/verify-email", "/preview", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
