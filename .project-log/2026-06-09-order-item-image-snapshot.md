# Order items carry a product image snapshot

**Date:** 2026-06-09
**Author:** feature/catalog-enrichment
**Type:** feature

## Context

On the order detail page ("Articles" section), each line item rendered a generic
package icon instead of the product photo, which looked unfinished next to the rest
of the polished UI.

## Decision

Persist a product **image snapshot** on each order line, exactly like the existing
`productName` / `variantName` / `unitPrice` snapshots, and render it on the order
detail page (falling back to the package icon when absent).

The image is captured at checkout as `variant.images[0] ?? product.images[0]` and
threaded through every layer:

- `shared`: `OrderItem.image?: string`
- domain: `OrderItemEntity.image?`
- infrastructure: Mongoose `orderItemSchema.image`, repository create + entity mappers
- application: `OrderUseCase` snapshots it at order creation and maps it in both
  `toDto` (buyer) and `toSellerDto` (seller)
- seed: `SeededProduct.image` + order-item builder
- client: order detail page renders `<Image>` when `it.image` is present

## Why

- **Snapshot, not join.** Orders are an immutable historical record. Storing the
  image the buyer actually saw (rather than joining the product's _current_ image at
  read time) keeps the order correct even if the product is later edited or removed,
  and avoids N extra product lookups per order render. This matches how name/price
  are already snapshotted.
- One shared `OrderItem.image` field covers both the buyer order view and the seller
  order view, since both DTOs reuse `OrderItem[]`.

## Alternatives considered

- **Enrich the order DTO at read time by looking up each product's image:** rejected
  — adds per-item lookups, shows the current (not purchased) image, and breaks if a
  product is deleted. Inconsistent with the existing snapshot pattern.

## Impact

- Affects new orders automatically; existing demo orders pick up the image after a
  re-seed (verified: ABRA seed orders now carry e.g. `/products/airpods-pro-2.jpg`).
- The order detail "Articles" list now shows real product thumbnails (verified live
  on Alice's delivered order).
- Pre-existing `ORD-*` orders from past manual checkouts have no image (created
  before this change); they belong to deleted/real test users and don't appear in
  the demo personas, so they're left untouched.

## Follow-ups

- The orders **list** page still shows one generic icon per order; a representative
  thumbnail there would need the order _summary_ DTO to carry a first-item image.
