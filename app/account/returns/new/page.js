import { Suspense } from "react";
import NewReturn from "@/components/returns/NewReturn";

export const metadata = { title: "Report a problem" };

export default function NewReturnPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64" />}>
      <NewReturn />
    </Suspense>
  );
}
