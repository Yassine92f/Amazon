# Commerce funnel frontend + seller order management

**Date:** 2026-06-04
**Author:** feature/cart-orders
**Type:** feature

## Context

The cart/orders/payment backend (Section 3) was complete and unit-tested, but the
client had **no UI** for any of it: add-to-cart was disabled with a "coming soon"
note, there was no cart, checkout, orders, or wishlist page, Stripe was not
installed on the client, and the seller dashboard's order tab was greyed out. A
critical-review pass also surfaced two backend gaps: sellers had no way to see the
orders containing their products, and the coupon usage counter could exceed its
limit under concurrency.

A hard product requirement drove the design: **the cart must work for logged-out
shoppers, but proceeding to payment must require authentication** — the standard
e-commerce pattern.

## Decision

**Backend**

- `GET /orders/seller` — returns buyer orders that contain at least one of the
  authenticated seller's products, each narrowed to that seller's own line items
  with a computed `sellerSubtotal`/`sellerItemCount` (multi-vendor friendly). New
  `SellerOrderDto` in shared, `IProductRepository.findIdsBySeller`,
  `IOrderRepository.findByProductIds`, and `OrderUseCase.getSellerOrders`.
- `updateStatus` now takes the acting `userId` and enforces seller ownership: a
  seller may only transition an order that includes one of their products (admins
  bypass). Reuses the same `resolveSellerProductIds` helper.
- `CouponRepository.incrementUsage` is now an atomic guarded update
  (`usedCount < usageLimit`), closing the over-redemption race.

**Frontend**

- The cart is **fully server-side**; the guest is tracked by the backend's
  httpOnly `cartId` cookie, so a single set of API calls (`lib/commerce.ts`) works
  logged-out and logged-in. On login the auth store calls `POST /cart/merge` to
  fold the guest cart into the user's, and loads the wishlist; logout resets them.
- New Zustand stores (`store/cart.ts`, `store/wishlist.ts`), a `CartProvider` that
  loads the cart on mount, and a global slide-over `CartDrawer`.
- Header now exposes cart + wishlist to **everyone** with live badges.
- Product page: working add-to-cart (selected variant + quantity) and a wishlist
  heart (guests are routed to login).
- `/cart` (public) → `/checkout` (wrapped in `ProtectedRoute`, so the payment step
  is gated behind auth). Checkout collects address + delivery + coupon, creates the
  order, creates a Stripe PaymentIntent, and renders the Stripe **Payment Element**
  (`@stripe/react-stripe-js`) with `redirect: 'if_required'`.
- `/orders` history + `/orders/[id]` detail with a status timeline, a payment-success
  banner that polls for the webhook to flip PENDING→CONFIRMED, and cancel.
- `/wishlist` page; `/seller/orders` management page (status transitions); seller
  dashboard revenue/order stats wired to live data; seller nav tab enabled.

## Why

- **Server-side cart over a localStorage cart:** the backend already persists guest
  carts (Redis + cookie) and re-validates stock, and supports a first-class merge on
  login. Mirroring that on the client (one source of truth) avoids drift and a
  second reconciliation path. The trade-off — every mutation is a round-trip — is
  acceptable for a cart and keeps stock/pricing authoritative.
- **Order-first checkout:** the backend's `createIntent` needs an existing order, so
  the order is created (reserving stock) before payment. To keep the back button
  safe, the checkout snapshots the cart lines before creating the order and, if the
  shopper edits, cancels the PENDING order (restocking) and rebuilds the cart.
- **`redirect: 'if_required'`** keeps card payments inline (SPA feel) while still
  supplying a `return_url` for redirect-based methods.
- **Seller line-item narrowing** rather than exposing whole orders keeps one seller
  from seeing another's lines in a shared cart.

## Alternatives considered

- **localStorage guest cart merged via a bulk endpoint** — rejected; duplicates the
  already-working server guest cart and adds a second merge path.
- **Stripe cancel/recreate the PaymentIntent on edit** — rejected in favour of
  cancel-order + cart-restore, which also releases reserved stock.
- **Per-seller sub-orders at checkout** — out of scope; the narrowed-view approach
  delivers the seller experience without changing the order model.

## Impact

- Shared: `SellerOrderDto` (additive). Rebuild `@ecommerce/shared` before server/client.
- Server: order/product/coupon repositories + interfaces, `OrderUseCase`,
  `OrderController`, orders route (`/seller`), DI now wires `SellerRepository`.
  Tests updated; **58 server tests pass**.
- Client: new `lib/commerce.ts`, `lib/stripe.ts`, cart/wishlist stores, providers,
  `CartDrawer`, `PaymentForm`, pages for cart/checkout/orders/wishlist/seller-orders,
  Header restructure, product-page actions, i18n additions. Added deps
  `@stripe/stripe-js`, `@stripe/react-stripe-js`.
- Verified end-to-end against the running stack: guest add-to-cart → merge on login
  → order → real Stripe PaymentIntent → seller-scoped order list (owner sees 1,
  others see 0).

## Follow-ups

- Boot-time env validation (zod) so a missing `STRIPE_*` fails loudly and at once.
- "Pay later" for an abandoned PENDING order from the order detail page.
- Coupon admin CRUD + per-user usage limits.
- Order confirmation e-mail (transactional) on `payment_intent.succeeded`.
- MongoDB transactions for the order/stock/coupon side effects.
