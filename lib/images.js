// Editorial photography from Unsplash (https://unsplash.com/license). Product photos always come
// from the backend; these are only used for lifestyle/editorial sections.

const u = (id) => `https://images.unsplash.com/photo-${id}`;

export const PHOTOS = {
  hero: { src: u("1758810742974-b92459867642"), alt: "A garden dining table set with teal plates, glassware and fresh flowers" },
  dinnerware: { src: u("1525973779373-015bdf68e579"), alt: "Stacked white ceramic bowls on a dark surface" },
  serveware: { src: u("1660217595796-6e61d9d80e17"), alt: "A serving platter with fresh lemons and limes" },
  drinkware: { src: u("1606033123014-5392e7556a4b"), alt: "Rows of clear wine glasses" },
  newArrivals: { src: u("1610128361323-6e941c97f023"), alt: "Handmade ceramic bowls with blue glaze and lavender" },
  promo: { src: u("1757071461288-6eedd1e08ee6"), alt: "Hand-painted blue and gold ceramic jars" },
  inspiration: { src: u("1758705477576-8783430d55b6"), alt: "A dinner table set with glassware, candles and flowers" },
  inspirationThumbs: [
    { src: u("1612634092588-f2f648b72cbd"), alt: "Plate with gold cutlery and dried flowers" },
    { src: u("1551892974-bbb8a5216e07"), alt: "Flat lay of ceramic plates and bowls in blues and creams" },
    { src: u("1727257050264-33a4f5f0982a"), alt: "Pale blue plates and cups on a table" },
    { src: u("1484632152040-840235adc262"), alt: "Shelves of colourful ceramic plates and bowls" },
  ],
  why: { src: u("1572003414130-d1b4632a0d73"), alt: "Speckled stoneware bowls stacked on a table" },
  gallery: [
    { src: u("1551892974-bbb8a5216e07"), alt: "Assorted ceramic bowls from above" },
    { src: u("1536936812504-0e77dc3f0b40"), alt: "Textured ceramic cups" },
    { src: u("1608322368442-2db3b4090724"), alt: "Clear glassware casting shadows" },
    { src: u("1587560555570-4d3f84dcee05"), alt: "Celadon bowls on marble" },
    { src: u("1612196808214-b8e1d6145a8c"), alt: "A white ceramic vase with greenery" },
    { src: u("1631125915902-d8abe9225ff2"), alt: "Clay vases on a plinth" },
  ],
  newsletter: { src: u("1587560555570-4d3f84dcee05"), alt: "Ceramic bowls" },
  auth: { src: u("1768594407433-40b4b11039e8"), alt: "A beautifully set dining table" },
  collections: [
    { src: u("1597696929736-6d13bed8e6a8"), alt: "Ceramic vases in neutral tones" },
    { src: u("1563696629964-8c3ce077cf3e"), alt: "Handmade mugs on a rack" },
    { src: u("1691403992101-a5d6f9dec356"), alt: "Coloured glassware" },
    { src: u("1522413452208-996ff3f3e740"), alt: "A festive table setting" },
  ],
};

/** Builds an Unsplash URL at a given width (Unsplash's CDN resizes; next/image optimises further). */
export const unsplash = (src, w = 1600, q = 75) => `${src}?auto=format&fit=crop&w=${w}&q=${q}`;
