# Atelier Table — customer storefront

Customer-facing storefront for the crockery, glassware, tableware and home decor backend in `../../backend`.
There is **no admin UI** in this app.

Stack: Next.js 16 (App Router, Cache Components + Partial Prefetching, Turbopack), React 19, Tailwind CSS 4, `socket.io-client` (lazy-loaded). No other runtime dependencies.

## Run locally

```bash
# 1. backend (in-memory MongoDB, seeded catalogue, demo accounts)
cd ../../backend && npm install && npm run dev:memory      # http://localhost:4000

# 2. frontend
cp .env.example .env.local                                 # defaults point at localhost:4000
npm install
npm run dev                                                # http://localhost:3000
```

Demo accounts created by `npm run dev:memory` (in-memory only, recreated on every start):

| Role | Login | Password |
|---|---|---|
| Customer | `aman@gmail.com` (phone verified, so COD works) | `aman@1999` |
| Admin (backend API only) | `admin@crockery.local` | `ChangeMe-Admin-123` |

Production: `npm run build && npm start`. The build never calls the backend (catalogue data is read at request time and cached), so the app builds and deploys independently of the API.

> If a CSS-only change doesn't show up in `next build`, delete `.next/` and rebuild — Turbopack's persistent build cache missed one during development.

## Environment

See `.env.example`. Only `NEXT_PUBLIC_*` values reach the browser; none are secrets. Razorpay, Gemini, JWT, cookie, database, Cloudinary and SMTP secrets live **only** in the backend `.env`. A scan of the production bundle found no secret names or values (the Razorpay key id is not in the bundle either — the server sends it per order).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend origin. Must be listed in the backend's `FRONTEND_URL` (CORS + Socket.IO origin check) and be **same-site** with the storefront so the HttpOnly auth cookies are sent (e.g. `shop.example.in` + `api.example.in` with `COOKIE_DOMAIN=.example.in`). |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO origin (defaults to the API origin). |
| `API_INTERNAL_URL` | Optional server-only URL for server components (e.g. `http://api:4000` inside Docker). |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and robots. |
| `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_STORE_TAGLINE` | Brand text (support email/phone come from the backend settings). |
| `NEXT_PUBLIC_INSTAGRAM_*`, `NEXT_PUBLIC_PINTEREST_URL`, `NEXT_PUBLIC_FACEBOOK_URL` | Social links; hidden when empty. |
| `NEXT_PUBLIC_PRIVACY_URL`, `NEXT_PUBLIC_TERMS_URL` | Legal pages; the footer links appear only when set. **Legal text must come from the business.** |
| `NEXT_PUBLIC_EXTRA_IMAGE_HOSTS` | Extra hostnames for product images (S3/CDN) to optimise with `next/image`. |

## Architecture

```
app/                  routes (server components; customer pages render client views)
components/
  layout/             header, search, mobile nav, footer, announcement bar, intro loader, reveal
  home/               reference landing-page sections
  catalog/ product/   listing + filters, product card/rail, PDP hero, reviews
  cart/ checkout/     cart drawer/page, checkout, Razorpay pay-now, order result
  account/ returns/   profile, orders, addresses, wishlist, notifications, support, returns
  chat/               lazy assistant launcher + panel
  providers/          auth, cart, wishlist, notifications (+ toasts)
lib/
  api/client.js       browser client: cookies, CSRF, one deduplicated refresh on 401, timeouts, typed errors
  api/endpoints.js    every customer endpoint used
  api/server.js       server reads of public catalogue data (use cache + connection())
  useQuery.js         tiny request cache: dedupe, stale-while-revalidate, "me:" keys cleared on login/logout
  socket.js           single lazily-created Socket.IO connection with refresh-and-reconnect
  razorpay.js         loads Checkout on demand, forwards callback to server verification
```

**Data rules**

- Catalogue pages (home sections, listings, PDP, collections, help) are server-rendered from the public API. Listings and the PDP read prices and stock fresh; facets, categories and settings are cached for minutes.
- Customer data (session, cart, wishlist, orders, addresses, returns, notifications, chat) is fetched **only in the browser** with the customer's own cookies and never cached on the server.
- Money is integer paise from the API. The browser never computes prices: every total shown comes from a server quote.
- Nothing is invented. Reviews, ratings, prices, discounts, stock, promotions, delivery estimates, tracking events and refund states are shown only as the backend returns them. Product safety claims (microwave/dishwasher safe…) appear only where the backend has verified them.

