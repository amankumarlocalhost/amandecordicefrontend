"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Icon from "@/components/ui/Icon";
import { NAV } from "@/lib/content";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";

// Overlays are code-split: they only download when first opened.
const SearchOverlay = dynamic(() => import("./SearchOverlay"), { ssr: false });
const MobileNav = dynamic(() => import("./MobileNav"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), { ssr: false });

function Badge({ n, label }) {
  if (!n) return null;
  return (
    <span className="absolute -top-1 -right-1.5 flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-medium text-cream-50 ring-2 ring-cream-50" aria-label={label}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

const NAV_LINK = "group/nav relative inline-flex flex-col items-center py-3 text-[0.66rem] font-medium whitespace-nowrap uppercase tracking-[0.22em] text-ink transition-colors hover:text-gold-ink";

/** Small gold diamond under a nav link: shown for the current page, fades in on hover. */
function MarkerShape({ active }) {
  return <span aria-hidden="true" className={`absolute -bottom-0.5 h-[5px] w-[5px] rotate-45 bg-gold transition-all duration-300 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0 group-hover/nav:scale-100 group-hover/nav:opacity-100"}`} />;
}

const isCurrent = (pathname, href) => {
  const path = String(href || "").split("?")[0];
  return Boolean(path && path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)));
};

// Reading the URL must happen inside <Suspense> (the header is part of the prerendered shell).
function ActiveMarker({ hrefs, forced }) {
  const pathname = usePathname();
  return <MarkerShape active={forced || hrefs.some((h) => isCurrent(pathname, h))} />;
}

function Marker({ hrefs, forced = false }) {
  return (
    <Suspense fallback={<MarkerShape active={forced} />}>
      <ActiveMarker hrefs={hrefs} forced={forced} />
    </Suspense>
  );
}

