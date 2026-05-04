# Recommendation engine (hybrid, explainable)

**Date:** 2026-06-08
**Author:** feature/recommendation-engine
**Type:** feature

## Context

A marketplace converts better when it actively surfaces relevant products
instead of waiting for the shopper to search. We wanted a "bonus" algorithmic
feature that nudges a user toward an order based on (a) what they bought before
and (b) what they recently looked at. Beyond conversion, this is an algorithm
showcase for the jury, so two properties mattered as much as the result itself:
the method had to be **principled** (a real ranking model, not a random shuffle)
and **explainable** (every recommendation states _why_ it was chosen).

## Decision

Built a **hybrid recommender** combining three signals, each normalized to
[0,1] and blended with fixed weights:

```
score(product) = 0.5 * contentAffinity      // taste profile match
               + 0.3 * collaborative        // co-purchase ("bought together")
               + 0.2 * popularity           // rating x log(sales)
```

1. **Behavioral signals & taste profile.** We weight a purchase (3) above a
   recent view (1), and apply an exponential **recency decay** (half-life 45
   days) so last week's interest counts more than last year's. Each signal
   product contributes its weight to the user's affinity scores per _category_,
   _brand_ and _tag_. The content affinity of a candidate is the weighted sum of
   the profile scores for its own category/brand/tags (category 1.0, brand 0.6,
   tag 0.4).
2. **Collaborative (item-to-item).** From the orders that contain the user's
   purchased products, we count how often each _other_ product co-occurs. This
   is the classic "customers who bought X also bought Y" signal and needs no
   model training — it is computed on the fly from order history.
3. **Popularity.** `rating/5 * log10(1 + totalSold)` as a gentle tie-breaker and
   a quality floor (the log dampens runaway best-sellers).

**Candidate pool** = products in the user's top 3 categories (∪) products
co-purchased with what they own, minus everything they already engaged with and
anything out of stock. We score that pool, normalize each component across it,
blend, and keep the top N.

**Cold start.** A brand-new user with no history gets the _trending_ list
(best-sellers), so the rail is never empty.

**Explainability.** The backend returns a machine `reasonCode`
(`bought_together`, `category_affinity`, `brand_affinity`, `similar`,
`trending`) plus the dynamic label (the co-bought product, the category or the
brand name). The frontend turns that into a localized chip on each card — e.g.
"Souvent acheté avec Casque Sony", "Parce que vous aimez Audio". A concrete
co-purchase always wins the explanation because it is the most convincing.

**View tracking.** A new `ProductView` collection records (user, product,
viewedAt) as an upsert (one row per pair, refreshed on re-view). The product
page fires a fire-and-forget `POST /recommendations/views/:id` on load; it is a
no-op for guests.

**Surfaces.** Two placements: a personalized "Recommandé pour vous" rail on the
home page (logged-in users), and an engine-powered "Vous aimerez aussi" on each
product page (`getSimilarToProduct`, which works for guests too and replaced the
previous naive same-category list).

**Endpoints** (clean-architecture layering respected — the algorithm is a pure
application use case, repositories are injected):

- `GET /recommendations` (auth) — personalized feed.
- `GET /recommendations/similar/:productId` (public) — you-may-also-like.
- `POST /recommendations/views/:productId` (optional auth) — record a view.

## Why

- **Hybrid over a single method.** Content-based alone cannot suggest a
  complementary accessory from another category; collaborative alone suffers
  cold-start and a sparse-data "popularity bias". Blending covers each method's
  blind spot, and the weights make the trade-off explicit and tunable.
- **On-the-fly co-purchase, no offline training.** The dataset is small and the
  order history is already indexed; computing co-occurrence per request keeps the
  system simple, stateless and always up to date, with no ML pipeline to operate.
- **Recency decay & purchase>view weighting** encode an obvious truth — intent
  fades and a purchase means more than a glance — which makes the ranking feel
  right without a learned model.
- **Normalize-then-blend** makes the three heterogeneous scores comparable, so
  the 0.5/0.3/0.2 weights actually mean what they say regardless of raw scales.
- **Explainability** builds user trust and is exactly the kind of design choice
  a jury rewards: the system can defend each of its suggestions.

## Alternatives considered

- **Matrix factorization / embeddings (learned model)** — rejected: needs a
  training pipeline, model storage and far more data than a student project has;
  cold-start and explainability both get harder, not easier.
- **Pure "customers also bought"** — rejected as the only signal: empty for new
  or low-traffic products and ignores the user's own demonstrated taste.
- **Returning ready-made French sentences from the backend** — rejected: it
  leaks UI/i18n concerns into the domain. We return a code + label and localize
  on the client.
- **Tracking views client-side only (localStorage)** — rejected: not usable
  server-side for ranking and lost across devices; a `ProductView` collection is
  cheap and shared.
- **A scheduled job precomputing recommendations** — premature at this scale;
  per-request computation is fast enough and always fresh.

## Impact

- **Domain (new):** `ProductView` entity, `IProductViewRepository`; `findByIds`
  added to `IProductRepository`.
- **Infrastructure (new):** `ProductView` model (unique {user,product} +
  {user,viewedAt} indexes), `ProductViewRepository`; `findByIds` on
  `ProductRepository`.
- **Application (new):** `RecommendationUseCase` (the algorithm) +
  `RecommendationItemDto`.
- **Interfaces (new):** `optionalAuthenticate` middleware,
  `RecommendationController`, `/recommendations` routes, registered in the route
  index.
- **Frontend (new):** `RecommendationRail` (cards + reason chips),
  `HomeRecommendations`; commerce API calls + types; i18n `recommendations`
  block (incl. the reason builder); product page now records views and shows
  engine-powered similar products.
- **Tests:** 5 unit tests for the use case (cold start, content+co-purchase with
  owned-product exclusion, view recording, similar products, unknown anchor).
  Mocks of `IProductRepository` updated for `findByIds`. Suite: 84 passing.
- **Verified:** server + client `tsc`, lint, full builds and tests all green.

## Follow-ups

- Add the cart as a third behavioral signal (intent stronger than a view).
- Expose a public "trending" endpoint so the home rail can also engage guests.
- Cache per-user recommendations in Redis (short TTL) if the endpoint gets hot.
- A/B test the 0.5/0.3/0.2 blend and the 45-day half-life against conversion.
- Diversity/business rules: cap items per seller or per category for variety.
