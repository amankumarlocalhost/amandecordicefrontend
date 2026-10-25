// Customer-facing endpoints of the backend (/api/v1). Each returns the response envelope.
// Admin endpoints are intentionally absent: this frontend has no admin UI.

import { api } from "./client";

const enc = encodeURIComponent;

export const authApi = {
  csrf: () => api.get("/auth/csrf"),
  register: (body) => api.post("/auth/register", body),
  login: (body) => api.post("/auth/login", body),
  otpSend: (body) => api.post("/auth/otp/send", body),
  otpLogin: (body) => api.post("/auth/otp/login", body),
  verifyPhone: (code) => api.post("/auth/otp/verify-phone", { code }),
  verifyEmail: (token) => api.post("/auth/email/verify", { token }),
  resendEmail: () => api.post("/auth/email/resend-verification"),
  logout: () => api.post("/auth/logout", undefined, { auth: false }),
  logoutAll: () => api.post("/auth/logout-all"),
  sessions: () => api.get("/auth/sessions"),
  revokeSession: (id) => api.del(`/auth/sessions/${enc(id)}`),
  forgot: (identifier) => api.post("/auth/password/forgot", { identifier }),
  reset: (body) => api.post("/auth/password/reset", body),
  changePassword: (body) => api.post("/auth/password/change", body),
};

export const userApi = {
  me: (opts) => api.get("/users/me", opts),
  update: (body) => api.patch("/users/me", body),
  preferences: (body) => api.patch("/users/me/notification-preferences", body),
  deactivate: (password) => api.post("/users/me/deactivate", { password }),
};

export const addressApi = {
  list: () => api.get("/addresses"),
  create: (body) => api.post("/addresses", body),
  update: (id, body) => api.patch(`/addresses/${enc(id)}`, body),
  makeDefault: (id) => api.post(`/addresses/${enc(id)}/default`),
  remove: (id) => api.del(`/addresses/${enc(id)}`),
};

export const catalogApi = {
  suggest: (q, signal) => api.get("/search/suggest", { query: { q }, signal }),
  products: (query, signal) => api.get("/products", { query, signal }),
  product: (slug) => api.get(`/products/${enc(slug)}`),
  backInStock: (productId, sku) => api.post(`/products/${enc(productId)}/back-in-stock`, { sku }),
  serviceability: (pincode, signal) => api.get(`/shipping/serviceability/${enc(pincode)}`, { signal }),
  settings: () => api.get("/settings/public"),
  coupons: () => api.get("/coupons/available"),
};

export const cartApi = {
  get: (query) => api.get("/cart", { query }),
  add: (sku, quantity = 1) => api.post("/cart/items", { sku, quantity }),
  setQty: (sku, quantity) => api.patch(`/cart/items/${enc(sku)}`, { quantity }),
  remove: (sku) => api.del(`/cart/items/${enc(sku)}`),
  clear: () => api.del("/cart"),
  applyCoupon: (code) => api.post("/cart/coupon", { code }),
  removeCoupon: () => api.del("/cart/coupon"),
  options: (body) => api.patch("/cart/options", body),
};

export const wishlistApi = {
  list: () => api.get("/wishlist", { query: { limit: 100 } }),
  add: (productId, sku) => api.post("/wishlist", { productId, sku }),
  remove: (productId) => api.del(`/wishlist/${enc(productId)}`),
  moveToCart: (productId, sku) => api.post(`/wishlist/${enc(productId)}/move-to-cart`, { sku }),
};

export const checkoutApi = {
  quote: (body) => api.post("/checkout/quote", body),
  placeOrder: (body, idempotencyKey) => api.post("/checkout/place-order", body, { headers: { "Idempotency-Key": idempotencyKey }, timeout: 45000 }),
};

export const paymentApi = {
  verify: (body) => api.post("/payments/razorpay/verify", body, { timeout: 45000 }),
  retry: (orderRef) => api.post(`/payments/orders/${enc(orderRef)}/retry`),
};

export const orderApi = {
  list: (query) => api.get("/orders", { query }),
  get: (ref) => api.get(`/orders/${enc(ref)}`),
  tracking: (ref) => api.get(`/orders/${enc(ref)}/tracking`),
  cancel: (ref, reason) => api.post(`/orders/${enc(ref)}/cancel`, { reason }),
  invoice: (ref) => api.get(`/orders/${enc(ref)}/invoice`),
};

export const returnApi = {
  eligibility: (orderRef) => api.get(`/returns/eligibility/${enc(orderRef)}`),
  create: (body, idempotencyKey) => api.post("/returns", body, { headers: { "Idempotency-Key": idempotencyKey } }),
  list: (query) => api.get("/returns", { query }),
  get: (id) => api.get(`/returns/${enc(id)}`),
  cancel: (id) => api.post(`/returns/${enc(id)}/cancel`),
  replacements: (query) => api.get("/replacements", { query }),
  replacement: (id) => api.get(`/replacements/${enc(id)}`),
  refunds: (query) => api.get("/refunds", { query }),
  refundDestination: (id, body) => api.post(`/refunds/${enc(id)}/destination`, body),
};

export const uploadApi = {
  /** purpose: return | chat | review. Field name must be "files". */
  upload: (files, purpose) => {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    return api.post("/uploads", form, { query: { purpose }, timeout: 90000 });
  },
};

export const reviewApi = {
  list: (productId, query, signal) => api.get(`/products/${enc(productId)}/reviews`, { query, signal }),
  create: (productId, body) => api.post(`/products/${enc(productId)}/reviews`, body),
  helpful: (id) => api.post(`/reviews/${enc(id)}/helpful`),
};

export const notificationApi = {
  list: (query) => api.get("/notifications", { query }),
  unreadCount: () => api.get("/notifications/unread-count"),
  read: (body) => api.post("/notifications/read", body),
};

export const supportApi = {
  createTicket: (body) => api.post("/support/tickets", body),
  tickets: (query) => api.get("/support/tickets", { query }),
  ticket: (id) => api.get(`/support/tickets/${enc(id)}`),
};

export const aiApi = {
  status: () => api.get("/ai/customer/status"),
};
