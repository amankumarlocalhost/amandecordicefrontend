import { useId } from "react";
import Link from "next/link";
import { STORE_NAME, STORE_SHORT_TAGLINE } from "@/lib/config";

/*
 * Decor Dice crest: a crowned lozenge (a die stood on its point) with a back-to-back "DD" monogram
 * in Didone contrast and three die pips. Paths only, so it renders identically in the favicon,
 * the intro loader and the header without depending on a web font.
 */
const GOLD = {
  light: ["#d9bf8f", "#b48b4f", "#7a5a28"], // on cream surfaces
  dark: ["#f3e2b0", "#c9a35f", "#9b7438"], // on olive surfaces
};

// One "D": stem plus a bowl whose inner ellipse is offset, thick on the curve and hairline at top/bottom.
export const D_PATH = "M33 33H37A9 9 0 0 1 37 51H33ZM35.4 34.3V49.7H37.4A6.8 7.7 0 0 0 37.4 34.3Z";
export const CROWN_PATH = "M23 10 21 3.4l5.6 3.6L32 1.6 37.4 7 43 3.4 41 10Z";
export const OUTER_LOZENGE = "M32 15 59 42 32 69 5 42Z";
export const INNER_LOZENGE = "M32 19.5 54.5 42 32 64.5 9.5 42Z";
export const PIPS = [
  [13, 42],
  [51, 42],
  [32, 58],
];

export function CrestMark({ size = 40, tone = "light", className = "" }) {
  const id = `crest${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [a, b, c] = GOLD[tone] || GOLD.light;
  return (
    <svg width={(size * 64) / 74} height={size} viewBox="0 0 64 74" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".5" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <path d={CROWN_PATH} />
        <rect x="23" y="10.6" width="18" height="1.8" rx=".4" />
        <circle cx="21" cy="3" r="1.1" />
        <circle cx="32" cy="1.4" r="1.2" />
        <circle cx="43" cy="3" r="1.1" />
        <path d={D_PATH} fillRule="evenodd" />
        <path d={D_PATH} fillRule="evenodd" transform="matrix(-1 0 0 1 64 0)" />
        {PIPS.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.4" />
        ))}
      </g>
      <g fill="none" stroke={`url(#${id})`} strokeLinejoin="miter">
        <path d={OUTER_LOZENGE} strokeWidth="1.6" />
        <path d={INNER_LOZENGE} strokeWidth=".7" />
      </g>
    </svg>
  );
}

/** "DECOR ◆ DICE": the store name's words separated by a small gold lozenge. */
export function Wordmark({ className = "" }) {
  const words = STORE_NAME.split(/\s+/);
  return (
    <span className={`font-display inline-flex items-center uppercase ${className}`}>
      {words.map((w, i) => (
        <span key={i} className="inline-flex items-center">
          {i ? <span aria-hidden="true" className="mr-[0.5em] ml-[0.25em] inline-block h-[0.28em] w-[0.28em] rotate-45 bg-gold" /> : null}
          {w}
        </span>
      ))}
    </span>
  );
}

export default function Logo({ inverted = false, className = "" }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 sm:gap-3 ${className}`} title={`${STORE_NAME} — home`} aria-label={`${STORE_NAME} — home`}>
      <CrestMark tone={inverted ? "dark" : "light"} className="h-8 w-auto shrink-0 transition-transform duration-500 ease-lux group-hover:-translate-y-0.5 sm:h-11" />
      <span className="flex flex-col leading-none">
        <Wordmark className={`text-[0.92rem] tracking-[0.12em] sm:text-[1.36rem] sm:tracking-[0.26em] ${inverted ? "text-cream-50" : "text-ink"}`} />
        <span className={`mt-2 hidden items-center justify-center gap-2 text-[0.48rem] tracking-[0.42em] uppercase sm:flex ${inverted ? "text-gold-soft" : "text-gold-ink"}`}>
          <span aria-hidden="true" className="h-px w-4 bg-current opacity-50" />
          {STORE_SHORT_TAGLINE}
          <span aria-hidden="true" className="h-px w-4 bg-current opacity-50" />
        </span>
      </span>
    </Link>
  );
}
