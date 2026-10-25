"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/bits";
import { paymentApi } from "@/lib/api/endpoints";
import { payWithRazorpay } from "@/lib/razorpay";

function useCountdown(until) {
  const [left, setLeft] = useState(() => (until ? new Date(until).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setLeft(new Date(until).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  return Math.max(0, left);
}

/** Safe payment retry for a pending UPI order: the server re-issues checkout options for the same order. */
export default function PayNow({ order, onOutcome }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const left = useCountdown(order.reservationExpiresAt);
  const expired = order.reservationExpiresAt && left <= 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await paymentApi.retry(order.orderNumber);
      const outcome = await payWithRazorpay(r.data);
      onOutcome(outcome);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {expired ? (
        <p className="text-sm text-danger">The payment window for this order has closed and the items were released. Please place a new order.</p>
      ) : (
        <>
          <button type="button" className="btn btn-primary" onClick={pay} disabled={busy}>
            {busy ? <Spinner size={16} /> : null} Pay now with UPI
          </button>
          {order.reservationExpiresAt ? <p className="text-xs text-muted">Items are held for you for <span className="tabular-nums">{mm}:{ss}</span></p> : null}
        </>
      )}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
