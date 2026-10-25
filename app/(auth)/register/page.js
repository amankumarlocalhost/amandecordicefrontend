import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Create account", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-96 w-full" />}>
      <RegisterForm />
    </Suspense>
  );
}
