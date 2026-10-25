/** @type {import('next').NextConfig} */

// Hosts product and editorial images may come from. The API host is added from env so uploads
// served by the backend's local storage driver are optimised too.
const imageHosts = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "fastly.picsum.photos" },
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
try {
  const u = new URL(apiBase);
  imageHosts.push({ protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port, pathname: "/uploads/**" });
} catch {
  // invalid URL: lib/config.js reports it at runtime
}
for (const host of (process.env.NEXT_PUBLIC_EXTRA_IMAGE_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean)) {
  imageHosts.push({ protocol: "https", hostname: host });
}

const isLocalApi = /localhost|127\.0\.0\.1/.test(apiBase);

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    remotePatterns: imageHosts,
    qualities: [60, 75, 85],
    formats: ["image/avif", "image/webp"],
    // Local development serves uploads from localhost:4000; never enable this for a public API.
    dangerouslyAllowLocalIP: isLocalApi && process.env.NODE_ENV !== "production",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
