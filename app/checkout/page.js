import RequireAuth from "@/components/auth/RequireAuth";
import CheckoutView from "@/components/checkout/CheckoutView";
import Icon from "@/components/ui/Icon";

// Session-gated: rendered client-side after the cookie session is confirmed, so it cannot be part of a
// prerendered instant-navigation shell. The API enforces access regardless.
export const instant = false;

export const metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-lux py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>
        <p className="flex items-center gap-2 text-xs text-muted"><Icon name="shield" size={15} /> Secure checkout</p>
      </div>
      <RequireAuth next="/checkout">
        <CheckoutView />
      </RequireAuth>
    </div>
  );
}
