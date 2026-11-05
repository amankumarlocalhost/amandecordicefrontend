import { PHOTOS } from "./images";

// Last-resort navigation (API unreachable and no CMS menu). Normally the menu is built from the live
// category tree by navFromCategories(). Slugs match the home décor catalog
// (backend/src/scripts/catalog/homeDecorTaxonomy.js).
export const NAV = [
  { label: "New In", href: "/shop?newArrival=true&sort=newest" },
  {
    label: "Décor",
    href: "/category/table-decor",
    children: [
      { label: "Vases", href: "/category/vases" },
      { label: "Table Décor", href: "/category/table-decor" },
      { label: "Candle Stands", href: "/category/candle-stand" },
      { label: "Glass", href: "/category/glass" },
      { label: "Photo Frames", href: "/category/photo-frames" },
    ],
  },
  {
    label: "Walls",
    href: "/category/wall-decor",
    children: [
      { label: "Wall Décor", href: "/category/wall-decor" },
      { label: "Wall Hangings", href: "/category/wall-hanging" },
      { label: "Key Holders", href: "/category/key-holder" },
    ],
  },
  {
    label: "Kitchen & Garden",
    href: "/category/kitchen",
    children: [
      { label: "Kitchen", href: "/category/kitchen" },
      { label: "Gardening", href: "/category/gardening" },
    ],
  },
  {
    label: "Shop by Space",
    href: "/collections?type=space",
    children: [
      { label: "Living Room", href: "/collections/living-room" },
      { label: "Bedroom", href: "/collections/bedroom" },
      { label: "Dining Room", href: "/collections/dining-room" },
      { label: "Kitchen", href: "/collections/kitchen" },
      { label: "Balcony & Garden", href: "/collections/balcony-garden" },
      { label: "Entryway", href: "/collections/entryway" },
    ],
  },
  { label: "Sale", href: "/shop?discounted=true&sort=discount" },
];

/**
 * Built-in menu derived from the live category tree, used until a CMS navigation is published:
 * the first three top-level categories get their own dropdown (more do not fit one line), every top-level category is listed under
 * "Shop All", so admin edits to categories reach the menu without a frontend change.
 */
export function navFromCategories(tree, { featured = 3, perMenu = 8 } = {}) {
  if (!tree?.length) return NAV;
  // Featured top-level categories (the home décor catalog) lead the menu when any are flagged.
  tree = primaryCategories(tree);
  const link = (c) => ({ label: c.name, href: `/category/${c.slug}` });
  const menu = (c) => ({
    ...link(c),
    ...(c.children?.length ? { children: [...c.children.slice(0, perMenu).map(link), ...(c.children.length > perMenu ? [{ label: `View all ${c.name}`, href: `/category/${c.slug}` }] : [])] } : {}),
  });
  return [
    NAV[0],
    ...tree.slice(0, featured).map(menu),
    { label: "Shop All", href: "/shop", children: [...tree.map(link), { label: "All Products", href: "/shop" }] },
    NAV[NAV.length - 1],
  ];
}

/** Top-level categories flagged `isFeatured` in the admin, or every top-level category if none are. */
export function primaryCategories(tree) {
  const list = (tree || []).filter((c) => c.isFeatured);
  return list.length ? list : tree || [];
}

/** Footer "Shop" column from the live tree (falls back to the built-in links). */
export function footerShopFromCategories(tree, limit = 6) {
  if (!tree?.length) return FOOTER_SHOP;
  tree = primaryCategories(tree);
  return [...tree.slice(0, limit).map((c) => ({ label: c.name, href: `/category/${c.slug}` })), { label: "All Products", href: "/shop" }];
}

export const CATEGORY_CARDS = [
  { title: "Vases", subtitle: "Ceramic, glass & metal", href: "/category/vases", photo: PHOTOS.drinkware },
  { title: "Wall Décor", subtitle: "Mirrors, clocks & art", href: "/category/wall-decor", photo: PHOTOS.dinnerware },
  { title: "Table Décor", subtitle: "Centrepieces & trays", href: "/category/table-decor", photo: PHOTOS.serveware },
  { title: "New Arrivals", subtitle: "Fresh styles, every week", href: "/shop?newArrival=true&sort=newest", photo: PHOTOS.newArrivals, badge: "New" },
];

export const FOOTER_SHOP = [
  { label: "Vases", href: "/category/vases" },
  { label: "Wall Décor", href: "/category/wall-decor" },
  { label: "Table Décor", href: "/category/table-decor" },
  { label: "Candle Stands", href: "/category/candle-stand" },
  { label: "Gardening", href: "/category/gardening" },
  { label: "All Products", href: "/shop" },
];

export const FOOTER_COLLECTIONS = [
  { label: "New In", href: "/shop?newArrival=true&sort=newest" },
  { label: "Best Sellers", href: "/shop?bestseller=true" },
  { label: "Sale", href: "/shop?discounted=true&sort=discount" },
  { label: "Shop by Space", href: "/collections?type=space" },
  { label: "Gift Collections", href: "/collections?type=gift" },
  { label: "All Collections", href: "/collections" },
];

export const FOOTER_HELP = [
  { label: "FAQs", href: "/help/faq" },
  { label: "Shipping & Delivery", href: "/help/shipping" },
  { label: "Returns & Replacements", href: "/help/returns" },
  { label: "Care Guide", href: "/help/care" },
  { label: "Track Order", href: "/account/orders" },
];

export const FOOTER_ABOUT = [
  { label: "Our Story", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "My Account", href: "/account" },
];
