# Eco-delivery transparency at checkout

**Date:** 2026-06-08
**Author:** feature/price-history-transparency
**Type:** feature

## Context

The buyer journey at checkout currently exposes a binary shipping choice (home
delivery vs pickup point) with cost and ETA, but no information at all on the
environmental impact of each option. Logistics last-mile is one of the largest
CO2 contributors in retail and shoppers increasingly want a non-greenwashed
way to make that trade-off — including students and developers reviewing the
project, who flagged this gap explicitly.

We want to expose, at the point of decision, how each delivery mode compares
on its CO2 footprint, and give buyers a way to lock in a lower-impact choice
that the platform tracks per order.

## Decision

We add a parallel "eco-delivery" axis on top of the existing `DeliveryType`
enum (HOME / PICKUP_POINT). The buyer keeps choosing their core delivery type
in the existing block; a new block immediately below offers the four eco
options:

- `standard` — baseline at ~2.5 kg CO2 / shipment (default reference)
- `pickup_grouped` — recommended, ~0.8 kg CO2 (last-mile mutualisation)
- `bike_cargo` — ~0.2 kg CO2, urban zones only
- `slow_grouped` — ~0.5 kg CO2, ETA 5–7 days

The choice is persisted in a **dedicated `OrderEcoMetric` collection** keyed
by `orderId`, NOT on the Order entity itself. The metric is stored
**post-order-creation** through a separate endpoint
`POST /api/eco-delivery/orders/:orderId/choice` and is non-blocking — a
failure to record never breaks the checkout flow.

CO2 figures and the car-km equivalence (`0.12 kg CO2 / km`) come from
ADEME's published 2024 estimates. They live in the domain layer as constants
and the units are kept explicit at every layer.

## Why

- **Zero conflict with `feature/cart-orders`**: the dominant rule for this
  feature was to leave the `Order` entity, model, use-case and controller
  untouched. A separate collection + a separate router + a single import in
  `routes/index.ts` is the minimal surface needed to land this.
- **Non-blocking metric**: writing the eco metric is informational, not part
  of payment or stock reservation. Failing it would be bad UX without any
  business gain — silent retry on the client is acceptable here.
- **Static catalogue, not seed data**: the options are platform-level
  policy, not seller-level. Putting them in a static domain module instead of
  a Mongo collection avoids a useless DB read on every checkout render and
  prevents sellers from gaming the values.
- **Pickup-grouped as the default**: best trade-off between availability
  (everyone has a pickup point nearby) and impact reduction. Bike-cargo would
  be ideal but isn't globally available.
- **Equivalence in car km**: kg of CO2 are abstract to most buyers — `13 km
in a car` is a tangible unit that drives behaviour change.

## Alternatives considered

- **Extending the `DeliveryType` enum with eco variants** (HOME_BIKE,
  PICKUP_SLOW…): would have produced a more uniform API but required a
  schema change on Order plus a much larger blast radius in
  `feature/cart-orders`. Rejected — too much merge risk.
- **Storing the eco choice in the cart, before order creation**: cleaner UX
  in theory, but the cart is owned by `feature/cart-orders` and its Redis
  model is volatile. Keeping the metric attached to the order ensures it
  survives cart re-runs and payment retries.
- **Per-product CO2 weighting (kg × distance)**: more accurate but requires
  catalog-wide CO2 data per SKU that we don't have. Defaulting to one CO2
  budget per shipment is honest given the available data.
- **External carbon-offset partner integration** (e.g. EcoTree, Reforest'Action):
  rejected for this iteration — adds a payment path and a vendor dependency
  for a feature whose first job is transparency, not compensation. The metric
  collection is structured so an offset feature can land on top of it later.

## Impact

### New files (zero merge surface)

- `shared/src/types/ecoDelivery.ts` — DTOs.
- `server/src/domain/entities/EcoDeliveryOption.ts` — static catalogue +
  baseline constants.
- `server/src/domain/entities/OrderEcoMetric.ts` — persisted entity.
- `server/src/domain/repositories/IOrderEcoMetricRepository.ts`.
- `server/src/infrastructure/database/models/OrderEcoMetric.ts` — Mongoose
  model, unique index on `orderId`.
- `server/src/infrastructure/repositories/OrderEcoMetricRepository.ts` —
  upsert by orderId + aggregation helper for future dashboards.
- `server/src/application/use-cases/EcoDeliveryUseCase.ts`.
- `server/src/interfaces/http/controllers/EcoDeliveryController.ts`.
- `server/src/interfaces/http/routes/ecoDelivery.ts` — self-contained DI.
- `server/tests/cart-orders/ecoDeliveryUseCase.test.ts`.
- `client/src/lib/ecoDelivery.ts` — client API.
- `client/src/components/checkout/EcoDeliverySelector.tsx`.

### Touched files (modifs minimales)

- `shared/src/types/index.ts` — single `export *` line.
- `server/src/interfaces/http/routes/index.ts` — import + one `router.use`.
- `server/tests/integration/api.integration.test.ts` — new
  `describe('Eco-delivery')` block (4 tests).
- `client/src/lib/i18n.ts` — new `eco` block inserted BEFORE `checkout` to
  avoid touching that section's keys.
- `client/src/app/checkout/page.tsx` — 4 small additions: import, state,
  selector JSX, and a fire-and-forget call to `recordEcoDeliveryChoice`
  after `createOrder`.

## Follow-ups

- Display the locked-in eco metric on the order detail page (`/orders/[id]`)
  and on the confirmation step of the checkout.
- Build a "My impact" dashboard at `/profile/impact` aggregating
  `sumSavedByOrderIds` across the buyer's lifetime orders.
- Geo-fence the `bike_cargo` option by checking the shipping address postal
  code at choice time (currently the UI just marks it "urban only").
- Plug an actual carbon-offset partner once we have legal sign-off; the
  `OrderEcoMetric` row would gain a `compensationId` field.
- Wire the eco metric into the OpenAPI document — currently the new routes
  are not advertised in `/api/docs.json`.
