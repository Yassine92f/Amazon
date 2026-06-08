# Catalog enrichment: real product images, more products & shops

**Date:** 2026-06-08
**Author:** feature/catalog-enrichment
**Type:** feature

## Context

Ahead of the jury presentation the catalog felt thin and unconvincing: ~34 products,
5 shops, and placeholder/CDN images. A demo storefront needs to _look_ like a real
marketplace — a varied catalog, several distinct sellers, and genuine product
photography — otherwise the data layer (recommendations, search facets, price
history, reviews) has nothing credible to render on top of.

## Decision

Enriched the seed dataset and replaced every product image with a real photo:

- **60 products** (was ~34) across 12 categories, each with realistic pricing,
  compare-at prices, ratings and review counts.
- **11 shops** (was 5): added GameZone, Mobile Planet, SneakLab, Maison & Co,
  Beauty Corner and BookHaven so listings show seller diversity.
- **Real product images**: one curated photo per product, stored locally under
  `client/public/products/<slug>.jpg`. The seed now points every product at
  `/products/${slug}.jpg` (a single source of truth) instead of per-product CDN
  links or ad-hoc placeholders.
- **Richer reviews**: review template pool expanded from 8 to 20 varied French
  entries (ratings 2–5, different tones) → 211 reviews seeded with more natural
  spread.
- French keyword tags per category kept so the French UI search still matches the
  English catalogue (e.g. "casque" → headphones).

## Why

- **Local images over a live API/CDN.** Images are committed into the repo so the
  demo is fully offline-reproducible and never depends on a third-party service
  being up (or rate-limiting us) during the presentation. A predictable
  `/products/<slug>.jpg` convention keeps the seed trivial and the assets greppable.
- **No AI-generated images** (explicit constraint): the photos are real stock
  photography, which reads as authentic product imagery to a jury.
- **Breadth for the demo features.** More products + sellers give the search
  facets, category pages, recommendation engine and "trending" backfill enough
  material to look alive rather than empty.

## Alternatives considered

- **Live image API at runtime / build time** (Pexels API, Unsplash API): rejected.
  Adds an external runtime dependency and an API key to manage; unreliable from a
  sandboxed/offline environment and during a live demo. Committing static assets is
  simpler and deterministic.
- **AI image generation**: explicitly ruled out — we wanted real product
  photography, not synthetic renders.
- **A full-collection wipe in the seed cleanup**: rejected. The seed intentionally
  scopes its cleanup to the records it creates (by seller email / category slug) so
  it doesn't destroy data other developers/features rely on. Stale products from an
  older seed revision (the removed "TedShop" white-label set) were cleaned out
  once, manually, rather than by making the seed destructive.

## Impact

- `server/src/scripts/seed.ts`: +6 sellers, +26 products, universal
  `/products/<slug>.jpg` image path, review pool 8→20, a sample conversation seed.
- `client/public/products/`: 60 new `<slug>.jpg` product photos.
- Re-running `pnpm --filter @ecommerce/server seed` yields 11 sellers, 12
  categories, 60 products, 211 reviews, 15 orders, 4 coupons, 20 product views and
  1 sample conversation. Verified the catalog (`/search`), category and product
  pages render the new imagery and price-history chart correctly.

## Follow-ups

- The legacy `image: '/products/*-sm.jpg'` field on older product entries is now
  unused (the loop reads the universal `images[]` path); the small placeholder
  files could be removed in a later housekeeping pass.
- A few photos are editorial/lifestyle rather than pure pack-shots; fine for a demo
  but could be tightened later if exact pack-shots are wanted.
