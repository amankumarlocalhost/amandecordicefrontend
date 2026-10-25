"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { WishlistProvider } from "./WishlistProvider";
import { NotificationProvider } from "./NotificationProvider";

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
