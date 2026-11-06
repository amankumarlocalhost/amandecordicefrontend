"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer } from "@/components/ui/Overlay";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/ui/Logo";
import { NAV } from "@/lib/content";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MobileNav({ onClose, onSearch, nav = NAV }) {
  const { isAuthed, user, logout } = useAuth();
  const [expanded, setExpanded] = useState(null);

  return (
    <Drawer open onClose={onClose} title="Menu" side="left" width="max-w-sm">
      <div className="flex justify-center border-b border-line px-5 pt-2 pb-5" onClick={onClose}>
        <Logo />
      </div>
      {isAuthed ? (
        <Link href="/account" onClick={onClose} className="mx-5 mt-4 flex items-center gap-3 rounded-[4px] border border-line bg-cream-100 px-4 py-3">
          <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-900 text-[1rem] text-cream-50" aria-hidden="true">
            {(user?.name || "?").trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="display-italic block truncate text-[1.1rem] leading-tight">{(user?.name || "").trim().split(/\s+/)[0]}</span>
          </span>
          <Icon name="chevronRight" size={16} className="text-gold-ink" />
        </Link>
      ) : null}
      <div className="px-5 py-4">
        <button type="button" onClick={onSearch} className="flex w-full items-center gap-3 border border-line bg-cream-100 px-4 py-3 text-left text-sm text-muted">
          <Icon name="search" size={18} /> Search the store
        </button>
      </div>
      <nav aria-label="Mobile">
        <ul className="border-t border-line">
          {nav.map((item) => (
            <li key={item.label} className="border-b border-line">
              {item.children ? (
                <>
                  <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-xs font-medium uppercase tracking-[0.2em]" aria-expanded={expanded === item.label} onClick={() => setExpanded((e) => (e === item.label ? null : item.label))}>
                    {item.label}
                    <Icon name="chevronDown" size={16} className={`transition-transform duration-300 ${expanded === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {expanded === item.label ? (
                    <ul className="animate-fade-in bg-cream-100 pb-2">
                      <li>
                        <Link href={item.href} onClick={onClose} className="block px-7 py-2.5 text-sm font-medium">
                          Shop all {item.label.toLowerCase()}
                        </Link>
                      </li>
                      {item.children.map((c) => (
                        <li key={c.href + c.label}>
                          <Link href={c.href} onClick={onClose} className="block px-7 py-2.5 text-sm text-ink-soft">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <Link href={item.href} onClick={onClose} className="block px-5 py-4 text-xs font-medium uppercase tracking-[0.2em]">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-1 px-5 py-6 text-sm">
        {isAuthed ? (
          <>
            <p className="mb-3 text-muted">Signed in as {user?.name}</p>
            {[
              ["/account", "My account"],
              ["/account/orders", "My orders"],
              ["/account/wishlist", "Wishlist"],
              ["/account/returns", "Returns & replacements"],
            ].map(([href, l]) => (
              <Link key={href} href={href} onClick={onClose} className="block py-2">
                {l}
              </Link>
            ))}
            <button type="button" onClick={() => { logout(); onClose(); }} className="block py-2 text-danger">
              Sign out
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <Link href="/login" onClick={onClose} className="btn btn-primary btn-sm flex-1">Sign in</Link>
            <Link href="/register" onClick={onClose} className="btn btn-outline btn-sm flex-1">Create account</Link>
          </div>
        )}
      </div>
    </Drawer>
  );
}
