// Helpers for rendering admin-managed (CMS) content with safe fallbacks to the built-in design.

/** Picks the CMS image (approved media URLs from the backend) or the built-in fallback `{ src, alt }`. */
export function cmsImage(img, fallback, { size = "large" } = {}) {
  if (!img?.url) return fallback;
  const src = size === "thumb" ? img.thumbUrl || img.mediumUrl || img.url : size === "medium" ? img.mediumUrl || img.url : img.url;
  return { src, alt: img.alt || fallback?.alt || "" };
}

export const DEFAULT_SECTION_ORDER = ["hero", "features", "categories", "promo", "bestSellers", "inspiration", "newArrivals", "collections", "whyChoose", "testimonials", "gallery", "newsletter"];

/**
 * Section order/visibility from the CMS. Sections the CMS list does not mention keep their default
 * position at the end and stay visible, so a partial configuration never hides content by accident.
 */
export function sectionOrder(content) {
  const configured = Array.isArray(content?.sections) ? content.sections.filter((s) => DEFAULT_SECTION_ORDER.includes(s.id)) : [];
  const seen = new Set(configured.map((s) => s.id));
  return [...configured, ...DEFAULT_SECTION_ORDER.filter((id) => !seen.has(id)).map((id) => ({ id, enabled: true }))].filter((s) => s.enabled !== false).map((s) => s.id);
}
