"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/bits";
import { useAuth } from "@/components/providers/AuthProvider";

/** Client-side guard for customer-only pages. The API enforces access regardless; this just routes guests to sign-in. */
export default function RequireAuth({ children, next }) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent(next || window.location.pathname + window.location.search)}`);
  }, [status, router, next]);
  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-olive-800" aria-busy="true" aria-label="Checking your session">
        <Spinner size={24} />
      </div>
    );
  }
  return children;
}
