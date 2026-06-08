# Price-history transparency on the product detail page

**Date:** 2026-06-08
**Author:** feature/price-history-transparency
**Type:** feature

## Context

Shoppers have no way to tell whether a posted "discount" is genuine. A seller
can quietly raise a product's reference price, then mark it down to its
original price and brand it as a promotion. The buy box shows the current price
and an optional `compareAtPrice`, but neither value is auditable — the buyer
must trust the seller.

We want to give buyers an honest picture of how the price of a product has
evolved over time, similar to what shopping comparison sites do.

## Decision

We append an immutable observation to a `PriceHistory` collection every time
the price of a variant changes — at product creation and on each seller edit.
A new public endpoint `GET /api/products/:id/price-history` exposes the series
for a window (default 90 days, clamped to [7, 365]) along with a summary
(`current / min / max / avg`, lowest-ever, "drop from max" percentage), and a
new `<PriceHistoryChart>` component renders it as an SVG line chart on the
product detail page.

The chart is purely informational and read-only — sellers cannot suppress or
overwrite entries.

## Why

- **Auditable history**: storing observations as append-only events means the
  series is tamper-resistant. A seller can no longer make a fake markdown look
  legitimate.
- **Default window of 90 days**: matches the buying cycle of most consumer
  goods. The selector exposes 7d / 30d / 90d / 6m / 1y so power-users can drill
  in or out.
- **De-duplication on write**: only record when the latest price for the
  variant differs from the new price. Keeps the collection compact for stable
  products without losing information.
- **Cheapest-variant fallback**: matches the buy box's default selection so the
  chart and the price the user sees stay coherent.
- **Day-resolution aggregation**: avoids cluttering the chart when multiple
  changes land within the same day, and keeps the X axis readable for long
  windows.
- **SVG chart, no external lib**: a 60-line component beats pulling
  Recharts/Chart.js and the bundle cost they imply. The visual style mirrors
  the brand tokens already used elsewhere.

## Alternatives considered

- **Snapshot table updated daily by a cron**: simpler reads, but loses
  intra-day granularity and adds an operational dependency for a feature this
  small.
- **Storing the series on the product document** (`priceHistory: [{date,
price}]` subarray): hot writes on a single document, unbounded growth, and
  no way to query across products. Rejected.
- **Lib-backed chart (Recharts / Chart.js / Visx)**: rejected to avoid adding
  ~100–200 KB to the client bundle for one chart.
- **Per-product moving averages**: stretching scope. The raw series already
  tells the truth; smoothing would risk hiding sharp legitimate moves.

## Impact

### New files

- `shared/src/types/product.ts` — `PriceHistoryPoint`, `PriceHistorySummary`,
  `PriceHistoryResponse`.
- `server/src/domain/entities/PriceHistory.ts`
- `server/src/domain/repositories/IPriceHistoryRepository.ts`
- `server/src/infrastructure/database/models/PriceHistory.ts` (Mongoose model,
  compound index on `productId/variantId/recordedAt`)
- `server/src/infrastructure/repositories/PriceHistoryRepository.ts`
- `server/src/application/use-cases/PriceHistoryUseCase.ts` (record on
  create/update, aggregate by day, build summary)
- `server/src/interfaces/http/controllers/PriceHistoryController.ts`
- `server/tests/catalog/priceHistoryUseCase.test.ts`
- `client/src/components/catalog/PriceHistoryChart.tsx`

### Modified files

- `server/src/application/use-cases/ProductUseCase.ts` — accepts an optional
  `IPriceHistoryRepository`; calls `recordCreate`/`recordUpdate`/`deleteForProduct`
  at the appropriate lifecycle points. Stays backwards-compatible (existing
  tests that don't pass the repo keep working).
- `server/src/interfaces/http/routes/products.ts` — wires the new repo, use
  case, controller, and route. Route declared **before** the catch-all
  `/:slug` to avoid path conflicts.
- `server/src/scripts/seed.ts` — generates 90 days of synthetic history per
  variant on seed so the chart has something to plot in dev.
- `server/tests/integration/api.integration.test.ts` — new
  `describe('Price history')` block covering the happy path, the clamp, the
  404, and the cheapest-variant fallback.
- `client/src/lib/catalog.ts` — `getPriceHistory()` client + DTO types.
- `client/src/lib/i18n.ts` — French copy for the chart UI.
- `client/src/app/products/[slug]/page.tsx` — chart slotted between the
  description/specs and the related-products section.

## Follow-ups

- Hook the chart to the variant switcher so the displayed series updates when
  the buyer picks a different colour/size. (Currently rebinds via the
  `variantId` prop — verify in manual testing.)
- Surface a "Lowest in X days" badge in the buy box itself when
  `summary.isLowestEver` holds — would echo the chart's signal at the
  decision point.
- Backfill historical prices for existing products on first deploy via a
  one-shot migration so the chart isn't empty in production.
- Consider rate-limiting `GET /api/products/:id/price-history` if it becomes a
  cheap scraping target (current Redis cache TTL of 60s should be enough for
  now).
