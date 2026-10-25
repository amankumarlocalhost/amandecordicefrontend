import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/format";
import Icon from "./Icon";

const OPTIMIZABLE = /^(https:\/\/(images\.unsplash\.com|res\.cloudinary\.com|picsum\.photos|fastly\.picsum\.photos)\/|https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\/)/;

/**
 * Product/editorial image. Known hosts go through next/image; anything else (a CDN not in
 * remotePatterns) falls back to a lazy <img> instead of failing. Always reserves space via the
 * parent (use `fill` inside a sized, relative container) to avoid layout shift.
 */
export function Photo({ src, alt = "", sizes = "100vw", className = "", preload = false, quality = 75, fill = true, width, height, style }) {
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-cream-200 text-muted ${className}`} aria-label={alt || "No image available"} role="img">
        <svg width="42" height="30" viewBox="0 0 50 36" aria-hidden="true">
          <path d="M3 12h44c0 10-9.8 17-22 17S3 22 3 12Z" fill="currentColor" opacity=".35" />
        </svg>
      </div>
    );
  }
  if (!OPTIMIZABLE.test(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={preload ? "eager" : "lazy"} decoding="async" className={`${fill ? "absolute inset-0 h-full w-full" : ""} object-cover ${className}`} width={width} height={height} style={style} />;
  }
  return fill ? (
    <Image src={src} alt={alt} fill sizes={sizes} quality={quality} preload={preload} fetchPriority={preload ? "high" : undefined} className={`object-cover ${className}`} style={style} />
  ) : (
    <Image src={src} alt={alt} width={width} height={height} sizes={sizes} quality={quality} preload={preload} className={`object-cover ${className}`} style={style} />
  );
}

export function Price({ price, mrp, className = "", size = "md", showDiscount = true }) {
  const discount = mrp && price && mrp > price ? Math.floor(((mrp - price) * 100) / mrp) : 0;
  const sizes = { sm: "text-sm", md: "text-[0.95rem]", lg: "text-2xl" };
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`${sizes[size]} font-medium text-ink`}>{money(price)}</span>
      {discount > 0 ? (
        <>
          <s className="text-xs text-muted" aria-label={`MRP ${money(mrp)}`}>{money(mrp)}</s>
          {showDiscount ? <span className="text-xs font-medium text-success">{discount}% off</span> : null}
        </>
      ) : null}
    </span>
  );
}

export function Stars({ value = 0, size = 14, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-gold ${className}`} aria-label={`${value.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Icon name="star" size={size} className="absolute inset-0 text-cream-300" filled strokeWidth={0} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, value - i + 1)) * 100}%` }}>
            <Icon name="star" size={size} filled strokeWidth={0} />
          </span>
        </span>
      ))}
    </span>
  );
}

export function Rating({ rating, className = "" }) {
  if (!rating?.count) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-muted ${className}`}>
      <Stars value={rating.average} size={12} />
      <span>({rating.count})</span>
    </span>
  );
}

export function Spinner({ size = 18, className = "" }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ icon = "bag", title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-olive-800">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="font-display text-2xl">{title}</h3>
      {children ? <div className="mt-2 max-w-md text-sm leading-relaxed text-muted">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e2dc] text-danger">
        <Icon name="alert" size={24} />
      </span>
      <h3 className="font-display text-2xl">{title}</h3>
      {message ? <p className="mt-2 max-w-md text-sm text-muted">{message}</p> : null}
      {onRetry ? (
        <button type="button" className="btn btn-outline btn-sm mt-5" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Notice({ tone = "info", children, className = "" }) {
  const tones = {
    info: "bg-cream-200/70 text-ink-soft border-line",
    warn: "bg-[#f6ead2] text-[#6b4a12] border-[#e6cf9f]",
    error: "bg-[#f6e3dd] text-[#7a2f20] border-[#e8c3b8]",
    success: "bg-[#e7eedf] text-[#33472a] border-[#cbd8bf]",
  };
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`flex gap-2.5 rounded-sm border px-3.5 py-3 text-sm leading-relaxed ${tones[tone]} ${className}`}>
      <Icon name={tone === "success" ? "check" : tone === "info" ? "info" : "alert"} size={17} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-cream-200 text-ink-soft",
    good: "bg-[#e3ebd9] text-[#33472a]",
    warn: "bg-[#f6ead2] text-[#6b4a12]",
    bad: "bg-[#f6e3dd] text-[#7a2f20]",
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? <Icon name="chevronRight" size={12} /> : null}
            {it.href && i < items.length - 1 ? (
              <Link href={it.href} className="hover:text-ink">{it.label}</Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-ink-soft">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({ title, action, eyebrow, className = "" }) {
  return (
    <div className={`mb-6 flex items-end justify-between gap-4 sm:mb-8 ${className}`}>
      <div>
        {eyebrow ? <p className="eyebrow mb-2 text-gold-ink">{eyebrow}</p> : null}
        <h2 className="font-display text-3xl leading-tight sm:text-[2.35rem]">{title}</h2>
      </div>
      {action}
    </div>
  );
}
