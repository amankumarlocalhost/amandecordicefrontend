import { Suspense } from "react";
import { ReturnDetail } from "@/components/returns/ReturnsViews";

export const metadata = { title: "Request details" };

async function Inner({ params }) {
  const { id } = await params;
  return <ReturnDetail id={id} />;
}

export default function ReturnPage({ params }) {
  return (
    <Suspense fallback={<div className="skeleton h-64" />}>
      <Inner params={params} />
    </Suspense>
  );
}
