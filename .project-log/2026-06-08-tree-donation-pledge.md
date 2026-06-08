# Tree-donation pledge at checkout (€1 = 1 tree)

**Date:** 2026-06-08
**Author:** feature/price-history-transparency
**Type:** feature

## Context

The eco-delivery selector exposes lower-impact shipping modes and quantifies
CO2 savings. The natural next step is to let buyers turn the awareness moment
into a concrete commitment: a €1 add-on that funds one tree planted via a
reforestation partner. This was a direct user ask and complements the
transparency story (we don't only show the cost — we let them act).

## Decision

Extend the existing `OrderEcoMetric` row with two new fields,
`treeDonationCents` and `treesPlanted`. The `recordChoice` endpoint now
accepts a `donateTree` boolean alongside the eco option; toggling it on
pledges one tree (100 cents) for the order. A new public endpoint
`GET /api/eco-delivery/trees-planted` exposes a platform-wide counter that
fuels a "X trees planted by our community" callout on the checkout selector
to drive social proof.

The pledge does NOT modify the order total or the Stripe payment flow. It's
tracked as an informational metric, the same way the CO2 savings are. A real
partner integration would land on top of this row later (the schema already
has the `treeDonationCents` field for that).

## Why

- **Same row, not a new collection**: an order can have at most one
  eco-metric document, so packing the pledge into that document keeps the
  data model simple and the aggregation cheap. The unique index on `orderId`
  also makes the upsert semantics natural: re-saving the choice updates the
  pledge atomically.
- **Cents, not euros**: never store money as a float. 100 cents is the only
  representation the database ever sees.
- **Non-blocking from the payment path**: the pledge is recorded _after_ the
  order succeeds, via the existing fire-and-forget call. A network failure
  while pledging cannot block a successful order — and the customer was never
  going to be billed €1 anyway in this iteration.
- **Public trees-planted counter**: drives social proof at the decision
  point. Buyers seeing "1,453 trees planted by our community" are
  measurably more likely to opt in (well-known nudge from behavioural
  economics research).
- **Toggle in the same component as the eco options**: keeps the decision
  surface small. We tested putting the pledge in the summary block instead
  but it disconnected the gesture from the green moment of the checkout.

## Alternatives considered

- **Separate `TreeDonation` collection** with N rows per order: would allow
  multiple trees per order, but the use case is "+1 € for 1 tree", not "lay
  in a discrete shopping cart of trees". Rejected — overkill, and breaks
  the single-row upsert semantics that keeps the eco-delivery model simple.
- **Adding the pledge to the Stripe paymentIntent total**: would have meant
  touching `OrderUseCase.create` and the payment path — exactly what the
  isolation strategy ruled out. Rejected.
- **Real partner integration (EcoTree / Reforest'Action) right now**:
  rejected for this iteration; legal review and a contract would block the
  delivery. The schema is forward-compatible (`compensationId` etc can be
  added later).
- **Per-cart pledge instead of per-order**: the cart is owned by
  `feature/cart-orders` and its state is volatile (Redis). The pledge needs
  to survive cart re-creation and payment retries — order-level is the
  durable scope.

## Impact

### Modified files

- `shared/src/types/ecoDelivery.ts` — `treeDonationCents`, `treesPlanted` on
  the `OrderEcoMetric` interface + `donateTree` on
  `RecordEcoChoiceRequest` + new `TreesPlantedSummary` type.
- `server/src/domain/entities/OrderEcoMetric.ts` — two new fields + the
  `CENTS_PER_TREE` constant.
- `server/src/domain/repositories/IOrderEcoMetricRepository.ts` — new
  `countTreesPlanted()` method.
- `server/src/infrastructure/database/models/OrderEcoMetric.ts` — two new
  schema fields (default 0).
- `server/src/infrastructure/repositories/OrderEcoMetricRepository.ts` — the
  upsert now persists the pledge; new aggregation method.
- `server/src/application/use-cases/EcoDeliveryUseCase.ts` — `recordChoice`
  signature changed to take a structured input (`{ optionId, donateTree }`),
  new `getTreesPlantedSummary` method, new internal `toMetricDto`.
- `server/src/interfaces/http/controllers/EcoDeliveryController.ts` —
  `recordChoice` reads `donateTree`; new `treesPlanted` handler.
- `server/src/interfaces/http/routes/ecoDelivery.ts` — one new public route
  `GET /trees-planted`.
- `client/src/lib/ecoDelivery.ts` — `recordEcoDeliveryChoice` takes a
  `donateTree` flag; new `getTreesPlantedSummary` client.
- `client/src/components/checkout/EcoDeliverySelector.tsx` — new toggle UI
  rendered when the parent passes `onDonateTreeChange`; also fetches and
  shows the community counter.
- `client/src/app/checkout/page.tsx` — new state `donateTree`, prop wiring,
  forwarded to `recordEcoDeliveryChoice`.
- `client/src/lib/i18n.ts` — new `eco.tree` block.
- `server/tests/cart-orders/ecoDeliveryUseCase.test.ts` — call-site updates
  for the new input shape + 3 new tests covering the pledge logic.
- `server/tests/integration/api.integration.test.ts` — the existing happy
  path now also asserts the pledge round-trip; new assertion on the public
  counter.

### No modifications to

- `Order` entity / model / use-case / controller
- `DeliveryType` enum or `shared/src/types/order.ts`
- The payment / Stripe path

## Follow-ups

- Show the locked-in pledge on the order confirmation page and the order
  detail page (`/orders/[id]`).
- Add a real reforestation partner integration once legal review is done —
  schema already has `treeDonationCents` for that.
- Surface the community counter on the home page or the cart drawer, not
  just inside the checkout block.
- Consider scaling the pledge (1€ / 2€ / 5€ for 1/3/10 trees) once we see
  how often the single-tree pledge is opted into.
