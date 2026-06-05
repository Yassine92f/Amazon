# Per-user coupon limits

**Date:** 2026-06-05
**Author:** feature/cart-orders
**Type:** feature

## Context

Coupons had a global `usageLimit` (total redemptions across everyone) but nothing
stopping a single customer from reusing the same code repeatedly — common for
"new customer" / "first order" promos that must be one-per-person.

## Decision

Add an optional `perUserLimit` to coupons and track redemptions per user.

- `perUserLimit?: number` on the coupon entity/model/DTOs, admin schemas and the
  admin UI form (next to the global usage limit).
- New `CouponRedemption` collection — one document per (coupon, user, order),
  indexed on `{ couponId, userId }`. `ICouponRepository` gained
  `countUserRedemptions(couponId, userId)` and `recordRedemption(...)`.
- `CouponUseCase.evaluate(code, subtotal, userId?)`: when the coupon has a
  `perUserLimit` and a `userId` is known, it counts that user's prior redemptions
  and rejects with "Vous avez déjà utilisé ce code promo" once the limit is hit.
  The buyer `validate` endpoint passes the authenticated userId so the checkout
  preview reflects it, and `OrderUseCase.createOrder` passes it too (server-side
  re-validation).
- On a successful order, `markUsed(couponId, userId, orderId)` records the
  redemption alongside the global usage increment.

## Why

A redemption-record collection (vs. inferring from orders by coupon code) is
robust to coupons being deleted/recreated and to code reuse, and gives an exact
per-(coupon,user) count with a simple indexed query.

## Alternatives considered

- **Count orders with that couponCode for the user** — rejected: couponCode is a
  string snapshot on the order; a recreated code would conflate distinct coupons.
- **Unique index on (couponId, userId) for perUserLimit=1** — would enforce
  atomically, but redemptions are recorded after order creation (best-effort), so
  the order would already exist. The pre-check at evaluate time is the gate; the
  small race (two concurrent orders by the same user) is acceptable for a coupon
  and mirrors the existing global-limit guard's tolerance.

## Impact

- Server: Coupon entity/model (+ `CouponRedemption` model), `ICouponRepository` /
  `CouponRepository`, `CouponUseCase`, `OrderUseCase`, `CouponController`,
  `couponSchemas`, `CouponAdminUseCase`. Test mock extended. **68 server tests
  pass** (+2 per-user limit).
- Client: `AdminCouponDto`/`CreateCouponInput`, admin coupons form field, i18n.

## Follow-ups

- When prod runs on a replica set, wrap createOrder (stock decrement + order
  insert + coupon increment + redemption record) in a transaction (see the
  MongoDB-transactions note in the earlier follow-ups log).
