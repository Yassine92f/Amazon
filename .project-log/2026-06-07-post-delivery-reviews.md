# Post-delivery product reviews

**Date:** 2026-06-07
**Author:** feature/post-delivery-reviews
**Type:** feature

## Context

The brief requires customer reviews gated on delivery, but only review _browsing_
and _seller replies_ existed — there was no write path for buyers. The `Review`
model already carried a unique index on `(userId, productId, orderId)` in
anticipation of this.

## Decision

A buyer can post a review only for a product that belongs to one of _their_
`delivered` orders, once per (order, product):

- `IReviewRepository.create` + `findByOrderAndUser`; `IProductRepository.updateRating`.
- `ReviewUseCase.createReview(userId, input)` validates: order exists, owned by the
  user, status === DELIVERED, contains the product, and not already reviewed
  (409); then creates the review and **resyncs the product's denormalized
  `rating`/`reviewCount`** from the live aggregate (`getStats`).
- `ReviewUseCase.listReviewedProductIds(userId, orderId)` drives the UI.
- Routes (`/reviews`): `POST /` (create) + `GET /mine?orderId=` (already-reviewed
  ids), both authenticated, zod-validated.
- Frontend: a `ReviewForm` (star picker + title + comment) appears per line item on
  a delivered order's detail page; reviewed items show "Avis publié", others show
  "Donner un avis". French i18n.

## Why

Driving the create entry-point from the **order detail** (not the product page)
makes the delivery/ownership gate natural and lets us show per-item state. Re-deriving
`rating`/`reviewCount` from the review aggregate on each write keeps the
denormalized product fields truthful instead of trusting a counter.

## Alternatives considered

- **Review button on the product page**: rejected — it can't cleanly express
  "which of your delivered orders" and complicates the ownership gate.
- **Incrementing `reviewCount` / running-average**: rejected — drifts over time;
  the full recompute is cheap at this scale and always correct. (Side effect: a
  product's seeded inflated `reviewCount` collapses to the real review count once a
  real review lands — accurate, intended.)

## Impact

- Server: `IReviewRepository`/`ReviewRepository` (+create, +findByOrderAndUser),
  `IProductRepository`/`ProductRepository` (+updateRating), new `ReviewUseCase`,
  `BuyerReviewController`, `reviewSchemas`, `/reviews` route. **+5 unit tests; 74
  server tests pass.** Verified end-to-end: order → delivered → review → 409 on
  duplicate → product rating recomputed (4.4 → 4.8).
- Client: `commerce.ts` (+createReview, +getReviewedProductIds), `ReviewForm`
  component, order-detail integration, i18n.

## Follow-ups

- Optional review images upload (the model supports `images[]`; UI not built).
- Edit/delete own review.