## Feature → API matrix

| Feature | UI | API / event | Auth |
|---|---|---|---|
| Announcement bar, feature strip, help pages, PDP policy text | layout, home, `/help/*` | `GET /settings/public` | public |
| Category nav / tree | `/category/[slug]`, `/shop` sidebar | `GET /categories`, `GET /categories/:slug` | public |
| Listing, filters, sort, pagination, search | `/shop`, `/category/*`, `/collections/*` | `GET /products` (all backend filters), `GET /products/facets` | public |
| Autocomplete | header search | `GET /search/suggest` (debounced, aborts stale requests) | public |
| Collections / gift edits | home, `/collections` | `GET /collections`, `GET /collections/:slug` | public |
| Live campaign banner | home | `GET /promotions/active` | public |
| Product detail, variants, live stock | `/products/[slug]` | `GET /products/:slug`, `GET /products/:slug/related` | public |
| Delivery check | PDP, address form | `GET /shipping/serviceability/:pincode` | public |
| Back-in-stock alert | PDP | `POST /products/:id/back-in-stock` | customer |
| Reviews list / write | PDP, home testimonials | `GET/POST /products/:id/reviews`, `POST /uploads?purpose=review` | public / customer (delivered purchase) |
| Sign up / in / OTP / out / sessions | `/register`, `/login`, account | `/auth/register, login, otp/send, otp/login, otp/verify-phone, refresh, logout, logout-all, sessions` | — |
| Password reset, email verify | `/forgot-password`, `/reset-password`, `/verify-email` | `/auth/password/forgot, password/reset, password/change, email/verify, email/resend-verification` | — |
| Profile, notification preferences, newsletter opt-in | `/account`, home | `GET/PATCH /users/me`, `PATCH /users/me/notification-preferences` | customer |
| Addresses | `/account/addresses`, checkout | `/addresses` (CRUD, default) | customer |
| Cart (guest + merged on login), coupons, gift wrap | drawer, `/cart`, checkout | `/cart`, `/cart/items`, `/cart/coupon`, `/cart/options`, `GET /coupons/available` | guest or customer |
| Wishlist | cards, PDP, `/account/wishlist` | `/wishlist`, `/wishlist/:id/move-to-cart` | customer |
| Checkout quote | `/checkout` | `POST /checkout/quote` | customer |
| Place order (UPI / COD) | `/checkout` | `POST /checkout/place-order` with `Idempotency-Key` + `expectedTotal` | customer |
| UPI payment, retry | checkout, result, order page | Razorpay Checkout → `POST /payments/razorpay/verify`; `POST /payments/orders/:id/retry` | customer |
| Orders, tracking, cancel, invoice | `/account/orders/*`, `/checkout/result` | `GET /orders`, `/orders/:id`, `/orders/:id/tracking`, `POST /orders/:id/cancel`, `GET /orders/:id/invoice` | customer |
| Refund status, COD payout details | order page | `refunds` on order detail, `POST /refunds/:id/destination` | customer |
| Returns / replacements / missing pieces | `/account/returns/*` | `GET /returns/eligibility/:order`, `POST /returns` (+ `Idempotency-Key`), `GET /returns`, `/returns/:id`, `POST /returns/:id/cancel`, `GET /replacements`, `POST /uploads?purpose=return` | customer |
| Notifications | header badge, `/account/notifications` | `GET /notifications`, `/notifications/unread-count`, `POST /notifications/read`; socket `notification:new` | customer |
| Support tickets | `/account/support` | `POST/GET /support/tickets` | customer |
| AI assistant + human handoff | chat panel | `GET /ai/customer/status`; socket `chat:start/join/message/typing/read/handoff`, `ai:confirm/decline`; server events `chat:message/typing/read`, `auth:expired` | customer |

## Payments

- Only **UPI (Razorpay)** and **Cash on Delivery**. Availability and reasons (e.g. "Verify your phone to use COD") come from the quote's `paymentOptions`.
- Each checkout attempt has one idempotency key stored in `sessionStorage` per cart/address/method/total, so double clicks, retries and refreshes return the same order.
- `expectedTotal` protects against stale prices; on `PRICE_CHANGED` the quote is refreshed and the customer reviews the new total.
- The Razorpay callback is **not** proof of payment: it's forwarded to the server, and the result page shows the order state the server reports (polling briefly, capped at ~60 s, while a payment is being confirmed). Pending orders show the reservation countdown and a safe "Pay now" retry.

