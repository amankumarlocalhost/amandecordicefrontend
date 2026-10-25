import { Suspense } from "react";
import { VerifyEmail } from "@/components/auth/PasswordForms";

export const metadata = { title: "Verify email", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-96 w-full" />}>
      <VerifyEmail />
    </Suspense>
  );
}
