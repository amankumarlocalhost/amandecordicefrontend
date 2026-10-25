import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/PasswordForms";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-96 w-full" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
