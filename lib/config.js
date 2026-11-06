// Public, non-secret configuration. NEXT_PUBLIC_* values are inlined at build time.

const trim = (s) => (s || "").replace(/\/+$/, "");

export const API_ORIGIN = trim(process.env.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:4000";
export const API_BASE = `${API_ORIGIN}/api/v1`;
export const SOCKET_URL = trim(process.env.NEXT_PUBLIC_SOCKET_URL) || API_ORIGIN;
export const SITE_URL = trim(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Decor Dice";
export const STORE_TAGLINE = process.env.NEXT_PUBLIC_STORE_TAGLINE || "Thoughtfully Designed for Beautiful Living";
// Short line under the logo (the full tagline is too long for the header).
export const STORE_SHORT_TAGLINE = process.env.NEXT_PUBLIC_STORE_SHORT_TAGLINE || "Fine Home Décor";

export const SOCIAL = {
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  pinterest: process.env.NEXT_PUBLIC_PINTEREST_URL || "",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
};

export const LEGAL = {
  privacy: process.env.NEXT_PUBLIC_PRIVACY_URL || "",
  terms: process.env.NEXT_PUBLIC_TERMS_URL || "",
};
