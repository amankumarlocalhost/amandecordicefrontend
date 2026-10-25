import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the crest from app/icon.svg rasterised on a square (iOS rounds the corners). */
export default async function AppleIcon() {
  const svg = (await readFile(join(process.cwd(), "app/icon.svg"), "utf8")).replace('rx="12"', 'rx="0"');
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  // eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser
  return new ImageResponse(<img src={src} width={180} height={180} alt="" />, size);
}
