# Complete Sections 1 & 2: seller review replies, product comparison, admin product moderation, recommendations

**Date:** 2026-05-31
**Author:** feature/catalog-search
**Type:** feature

## Context

The project audit (`docs/ETAT-DU-PROJET-ET-PLAN-20.md`) found Sections 1 & 2
otherwise strong but missing four brief-mandated deliverables, all build-able now
(without the unbuilt Section 3 orders): the seller "réponses aux avis", the
"comparaison de produits", the admin "supervision des produits vendeurs", and a
fuller "système de recommandation". Per the user's decision, all of this lands
on `feature/catalog-search` (no rebase), and admin moderation is "complète"
(view all, hide/show, delete).

## Decision

**1. Seller replies to reviews (Section 2 — backend + frontend).**

- The DB had **0 reviews** (the seed only set denormalized `reviewCount`), so the
  feature had nothing to act on. Enriched the main `seed.ts` with an **admin
  account**, **5 buyers**, and **~48 French reviews** (synthetic `orderId` until
  Section 3 — Mongo has no FK; some pre-answered to show both states).
- New `SellerReviewUseCase` (+ `SellerReviewError`): `listForSeller` (reviews on
  the seller's own products) and `respond` (ownership-checked write of
  `sellerResponse`). Repo gained `findById` / `findForSellerProducts` /
  `setSellerResponse`; fixed `toEntity` to gate `sellerResponse` on its `comment`
  (Mongoose materializes the nested path as `{}` — this also fixed the public
  reviews endpoint once reviews existed).
- Routes `GET /products/me/reviews` and `POST /products/reviews/:id/reply`
  (seller RBAC + Zod). Client `/seller/reviews` page with a Tous/Sans-réponse
  filter and an inline reply form; the seller-hub "Avis" tab is now enabled.

**2. Product comparison (Section 2 — frontend).**

- Persisted Zustand store (`store/compare.ts`, localStorage, max 4). A
  `CompareButton` on every catalog card, a floating `CompareBar` (in the root
  layout), and a `/compare` page that refetches full products and renders a
  side-by-side table (price + "meilleur prix", rating + "mieux noté", brand,
  category, **per-variant attribute values**, availability, description).

**3. Admin product moderation (Section 1 — backend + frontend).**

- `ProductListFilters.anyStatus` lets the search return hidden products too
  (default still active-only). `AdminUseCase` gained product/seller repos and
  `listProducts` / `setProductActive` / `deleteProduct`, each **audit-logged**
  (new `AuditAction.PRODUCT_STATUS_CHANGED` / `PRODUCT_DELETED`; `logAction` now
  takes a `targetType`). Routes under `/admin/products`. Client `/admin/products`
  page (all sellers, all statuses) with search, status filter, hide/show, delete,
  and a new "Produits" admin nav entry.

**4. Recommendations (Section 2).** The PDP "Vous aimerez aussi" now merges
best-sellers from the **same brand first**, then the same category, de-duplicated.

## Why

- These are the exact Section-1/2 items still owed to the brief; everything else
  outstanding belongs to Section 3 (orders) or Section 4 (infra).
- Reviews had to be seeded for both the public reviews display and the seller
  reply hub to be demonstrable; doing it in the canonical seed (not a throwaway
  script) keeps it reproducible.
- Comparison and admin moderation reuse existing search/repos rather than new
  aggregations, keeping the change additive and within the clean-architecture
  boundaries.

## Impact

- Server: `domain/{entities/AuditLog,repositories/IReviewRepository,repositories/IProductRepository}`,
  `application/use-cases/{SellerReviewUseCase(new),AdminUseCase}`,
  `infrastructure/repositories/{ReviewRepository,ProductRepository}`,
  `interfaces/http/{controllers/SellerReviewController(new),controllers/AdminController,routes/products,routes/admin,schemas/productSchemas}`,
  `scripts/seed.ts`.
- Client: `lib/{catalog,i18n}`, `store/compare(new)`,
  `components/compare/{CompareButton,CompareBar}(new)`,
  `components/{catalog/CatalogProductCard,seller/SellerNav}`,
  `app/{layout,compare/page(new),seller/reviews/page(new),admin/products/page(new),admin/page,admin/users/page,products/[slug]/page}`.
- Seed now ships admin (`admin@abracadabra.local`) + 5 buyers + 48 reviews — all
  password `Password123`.
- Verified: server `tsc` + **32 Jest tests** pass; client `tsc` + `next lint`
  clean; APIs smoke-tested (seller reply incl. 403 ownership guard; admin
  moderation incl. 403 non-admin); in-browser screenshots of `/seller/reviews`,
  `/admin/products`, `/compare`.

## Follow-ups

- Review CREATE by buyers (post-delivery) is Section 3; `Review.orderId` stays
  required (synthetic in seed) until orders land.
- Seller dashboard sales stats and admin order/revenue stats remain stubbed
  pending Section 3.
- Next: Section 3 (cart/orders/payment) and Section 4 (Swagger, WebSockets,
  integration tests, deployment) per the roadmap.
