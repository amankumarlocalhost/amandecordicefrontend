// Helpers for rendering admin-managed (CMS) content with safe fallbacks to the built-in design.

/** Picks the CMS image (approved media URLs from the backend) or the built-in fallback `{ src, alt }`. */
export function cmsImage(img, fallback, { size = "large" } = {}) {
  if (!img?.url) return fallback;
  const src = size === "thumb" ? img.thumbUrl || img.mediumUrl || img.url : size === "medium" ? img.mediumUrl || img.url : img.url;
  return { src, alt: img.alt || fallback?.alt || "" };
}

export const DEFAULT_SECTION_ORDER = ["hero", "features", "shopByCategory", "collections", "spaces", "newArrivals", "bestSellers", "promo", "trending", "inspiration", "whyChoose", "testimonials", "gallery", "newsletter", "categories"];

/** Sections that only show when the CMS turns them on (the category tiles overlap "Shop by category"). */
export const DEFAULT_HIDDEN = new Set(["categories"]);

/**
 * Section order/visibility from the CMS. Sections the CMS list does not mention keep their default
 * position at the end and stay visible, so a partial configuration never hides content by accident.
 */
export function sectionOrder(content) {
  const configured = Array.isArray(content?.sections) ? content.sections.filter((s) => DEFAULT_SECTION_ORDER.includes(s.id)) : [];
  const seen = new Set(configured.map((s) => s.id));
  // With no CMS layout, the built-in order applies (default-hidden sections stay off). Sections added
  // after a layout was saved are slotted in after their predecessor in the built-in order.
  if (!configured.length) return DEFAULT_SECTION_ORDER.filter((id) => !DEFAULT_HIDDEN.has(id));
  const out = [...configured];
  for (const id of DEFAULT_SECTION_ORDER) {
    if (seen.has(id) || DEFAULT_HIDDEN.has(id)) continue;
    const before = DEFAULT_SECTION_ORDER.slice(0, DEFAULT_SECTION_ORDER.indexOf(id)).reverse().find((p) => out.some((s) => s.id === p));
    out.splice(before ? out.findIndex((s) => s.id === before) + 1 : 0, 0, { id, enabled: true });
  }
  return out.filter((s) => s.enabled !== false).map((s) => s.id);
}
