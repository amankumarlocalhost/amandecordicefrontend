"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
    <span className="absolute -top-1 -right-1.5 flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-olive-900 px-1 text-[0.6rem] font-medium text-cream-50" aria-label={label}>
      {n > 99 ? "99+" : n}
    </span>
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
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  if (!item.children) {
    return (
      <li>
        <Link href={item.href} className="link-underline py-2 text-[0.68rem] font-medium whitespace-nowrap uppercase tracking-[0.18em] text-ink hover:text-olive-700">
          {item.label}
        </Link>
      </li>
    );
  }
  return (
    <li className="relative" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && hide()}>
      <Link href={item.href} className="link-underline py-2 text-[0.68rem] font-medium whitespace-nowrap uppercase tracking-[0.18em] text-ink hover:text-olive-700" aria-haspopup="true" aria-expanded={open} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
        {item.label}
      </Link>
      {open ? (
        <div className="animate-pop-in absolute top-full left-1/2 z-50 w-56 -translate-x-1/2 pt-4">
          <ul className="border border-line bg-cream-50 py-3 shadow-[var(--shadow-card)]">
            {item.children.map((c) => (
              <li key={c.href + c.label}>
                <Link href={c.href} onClick={() => setOpen(false)} className="block px-5 py-2 text-sm text-ink-soft transition-colors hover:bg-cream-100 hover:text-ink">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/** `nav` comes from the published CMS navigation; the built-in menu is used until one is published. */
export default function Header({ nav = NAV }) {
  const { count, drawerOpen, openDrawer, closeDrawer } = useCart();
  const { isAuthed, user } = useAuth();
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

  const accountLabel = isAuthed ? `My account (${user?.name || ""})` : "Sign in";

  return (
    <>
      <header className={`sticky top-0 z-40 border-b transition-[box-shadow,background-color] duration-300 ${scrolled ? "border-line bg-cream-50/95 shadow-[0_6px_24px_-18px_rgb(38_38_31/0.5)] backdrop-blur-sm" : "border-transparent bg-cream-50"}`}>
        <div className="container-lux flex h-[4.5rem] items-center gap-4 lg:h-[5.25rem]">
          <button type="button" className="-ml-2 p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>
          <Logo className="mr-auto lg:mr-0" />
          <nav aria-label="Main" className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-6 xl:gap-9 2xl:gap-11">
              {nav.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" className="p-2 text-ink hover:text-olive-700" onClick={() => setSearchOpen(true)} aria-label="Search products">
              <Icon name="search" />
            </button>
            {isAuthed ? (
              <Link href="/account/wishlist" className="relative hidden p-2 text-ink hover:text-olive-700 sm:block" aria-label={`Wishlist${wishlist.count ? `, ${wishlist.count} items` : ""}`}>
                <Icon name="heart" />
                <Badge n={wishlist.count} />
              </Link>
            ) : null}
            <Link href={isAuthed ? "/account" : "/login"} className="relative p-2 text-ink hover:text-olive-700" aria-label={accountLabel}>
              <Icon name="user" />
              <Badge n={notifications?.unread} label={`${notifications?.unread} unread notifications`} />
            </Link>
            <button type="button" className="relative -mr-2 p-2 text-ink hover:text-olive-700" onClick={openDrawer} aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}>
              <Icon name="bag" />
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
