# Close remaining spec gaps: brand sort, admin stats, lazy loading, category admin

**Date:** 2026-06-09
**Author:** feature/catalog-enrichment
**Type:** feature

## Context

A full audit of the codebase against the project spec ("cahier des charges") found
the platform ~90% complete, with a handful of explicit requirements still partial.
This entry covers the non-DevOps gaps (DevOps — deployment + monitoring — is
deliberately left for a dedicated phase at the end: front on Vercel/Cloudflare,
back on a VPS). The disputes/litiges feature is handled in its own entry.

## Decision

Closed four gaps:

1. **Sort by brand** (spec: "trier par prix, marque et note"). Added `'brand'` as a
   sort key end to end: `VALID_SORT` (controller), `ProductListFilters.sortBy`
   (domain), `buildSortStage` (repo → `{ brand: order, name: 1 }`), client
   `ProductSearchParams.sortBy`, a "Marque (A-Z)" option in the catalog sort
   dropdown. Brand was already a filter facet; it is now also a sort axis.

2. **Admin global statistics** — orders & revenue. `getDashboardStats` previously
   hardcoded `totalOrders: 0` and `totalRevenue: 0`. Now it counts all orders and
   sums `totalAmount` over paid orders (CONFIRMED/PROCESSING/SHIPPED/DELIVERED) via
   an aggregation. The dashboard already rendered these fields.

3. **Lazy loading / code-splitting** (spec: "lazy loading et mémoïsation"). On top
   of Next.js automatic route-splitting, added explicit `next/dynamic` boundaries
   for heavy / below-the-fold, client-only components: the product page's
   `PriceHistoryChart` and `RecommendationRail`, and the checkout `PaymentForm`
   (Stripe Payment Element). Each has a skeleton `loading` placeholder; the Stripe
   and chart chunks now load on demand instead of with the page shell.

4. **Admin category management UI** (spec: admin can add/modify/delete categories).
   The CRUD endpoints already existed (admin-guarded); added the missing client
   surface: `createCategory`/`updateCategory`/`deleteCategory` in the API client,
   a new `/admin/categories` page (list + create/edit/toggle-active/delete), and a
   "Catégories" link in every admin sidebar.

## Why

- Each fix targets the exact wording of a spec requirement that was previously
  partial, with minimal, layer-respecting changes (most backends already existed;
  the work was wiring + UI).
- For lazy loading, route-splitting alone technically satisfies "lazy loading", but
  explicit `next/dynamic` on the heaviest pieces (Stripe, charts) is a clearer,
  demonstrable implementation and a real first-load win on the product/checkout
  pages.
- Admin stats count revenue only on paid orders so the figure is meaningful (a
  pending/cancelled basket isn't revenue).

## Alternatives considered

- Brand sort as client-side only: rejected — sorting must be server-side to be
  correct across pagination.
- A dedicated category create/edit page (like products): rejected for now — an
  inline form on the list page is enough for the small category set and matches the
  coupons admin pattern.

## Impact

- Server: `ProductController`, `IProductRepository`, `ProductRepository`,
  `AdminUseCase` (+ `OrderModel` import for stats).
- Client: `catalog.ts` (sort type + category CRUD), `i18n.ts` (sort + category
  labels), `CatalogShell`, product page & checkout page (dynamic imports), new
  `/admin/categories` page, category link added to all admin navs.
- Verified: server + client typecheck clean; dashboard now reports real
  orders/revenue (21 orders / ~7 292 EUR on current seed).

## Follow-ups

- DevOps phase: actual deployment (Vercel/Cloudflare front, VPS back) + monitoring.
- Could add `React.memo` to heavy list-item components if profiling shows churn.
