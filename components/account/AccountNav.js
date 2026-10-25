"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";

const LINKS = [
  { href: "/account", label: "Profile", icon: "user", exact: true },
  { href: "/account/orders", label: "Orders", icon: "box" },
  { href: "/account/returns", label: "Returns & replacements", icon: "refresh" },
  { href: "/account/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/account/addresses", label: "Addresses", icon: "pin" },
  { href: "/account/notifications", label: "Notifications", icon: "bell", badge: true },
  { href: "/account/support", label: "Help & support", icon: "chat" },
];

export default function AccountNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const n = useNotifications();
  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28">
      {user ? <p className="mb-4 hidden text-sm text-muted lg:block">Hello, <span className="text-ink">{user.name}</span></p> : null}
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link href={l.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${active ? "bg-olive-900 text-cream-50" : "text-ink-soft hover:bg-cream-200 hover:text-ink"}`}>
                <Icon name={l.icon} size={17} />
                {l.label}
                {l.badge && n?.unread ? <span className={`ml-auto rounded-full px-1.5 text-[0.65rem] ${active ? "bg-cream-50 text-ink" : "bg-olive-900 text-cream-50"}`}>{n.unread}</span> : null}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-3 lg:border-t lg:border-line lg:pt-3">
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm whitespace-nowrap text-ink-soft hover:bg-cream-200 hover:text-danger">
            <Icon name="logout" size={17} /> Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
