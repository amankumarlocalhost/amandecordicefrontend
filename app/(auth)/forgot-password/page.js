import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/PasswordForms";

export const metadata = { title: "Forgot password", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-96 w-full" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
