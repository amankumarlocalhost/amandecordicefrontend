import { PHOTOS } from "./images";

// Last-resort navigation (API unreachable and no CMS menu). Normally the menu is built from the live
// category tree by navFromCategories(). Slugs match the seeded catalog (scripts/catalog/taxonomy.js).
export const NAV = [
  { label: "New In", href: "/shop?newArrival=true&sort=newest" },
  {
    label: "Dinnerware",
    href: "/category/dinnerware",
    children: [
      { label: "Complete Dinner Sets", href: "/category/complete-dinner-sets" },
      { label: "Bone China", href: "/category/bone-china-dinner-sets" },
      { label: "Stoneware", href: "/category/stoneware-dinner-sets" },
      { label: "Dinner Plates", href: "/category/dinner-plates" },
      { label: "Soup Bowls", href: "/category/soup-bowls" },
      { label: "Pasta Bowls", href: "/category/pasta-bowls" },
    ],
  },
  {
    label: "Serveware",
    href: "/category/serving-essentials",
    children: [
      { label: "Serving Platters", href: "/category/serving-platters" },
      { label: "Serving Bowls", href: "/category/serving-bowls" },
      { label: "Serving Trays", href: "/category/serving-trays" },
      { label: "Casseroles", href: "/category/casserole-dishes" },
      { label: "Table Accessories", href: "/category/table-accessories" },
    ],
  },
  {
    label: "Drinkware",
    href: "/category/glassware",
    children: [
      { label: "Water Glasses", href: "/category/water-glasses" },
      { label: "Wine Glasses", href: "/category/wine-glasses" },
      { label: "Tumblers", href: "/category/tumblers" },
      { label: "Glass Jugs", href: "/category/glass-jugs" },
      { label: "Coffee Mugs", href: "/category/coffee-mugs" },
    ],
  },
  {
    label: "Collections",
    href: "/collections",
    children: [
      { label: "All Collections", href: "/collections" },
      { label: "Gift Collections", href: "/category/gift-collections" },
      { label: "Home Decor", href: "/category/decorative-homeware" },
      { label: "Kitchen Storage", href: "/category/kitchen-storage" },
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

/** Footer "Shop" column from the live tree (falls back to the built-in links). */
export function footerShopFromCategories(tree, limit = 6) {
  if (!tree?.length) return FOOTER_SHOP;
  return [...tree.slice(0, limit).map((c) => ({ label: c.name, href: `/category/${c.slug}` })), { label: "All Products", href: "/shop" }];
}

export const CATEGORY_CARDS = [
  { title: "Dinnerware", subtitle: "Plates, bowls & sets", href: "/category/dinnerware", photo: PHOTOS.dinnerware },
  { title: "Serveware", subtitle: "Platters, trays & more", href: "/category/serving-essentials", photo: PHOTOS.serveware },
  { title: "Drinkware", subtitle: "Mugs, glasses & more", href: "/category/glassware", photo: PHOTOS.drinkware },
  { title: "New Arrivals", subtitle: "Fresh styles, every week", href: "/shop?newArrival=true&sort=newest", photo: PHOTOS.newArrivals, badge: "New" },
];

export const FOOTER_SHOP = [
  { label: "Dinnerware", href: "/category/dinnerware" },
  { label: "Serveware", href: "/category/serving-essentials" },
  { label: "Drinkware", href: "/category/glassware" },
  { label: "Home Decor", href: "/category/decorative-homeware" },
  { label: "All Products", href: "/shop" },
];

export const FOOTER_COLLECTIONS = [
  { label: "New In", href: "/shop?newArrival=true&sort=newest" },
  { label: "Best Sellers", href: "/shop?bestseller=true" },
  { label: "Sale", href: "/shop?discounted=true&sort=discount" },
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
