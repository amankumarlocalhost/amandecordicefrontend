import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AccountNav from "@/components/account/AccountNav";

// Session-gated: rendered client-side after the cookie session is confirmed, so it cannot be part of a
// prerendered instant-navigation shell. The API enforces access regardless.
export const instant = false;

export const metadata = { title: { default: "My account", template: "%s · My account" }, robots: { index: false } };

export default function AccountLayout({ children }) {
  return (
    <div className="container-lux py-8 sm:py-12">
      <RequireAuth>
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <Suspense fallback={<div className="skeleton h-12 lg:h-80" />}>
            <AccountNav />
          </Suspense>
          <div className="min-w-0">{children}</div>
        </div>
      </RequireAuth>
    </div>
  );
}