## One-time intro loader

- Shown at most **once every 12 hours per browser** (`localStorage["intro:lastShown"]`), decided by an inline script before first paint, so returning visitors never see a flash.
- Never on client-side navigation; skipped entirely with `prefers-reduced-motion` or when storage is unavailable.
- Purely visual: the page renders underneath immediately. It fades after ~1.3 s, a CSS animation hides it even if JavaScript fails, and it's removed from the DOM after at most 2 s.
- Route and data loading use local skeletons (`<Suspense>` fallbacks), never a full-screen loader.

## Performance

- The hero, category cards and editorial sections are in the prerendered static shell; data sections stream in behind skeletons. The LCP hero image is preloaded.
- Chat UI, Socket.IO client, Razorpay script, search overlay, mobile menu and cart drawer are code-split and load on first use. The notification socket connects only for signed-in customers, after the browser is idle. No polling except the capped payment-confirmation check.
- Images go through `next/image` (AVIF/WebP, responsive `sizes`, reserved space).

Lighthouse 12, mobile preset (simulated slow 4G, 4× CPU), production build on localhost, warm image cache:

| Page | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | JS (transfer) |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 87 | 100 | 96 | 100 | 1.4 s | 4.0 s | 50 ms | 0 | 173 KB |
| `/shop` | 85 | 96→fixed* | 96 | 100 | 1.1 s | 4.3 s | 50 ms | 0 | 173 KB |
| `/products/…` | 92 | 100 | 96 | 92 | 1.1 s | 3.4 s | 40 ms | 0 | 184 KB |
| `/category/glassware` | 92 | 96→fixed* | 96 | 92 | 1.1 s | 3.3 s | 40 ms | 0 | 173 KB |

\* The remaining a11y items (unlabelled sort select on mobile, label/name mismatches) were fixed after this run and not re-measured.
Best practices loses points for the expected `401` from the guest session probe. SEO's `meta-description` flag is because Next 16 streams dynamic metadata to regular browsers; crawlers receive it in `<head>`.
LCP on mobile is dominated by the hero image download under 4G throttling; serving images from a CDN close to users is the main remaining lever.

## Tests performed

Automated browser runs (Edge via Puppeteer) against the real backend:

- Intro loader plays on first visit, is removed in < 2.3 s, and doesn't replay on reload.
- Search suggestions; guest add-to-bag; login merges the guest cart into the account.
- First address creation at checkout; COD order placed with the server total; confirmation page; order detail; cancellation.
- UPI: server creates the Razorpay order and opens UPI-only Checkout (test mode); closing it shows "Awaiting payment" with the hold countdown and retry. *Completing a UPI payment inside Razorpay's own window was not automated.*
- Delivered order shows the real status timeline and courier events; "Report a problem" offers only backend-eligible reasons, requires a photo for damage, uploads it, and shows the auto-approved replacement with its timeline.
- All account pages render; chat connects over Socket.IO and the Gemini assistant returns real product cards.
- No horizontal overflow at 375 px on home, shop, PDP, cart, help and login.
- `eslint` clean; `next build` succeeds; backend test suite passes (100 tests, including a new guest-cart regression test).

## Backend changes made

1. **Bug fix** (`src/modules/cart/cart.service.js`): a new guest's first `POST /cart/items` returned an empty cart because the view read the guest cookie from the request before it existed. Regression test added in `tests/checkout.test.js`.
2. Dev seed (`scripts/seed-data.js`): demo products use matched Unsplash photography instead of random picsum images.
3. Dev server (`scripts/dev-memory-server.js`): creates the demo customer account.

## Known gaps / follow-ups

- No newsletter endpoint exists: "Stay in touch" opts signed-in customers into marketing emails (notification preferences) and sends guests to sign-up.
- No site-wide reviews endpoint: homepage testimonials read the top-rated products' reviews and hide the section when there are none.
- Product Q&A (`/products/:id/questions`) and editing/deleting your own review are not surfaced yet.
- The Instagram-style strip uses editorial photography; it links out only when `NEXT_PUBLIC_INSTAGRAM_URL` is set.
- Privacy policy and terms pages need content from the business.
- Store-wide safety claims from the reference ("Microwave Safe", "Lead Free") were replaced with promises the backend can back (shipping, COD, breakage support), since safety attributes are verified per product.
