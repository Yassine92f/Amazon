# Per-variant image upload + verified review demo path

**Date:** 2026-06-08
**Author:** feature/catalog-enrichment
**Type:** feature

## Context

Three asks came up while polishing the catalog for the jury:

1. Allow several images per product.
2. Allow per-variant images, falling back to the product images when a variant
   has none.
3. Let a buyer write a review on a product they ordered, and let a seller reply.

An audit of the codebase (both areas, full stack) showed that **most of this was
already implemented** — the gap was much smaller than the request implied:

- Multiple product images: fully working end to end (types, Mongo schema, Zod
  validation up to 10, batch upload, product page gallery with thumbnails, seller
  form `ImageUploader`).
- Per-variant images + fallback: the backend stores `variant.images[]`, the Zod
  schema accepts it, and the product page **already** does
  `variant.images.length > 0 ? variant.images : product.images`
  (`client/src/app/products/[slug]/page.tsx`), switching the gallery when a
  variant is selected. The ONLY missing piece was the seller form: it had no UI to
  enter per-variant images.
- Review writing (purchase-verified, delivered-order only, one per product/order)
  and seller replies (ownership-checked, `/seller/reviews` hub): both fully
  implemented in Sections 1–3 and working.

## Decision

- **Added per-variant image upload to the seller product form** — the one real
  code gap. `VariantInput` now carries `images: string[]`, each variant row renders
  a compact `ImageUploader`, and the value is mapped on edit and sent on submit.
  Nothing downstream needed changes: the upload endpoint returns absolute URLs that
  already satisfy the `z.string().url()` variant-image validation, and the product
  page already handles display + fallback.
- **Made the review demo path deterministic in the seed.** The demo buyer (Alice)
  is now excluded from authoring the synthetic seed reviews on the products in her
  own delivered-order baskets, so those products always show as un-reviewed _by
  her_ — guaranteeing the live "write a review" flow works from her orders page,
  while other buyers still review those products so they never look empty.

## Why

- Implementing only the missing UI (rather than re-building features that already
  exist) keeps the change minimal and low-risk, and respects the existing
  architecture (the backend contract was already in place).
- Per the chosen scope, demo image data was left as-is (one image per product); the
  capability is what was added, demonstrable by uploading during the presentation.
- The seed already uses a deterministic PRNG, so baking the review-demo guarantee
  into it means it holds on every `pnpm seed`, not by luck.

## Alternatives considered

- **Tying every seeded review to a real order** (so all reviews are genuine
  verified purchases): rejected. Persona baskets are small, so this would collapse
  review coverage from ~205 to a handful — the catalog would look empty. The
  synthetic-orderId reviews are a deliberate demo trade-off for rich review data;
  the live demo path uses a real order and is genuinely purchase-verified.
- **Re-scraping 2–3 images per product + per-variant photos** to showcase galleries
  with seeded data: deferred by choice (color-matched stock photos are hard to
  source cleanly); only the capability was requested for now.

## Impact

- `client/src/components/seller/ProductForm.tsx`: `VariantInput.images`, state
  init/submit wiring, per-variant `ImageUploader`.
- `client/src/lib/i18n.ts`: `seller.form.vImages` / `vImagesHint` labels.
- `server/src/scripts/seed.ts`: demo buyer excluded from reviewing her own
  delivered-basket products (review total 211 → 205).
- Verified end to end (Playwright + DB):
  - Created a product through the form with a product image AND a distinct variant
    image → DB stored both separately → product page renders the variant image.
  - Alice wrote a review from her delivered order → persisted tied to the real
    order (purchase-verified) → "Avis publié" badge shown.
  - Apple Store seller replied to a review from `/seller/reviews` → persisted and
    displayed in the response box.

## Follow-ups

- Seed image enrichment (multiple images/product + per-variant photos) if we later
  want galleries/variant-switching visible without manual upload.
- The legacy unused `image: '/products/*-sm.jpg'` field on older product entries
  can still be cleaned up in a housekeeping pass.
