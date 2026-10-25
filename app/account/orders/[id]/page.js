import { Suspense } from "react";
import OrderDetail from "@/components/account/OrderDetail";

export const metadata = { title: "Order details" };

async function Inner({ params }) {
  const { id } = await params;
  return <OrderDetail orderRef={decodeURIComponent(id)} />;
}

export default function OrderPage({ params }) {
  return (
    <Suspense fallback={<div className="skeleton h-64" />}>
      <Inner params={params} />
    </Suspense>
  );
}
