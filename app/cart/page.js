import CartView from "@/components/cart/CartView";

export const metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-lux py-8 sm:py-12">
      <h1 className="font-display text-4xl sm:text-5xl">Your Bag</h1>
      <CartView />
    </div>
  );
}
