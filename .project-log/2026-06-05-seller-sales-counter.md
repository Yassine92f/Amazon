# Seller sales/revenue counter never updated on orders

**Date:** 2026-06-05
**Author:** feature/cart-orders
**Type:** fix

## Context

A real seller (TedShop, created through the app) showed "0 ventes" on the shops
listing even though one of its products had a delivered order. The seeded demo
shops show large numbers only because the seed writes random `totalSales` /
`totalRevenue`; nothing in the order flow ever incremented them. So an actual
sale bumped `Product.totalSold` but left `Seller.totalSales` / `totalRevenue`
untouched.

## Decision

- `OrderUseCase.createOrder` now accumulates per-seller sales (quantity) and
  revenue (line totals) while validating the order lines, and after the order is
  created it calls a new `ISellerRepository.incrementSales(sellerId, sales, revenue)`
  (`$inc` on the seller doc) — placed next to the existing `Product.totalSold`
  increment so both follow the same "credited at order creation" rule.
- One-off backfill `server/src/scripts/backfill-seller-sales.ts` recomputes
  totals from real orders, but only for sellers currently at 0 sales, so the
  seeded demo numbers are preserved. Ran it once: TedShop → 1 sale, 19.90 €.

## Why

Crediting at order creation matches `Product.totalSold` (consistency, one code
path). Scoping the backfill to zero-sales sellers avoids overwriting the seeded
demo figures with recomputed-from-orders values (the demo sellers have no real
orders, so a full recompute would zero them).

## Alternatives considered

- **Credit on payment (PENDING → CONFIRMED) instead of creation** — more
  "correct" (a sale = a paid order) but inconsistent with `Product.totalSold`,
  which already counts at creation. Deferred to a later, unified pass over both
  counters. Like `totalSold`, sales are not decremented on cancellation today.
- **Full recompute for all sellers** — rejected: would wipe the seeded demo
  numbers (no real orders back them).

## Impact

- Server: `ISellerRepository`/`SellerRepository` (+`incrementSales`),
  `OrderUseCase.createOrder`, new backfill script. Test mocks extended; +1 test.
  **69 server tests pass.**

## Follow-ups

- Unify `totalSold` + seller `totalSales` accounting: decide creation- vs
  paid-basis and whether to decrement on cancellation/refund, in one place.
