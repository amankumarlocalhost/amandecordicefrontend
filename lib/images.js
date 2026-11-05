// Editorial photography from Unsplash (https://unsplash.com/license). Product photos always come
// from the backend; these are only used for lifestyle/editorial sections and as image fallbacks.
// Every id below was fetched from images.unsplash.com and checked visually for relevance.

const u = (id) => `https://images.unsplash.com/photo-${id}`;

export const PHOTOS = {
  hero: { src: u("1556228453-efd6c1ff04f6"), alt: "A warm living room with a macramé wall hanging, plants and soft lighting" },
  // Kept for the CMS category-card fallbacks (older homepage content refers to these keys).
  dinnerware: { src: u("1618221195710-dd6b41faaea6"), alt: "A calm, neutral living room with natural textures" },
  serveware: { src: u("1617806118233-18e1de247200"), alt: "A styled dining room with green chairs and a round mirror" },
  drinkware: { src: u("1578500494198-246f612d3b3d"), alt: "Pampas grass in a glass vase beside a sofa" },
  newArrivals: { src: u("1618220179428-22790b461013"), alt: "A living room with a gold mirror, vases and plants" },
  promo: { src: u("1618220179428-22790b461013"), alt: "A living room with a gold mirror, vases and plants" },
  inspiration: { src: u("1600210492486-724fe5c67fb0"), alt: "A sunlit living room with a gallery wall and leather sofa" },
  inspirationThumbs: [
    { src: u("1616486338812-3dadae4b4ace"), alt: "A living room with a wall of plates, a clock and a mirror" },
    { src: u("1513694203232-719a280e022f"), alt: "A minimal corner with a dresser, dried grasses and a plant" },
    { src: u("1513519245088-0e12902e5a38"), alt: "A gallery wall of framed prints on floating shelves" },
    { src: u("1615874959474-d609969a20ed"), alt: "A bedroom with framed art, hanging plants and a rattan pendant" },
  ],
  why: { src: u("1583847268964-b28dc8f51f92"), alt: "A soft grey sofa with a throw, wall art and a side table" },
  gallery: [
    { src: u("1603006905003-be475563bc59"), alt: "A glowing candle in a glass holder" },
    { src: u("1509423350716-97f9360b4e09"), alt: "An aloe plant in a concrete pot" },
    { src: u("1578500494198-246f612d3b3d"), alt: "Dried pampas in a glass vase" },
    { src: u("1513519245088-0e12902e5a38"), alt: "Framed prints arranged on shelves" },
    { src: u("1617325247661-675ab4b64ae2"), alt: "A minimal bedroom with a wooden bed frame" },
    { src: u("1616486338812-3dadae4b4ace"), alt: "A living room wall styled with plates and a clock" },
  ],
  newsletter: { src: u("1513694203232-719a280e022f"), alt: "Dried grasses and a plant in a minimal room" },
  auth: { src: u("1586023492125-27b2c045efd7"), alt: "A modern living room with a yellow armchair and framed art" },
  collections: [
    { src: u("1618221195710-dd6b41faaea6"), alt: "A neutral living room with natural textures" },
    { src: u("1617806118233-18e1de247200"), alt: "A styled dining room" },
    { src: u("1615874959474-d609969a20ed"), alt: "A layered, plant-filled bedroom" },
    { src: u("1600210492486-724fe5c67fb0"), alt: "A living room with a gallery wall" },
  ],
};

/**
 * Fallback photography for the home décor categories and "Shop by Space" collections, used only
 * until an approved image is set on the category/collection in the admin. Each was checked to load
 * from images.unsplash.com and to show the right kind of room or object.
 */
export const CATEGORY_PHOTOS = {
  kitchen: { src: u("1556911220-bff31c812dba"), alt: "A bright kitchen counter with lemons and fresh herbs" },
  gardening: { src: u("1509423350716-97f9360b4e09"), alt: "An aloe plant in a concrete planter" },
  "wall-hanging": { src: u("1556228453-efd6c1ff04f6"), alt: "A macramé wall hanging above a sofa" },
  "table-decor": { src: u("1617806118233-18e1de247200"), alt: "A dining table styled with a centrepiece" },
  "wall-decor": { src: u("1616486338812-3dadae4b4ace"), alt: "A wall styled with plates, a clock and a mirror" },
  glass: { src: u("1603006905003-be475563bc59"), alt: "A candle glowing in a glass holder" },
  vases: { src: u("1578500494198-246f612d3b3d"), alt: "Pampas grass in a glass vase" },
  "photo-frames": { src: u("1513519245088-0e12902e5a38"), alt: "A gallery wall of framed prints" },
  "candle-stand": { src: u("1603006905003-be475563bc59"), alt: "Candlelight in a glass candle holder" },
  "key-holder": { src: u("1502005229762-cf1b2da7c5d6"), alt: "A bright hallway and staircase" },
};

export const SPACE_PHOTOS = {
  "living-room": { src: u("1618221195710-dd6b41faaea6"), alt: "A calm living room with a low sofa and natural textures" },
  bedroom: { src: u("1617325247661-675ab4b64ae2"), alt: "A minimal bedroom with a wooden bed and soft linen" },
  "dining-room": { src: u("1617806118233-18e1de247200"), alt: "A dining room with green velvet chairs" },
  kitchen: { src: u("1556911220-bff31c812dba"), alt: "A bright white kitchen with fresh produce" },
  "balcony-garden": { src: u("1416879595882-3373a0480b5b"), alt: "Potting soil and a garden trowel" },
  entryway: { src: u("1502005229762-cf1b2da7c5d6"), alt: "A light-filled hallway with a wooden staircase" },
};

/** Generic fallback when a category has no image and no built-in photo. */
export const FALLBACK_PHOTO = { src: u("1586023492125-27b2c045efd7"), alt: "A styled modern living room" };

/** Builds an Unsplash URL at a given width (Unsplash's CDN resizes; next/image optimises further). */
export const unsplash = (src, w = 1600, q = 75) => `${src}?auto=format&fit=crop&w=${w}&q=${q}`;
