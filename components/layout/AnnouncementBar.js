import { getContent, getSettings } from "@/lib/api/server";
import { money } from "@/lib/format";

/**
 * Custom messages published from the admin panel (CMS "announcement"), otherwise messages derived
 * from live store settings (GET /settings/public) — nothing hardcoded.
 */
export async function AnnouncementBar() {
  const [settings, custom] = await Promise.all([getSettings(), getContent("announcement")]);
  if (custom?.enabled === false) return <AnnouncementShell />;
  if (custom?.messages?.length) return <AnnouncementShell>{custom.messages.join("  |  ")}</AnnouncementShell>;
  const s = settings?.data;
  const parts = [];
  if (s?.shipping?.freeShippingThreshold) parts.push(`Free shipping on all orders above ${money(s.shipping.freeShippingThreshold)}`);
  if (s?.cod?.enabled) parts.push("COD available");
  if (s?.returns?.damageReportWindowDays) parts.push(`Breakage? Report within ${s.returns.damageReportWindowDays} days`);
  return <AnnouncementShell>{parts.length ? parts.join("  |  ") : null}</AnnouncementShell>;
}

export function AnnouncementShell({ children }) {
  return (
    <div className="bg-olive-900 text-cream-100">
      <p className="container-lux flex h-9 items-center justify-center gap-2 overflow-hidden text-center text-[0.6rem] tracking-[0.2em] whitespace-pre uppercase sm:text-[0.65rem]">
        {children ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="hidden shrink-0 sm:block">
              <path d="M3 6.5h11v9H3z" /><path d="M14 9.5h3.5l3 3v3H14" /><circle cx="7" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" />
            </svg>
            <span className="truncate">{children}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