function NavItem({ item }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };
  const hrefs = [item.href, ...(item.children || []).map((c) => c.href)];
  if (!item.children) {
    return (
      <li>
        <Link href={item.href} className={NAV_LINK}>
          {item.label}
          <Marker hrefs={hrefs} />
        </Link>
      </li>
    );
  }
  return (
    <li className="relative" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hide()}>
      <Link href={item.href} className={NAV_LINK} aria-haspopup="true" aria-expanded={open} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
        <span className="inline-flex items-center gap-1">
          {item.label}
          <Icon name="chevronDown" size={11} strokeWidth={1.6} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
        <Marker hrefs={hrefs} forced={open} />
      </Link>
      {open ? (
        <div className="animate-pop-in absolute top-full left-1/2 z-50 w-64 -translate-x-1/2 pt-3">
          <div className="overflow-hidden rounded-[4px] border border-line bg-cream-50/98 shadow-[var(--shadow-pop)] backdrop-blur-md">
            <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
            <p className="display-italic px-6 pt-5 pb-2 text-[1.15rem] text-gold-ink">{item.label}</p>
            <ul className="pb-2">
              {item.children.map((c) => (
                <li key={c.href + c.label}>
                  <Link href={c.href} onClick={() => setOpen(false)} className="group/link flex items-center justify-between px-6 py-2 text-[0.86rem] text-ink-soft transition-colors hover:bg-cream-100 hover:text-ink">
                    <span className="transition-transform duration-300 group-hover/link:translate-x-1">{c.label}</span>
                    <Icon name="arrowRight" size={13} className="text-gold-ink opacity-0 transition-opacity duration-300 group-hover/link:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={item.href} onClick={() => setOpen(false)} className="link-arrow flex border-t border-line px-6 py-3.5 text-[0.58rem] text-ink hover:text-gold-ink">
              Shop all <Icon name="arrowRight" size={12} />
            </Link>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** Signed in: monogram + first name with a small account menu. Signed out: a sign-in link. */
function AccountMenu({ isAuthed, user, unread, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isAuthed) {
    return (
      <Link href="/login" className="relative flex items-center gap-2 p-2 text-ink hover:text-gold-ink" aria-label="Sign in">
        <Icon name="user" strokeWidth={1.3} />
        <span className="hidden text-[0.62rem] font-medium tracking-[0.2em] uppercase xl:inline">Sign in</span>
      </Link>
    );
  }
  const first = (user?.name || "").trim().split(/\s+/)[0] || "there";
  const links = [
    ["/account", "My account"],
    ["/account/orders", "My orders"],
    ["/account/wishlist", "Wishlist"],
    ["/account/notifications", `Notifications${unread ? ` (${unread})` : ""}`],
  ];
  return (
    <div className="relative" ref={ref}>
      {/* Monogram + first name; unread notifications are a small gold dot. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`My account (${user?.name || ""})${unread ? `, ${unread} unread notifications` : ""}`}
        className="group/acct flex items-center gap-2.5 py-2 pr-1 pl-2 text-ink"
      >
        <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${open ? "border-gold bg-gold/10" : "border-gold/60 group-hover/acct:border-gold group-hover/acct:bg-gold/10"}`} aria-hidden="true">
          <span className="font-display text-[1rem] leading-none text-gold-ink">{first.charAt(0).toUpperCase()}</span>
          {unread ? <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-cream-50" /> : null}
        </span>
        <span className="hidden items-baseline gap-1.5 whitespace-nowrap sm:flex lg:hidden xl:flex" aria-hidden="true">
          <span className="display-italic max-w-[7rem] truncate text-[1.05rem] leading-none transition-colors duration-300 group-hover/acct:text-gold-ink">{first}</span>
        </span>
      </button>
      {open ? (
        <div role="menu" className="animate-pop-in absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-[4px] border border-line bg-cream-50 shadow-[var(--shadow-pop)]">
          <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
          <div className="border-b border-line px-5 py-4">
            <p className="display-italic text-[1.15rem] text-ink">{user?.name || first}</p>
            {user?.email ? <p className="mt-0.5 truncate text-[0.75rem] text-muted">{user.email}</p> : null}
          </div>
          <ul className="py-1.5">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link role="menuitem" href={href} onClick={() => setOpen(false)} className="block px-5 py-2 text-[0.86rem] text-ink-soft hover:bg-cream-100 hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout(); }} className="flex w-full items-center gap-2 border-t border-line px-5 py-3 text-left text-[0.82rem] text-danger hover:bg-cream-100">
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** `nav` comes from the published CMS navigation; the built-in menu is used until one is published. */
export default function Header({ nav = NAV }) {
  const { count, drawerOpen, openDrawer, closeDrawer } = useCart();
  const { isAuthed, user, logout } = useAuth();
  const wishlist = useWishlist();
  const notifications = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !/input|textarea|select/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-40 border-b transition-[box-shadow,background-color] duration-300 ${scrolled ? "border-line bg-cream-50/90 shadow-[0_10px_30px_-22px_rgb(33_30_28/0.55)] backdrop-blur-md" : "border-transparent bg-cream-50"}`}>
        {/* Wider than the page container so the logo sits near the left edge on large screens. */}
        <div className={`mx-auto flex w-full max-w-[1760px] items-center gap-4 px-4 transition-[height] sm:px-6 lg:px-8 xl:px-10 duration-500 ease-[var(--ease-lux)] ${scrolled ? "h-16 lg:h-[4.6rem]" : "h-[4.5rem] lg:h-[5.6rem]"}`}>
          <button type="button" className="-ml-2 p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>
          <Logo className="mr-auto lg:mr-0" />
          <nav aria-label="Main" className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-5 xl:gap-7 2xl:gap-10">
              {nav.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" className="p-2 text-ink hover:text-gold-ink" onClick={() => setSearchOpen(true)} aria-label="Search products">
              <Icon name="search" strokeWidth={1.3} />
            </button>
            {isAuthed ? (
              <Link href="/account/wishlist" className="relative hidden p-2 text-ink hover:text-gold-ink sm:block" aria-label={`Wishlist${wishlist.count ? `, ${wishlist.count} items` : ""}`}>
                <Icon name="heart" strokeWidth={1.3} />
                <Badge n={wishlist.count} />
              </Link>
            ) : null}
            <AccountMenu isAuthed={isAuthed} user={user} unread={notifications?.unread} onLogout={logout} />
            <button type="button" className="relative -mr-2 p-2 text-ink hover:text-gold-ink" onClick={openDrawer} aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}>
              <Icon name="bag" strokeWidth={1.3} />
              <Badge n={count} />
            </button>
          </div>
        </div>
      </header>
      {searchOpen ? <SearchOverlay onClose={() => setSearchOpen(false)} /> : null}
      {menuOpen ? <MobileNav nav={nav} onClose={() => setMenuOpen(false)} onSearch={() => { setMenuOpen(false); setSearchOpen(true); }} /> : null}
      {drawerOpen ? <CartDrawer onClose={closeDrawer} /> : null}
    </>
  );
}
