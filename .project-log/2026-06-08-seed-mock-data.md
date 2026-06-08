# Rich, reproducible seed data

**Date:** 2026-06-08
**Author:** feature/seed-data
**Type:** tooling

## Context

Onboarding a teammate or spinning up the project meant starting from an empty
database — no products to browse, no orders, and the new recommendation engine
had nothing to work with, so "Recommandé pour vous" was always empty. We needed
a one-command seed that fills the app with a coherent, realistic dataset so the
whole experience (catalog, orders, seller dashboard, and especially the
recommendations) is demoable out of the box.

## Decision

Extended the existing `pnpm seed` script (it already created sellers, categories,
products and reviews) to also produce the data the rest of the app needs, and
made the whole thing **deterministic and idempotent**:

- **Deterministic PRNG (mulberry32).** Replaced every `Math.random()` with a
  seeded generator, so every run produces the _same_ dataset — stable demos and
  reproducible screenshots for the report.
- **Bigger catalog (34 products).** Added depth to every category (audio, phones,
  wearables, computers, gaming, fashion, sports, beauty, books, home) so the
  recommendation candidate pool is never exhausted.
- **Buyers with personas.** Each of the 5 buyers has a taste profile (preferred
  categories + "bought together" baskets). Their seeded purchases and views are
  drawn from that profile, so the recommendations they receive are coherent and
  tell a story (e.g. Alice → Apple/audio, Bruno → gaming/desk setup).
- **Orders (17).** Older delivered orders built from each persona's baskets
  (these create the item-to-item co-purchase signal), plus a couple of recent
  orders with in-flight statuses (shipped/processing/pending). Timestamps are
  backdated so recency-aware features have a realistic spread; one order per
  buyer applies the `WELCOME10` coupon (with a redemption record).
- **Product views (≈19).** A sampled subset of each persona's categories — a
  subset, not the whole category, so plenty of products remain as fresh
  recommendation candidates.
- **Coupons (4).** `WELCOME10`, `SUMMER20`, `BIGSPENDER` and an intentionally
  `EXPIRED5` one to demo the rejection path.
- **Buyer addresses** so the order/checkout data is complete.

Cleanup was extended to purge orders, views, coupons and redemptions too, so
re-running `pnpm seed` always yields the same clean state. `pnpm seed:no-clean`
still appends without wiping. The final log prints ready-to-use demo logins.

## Why

- **Determinism** makes the dataset a stable fixture the team can rely on (and
  cite in the report) instead of a different random world on every run.
- **Personas** are what turn raw seed rows into a _believable_ recommendation
  demo: without coherent histories, the engine's output looks arbitrary and the
  jury can't see why a product was suggested.
- **Seeding orders + views specifically** is what powers the recommendation
  engine's two behavioral signals (purchases and views) and the co-purchase
  matrix — without them the headline feature has nothing to rank.
- **Idempotent cleanup** keeps the script safe to run repeatedly in dev.

## Alternatives considered

- **A static DB dump / `mongorestore` archive** — rejected: opaque, not
  diff-reviewable, and rots when models change. A typed TS script stays in sync
  with the schemas and is readable in code review.
- **A faker-based random generator** — rejected: non-deterministic and produces
  incoherent histories; we want curated personas, not noise.
- **Keeping reviews on synthetic order ids** — left as-is for now (display-only);
  orders are seeded separately. Linking every review to a real delivered order is
  a possible follow-up.

## Impact

- `server/src/scripts/seed.ts`: deterministic RNG, +21 products, buyer personas
  and addresses, coupons, orders and product views; cleanup + summary updated.
- Run with `pnpm seed` (wipes seed data first) or `pnpm seed:no-clean`.
- Verified end to end: seed runs clean and idempotent; logging in as a seeded
  buyer returns real personalized recommendations with explainable reasons, and
  product pages show engine-powered similar products.
- Depends on the recommendation engine branch (uses the `ProductView` model);
  merge that first.

## Follow-ups

- Link seeded reviews to real delivered orders for full consistency.
- Add a couple more products to the shallow lifestyle categories
  (beauty/books/home) for even richer recommendations there.
- Optionally seed a few wishlist entries per buyer.
