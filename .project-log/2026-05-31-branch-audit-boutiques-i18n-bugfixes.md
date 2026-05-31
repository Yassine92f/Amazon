# Branch audit: shops directory, full seller/admin i18n, catalog bug fixes

**Date:** 2026-05-31
**Author:** feature/catalog-search
**Type:** feature

## Context

A critical end-to-end audit of the `feature/catalog-search` branch (run as three
parallel read-only passes: untranslated strings, catalog/search/review bugs, and
shops/boutiques completeness) surfaced three classes of gaps:

1. **Boutiques felt unfinished.** The server already exposes `GET /sellers`
   (paginated `listSellers`), but there was no client function and no directory
   page — the footer "Vendeurs" links were a dead end. The public shop page
   showed only the first 20 products with no sort or pagination.
2. **Large French/English mix in the seller hub and admin.** The entire seller
   hub (dashboard, products list, product form ~25 strings, settings) was in
   English, plus internal jargon ("cart-orders branch") leaking into seller-facing
   stat cards. Admin pages mixed English nav/labels and raw enum values
   ("seller", "suspended") with French.
3. **Two server correctness bugs** in the catalog/review layer, plus a broken
   header category nav (non-navigating `<button>`s listing categories that don't
   exist in the seeded catalog).

## Decision

**Boutiques**

- Added `listSellers()` + `SellerListParams` to `client/src/lib/catalog.ts`.
- New `/sellers` directory page: paginated card grid (banner + overlapping
  avatar, rating, sales, verified badge), debounced search, "verified only"
  toggle, breadcrumb. New `t.shops` namespace.
- Public shop page (`/sellers/[slug]`): split the single fetch into a shop
  resolve + a products effect keyed on `[shop, page, sortBy]`; added a sort
  select and `Pagination` (12/page).

**i18n**

- Extended the dictionary with `t.seller.dash/list/form/shopSettings`, `t.shops`,
  `t.admin`, and reusable `t.roles` / `t.userStatus` enum→label maps.
- Translated every seller hub file and the admin chrome. Replaced the leaked
  "cart-orders branch" stat hints with a clean "Bientôt disponible".
- Aligned seller-side prices/numbers on the shared `formatPrice`/`formatNumber`
  helpers (e.g. `179,00 €` instead of the old `€179,00`).

**Header navigation**

- Replaced the decorative category buttons with real `/c/[slug]` links mapped to
  the 12 seeded categories (with French labels), and added a leading "Boutiques"
  pill → `/sellers`.

**Server bugs**

- `ProductRepository.normalizeRatingBuckets`: the `$bucket` `[0,1)` group (lower
  boundary 0) was dropped by a `lower < 1 ? 0` clause, silently losing products
  with sub-1★ average ratings from the rating facet. Now maps to the 1★ level
  (`Math.min(5, Math.floor(lower) + 1)`), keeping the existing 1–4 mapping intact.
- `ReviewController.listForProduct`: `minRating` used a bare `Number()` that let
  `NaN` reach the Mongo query. Now guarded with `Number.isFinite`.

## Why

- The shop listing endpoint already existed; the directory was the missing 20%
  that made discovery work end-to-end. Deriving it client-side needed no schema
  change.
- A single-locale app must never show English; the seller hub was the largest
  remaining offender and is the surface sellers spend the most time in.
- The category nav looked functional but navigated nowhere and advertised
  categories (grocery, pets) absent from the catalog — a correctness and trust
  issue, not just polish.
- The rating-bucket bug is currently invisible (the client renders fixed star
  buttons, not the distribution counts) but the API contract should be correct
  for any future consumer; the `NaN` guard prevents malformed query input.

## Alternatives considered

- **Fetching categories dynamically in the Header** instead of a curated static
  list. Rejected for now: the Header is a client component on every page; a
  static list mapped to known seeded slugs avoids a per-page fetch and is
  trivially correct. Revisit if categories become user-managed.
- **Translating seeded product/category names.** Left as-is: those are catalog
  _data_, not UI copy, and real-world product names are commonly English.
- **Full admin rewrite.** Scoped down to the shared chrome + enum displays +
  filters; the admin area is a separate feature and a full pass would add
  cross-feature churn. Degraded (unaccented) French toasts were left untouched.

## Impact

- Client: `lib/catalog.ts`, `lib/i18n.ts`, new `app/sellers/page.tsx`,
  `app/sellers/[slug]/page.tsx`, `components/Header.tsx`, `app/page.tsx` (footer),
  all `app/seller/**` pages, `components/seller/ProductForm.tsx`,
  `app/admin/page.tsx`, `app/admin/users/page.tsx`.
- Server: `infrastructure/repositories/ProductRepository.ts`,
  `interfaces/http/controllers/ReviewController.ts`.
- Verification: client `tsc --noEmit` + `next lint` clean (only pre-existing
  `<img>` warnings); server `tsc` clean + 32/32 Jest tests pass. Verified
  in-browser: shops directory, public shop sort, seller dashboard and product
  form (logged in as a seeded seller) all render fully in French.

## Follow-ups

- Seller dashboard `active`/`outOfStock` counts are computed from a single
  fetched page (`limit: 1`) — an approximation; wire a real aggregate when the
  orders feature lands.
- Image upload (vs raw URL) for shop logo/banner and product images.
- Shop page tabs (À propos / Avis / Politiques) and follow/contact actions.
- Orders & reviews seller sections remain stubbed pending `feature/cart-orders`.
- Seed an admin account so the admin area can be verified end-to-end.
