// Formatting helpers. All money from the API is integer paise.

const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function money(paise) {
  if (paise === null || paise === undefined || Number.isNaN(paise)) return "";
  return paise % 100 === 0 ? inr0.format(paise / 100) : inr2.format(paise / 100);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

export const formatDate = (d) => (d ? dateFmt.format(new Date(d)) : "");
export const formatDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : "");
export const formatDay = (d) => (d ? dayFmt.format(new Date(d)) : "");

export const humanize = (s) => (s ? String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

export const MATERIAL_LABELS = {
  bone_china: "Bone China",
  borosilicate_glass: "Borosilicate Glass",
  crystal_glass: "Crystal Glass",
  opal_glass: "Opal Glass",
  stainless_steel: "Stainless Steel",
  mdf: "MDF",
};
export const materialLabel = (m) => MATERIAL_LABELS[m] || humanize(m);

// Customer-friendly labels for the backend's order state machine (constants/statuses.js).
export const ORDER_STATUS_LABELS = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Being prepared",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delivery_failed: "Delivery attempt failed",
  returned_to_origin: "Returned to us",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
  replacement_processing: "Replacement in progress",
  completed: "Completed",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Payment pending",
  authorized: "Payment authorised",
  paid: "Paid",
  failed: "Payment failed",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  cod_due: "Pay on delivery",
  cod_collected: "Paid on delivery",
  cod_not_collected: "Not collected",
};

export const RETURN_STATUS_LABELS = {
  requested: "Requested",
  awaiting_review: "Under review",
  approved: "Approved",
  rejected: "Not approved",
  pickup_scheduled: "Pickup scheduled",
  item_received: "Item received",
  inspection: "Being inspected",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const RETURN_REASON_LABELS = {
  arrived_broken: "Arrived broken (e.g. broken glassware)",
  arrived_chipped: "Arrived chipped or cracked",
  damaged_in_shipping: "Damaged in shipping (e.g. damaged dinner set)",
  incorrect_product: "Incorrect product received",
  missing_item: "Missing pieces from a set",
  wrong_color_or_pattern: "Wrong variant, colour or pattern",
  not_as_described: "Not as described",
  defective: "Defective product",
  changed_mind: "Changed my mind",
};

export const REFUND_STATUS_LABELS = {
  pending_approval: "Pending approval",
  awaiting_destination: "Needs your payout details",
  approved: "Approved",
  processing: "Processing",
  processed: "Refunded",
  failed: "Failed — our team will retry",
  rejected: "Rejected",
};

export const REPLACEMENT_STATUS_LABELS = {
  awaiting_stock: "Awaiting stock",
  reserved: "Reserved for you",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const label = (map, key) => map[key] || humanize(key);

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function dimensionsText(d) {
  if (!d) return "";
  const cm = (mm) => `${Math.round(mm / 10 * 10) / 10} cm`;
  if (d.diameterMm) return `Ø ${cm(d.diameterMm)}${d.heightMm ? ` × H ${cm(d.heightMm)}` : ""}`;
  const parts = [d.lengthMm && `L ${cm(d.lengthMm)}`, d.widthMm && `W ${cm(d.widthMm)}`, d.heightMm && `H ${cm(d.heightMm)}`].filter(Boolean);
  return parts.join(" × ");
}
