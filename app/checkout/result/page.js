import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import OrderResult from "@/components/checkout/OrderResult";

// Session-gated: rendered client-side after the cookie session is confirmed, so it cannot be part of a
// prerendered instant-navigation shell. The API enforces access regardless.
export const instant = false;

export const metadata = { title: "Order status", robots: { index: false } };

export default function ResultPage() {
  return (
    <div className="container-lux py-14 sm:py-20">
      <RequireAuth>
        <Suspense fallback={null}>
          <OrderResult />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
