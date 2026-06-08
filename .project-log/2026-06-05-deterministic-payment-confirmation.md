# Deterministic payment confirmation (fix infinite "validating" order)

**Date:** 2026-06-05
**Author:** feature/cart-orders
**Type:** fix

## Context

After paying on the checkout, the order stayed stuck on "Paiement en cours de
confirmation…" forever and was never marked confirmed. Root cause: the order is
only flipped PENDING → CONFIRMED by the Stripe `payment_intent.succeeded`
**webhook**, but in local dev the webhook never arrives — there is no
`stripe listen` forwarder and `STRIPE_WEBHOOK_SECRET` is a placeholder
(`whsec_xxx`). The success page polled a few times and then gave up, leaving the
order PENDING.

## Decision

Add a deterministic, client-driven confirmation that does not depend on the
webhook:

- `IPaymentService.retrievePaymentIntent(id)` + Stripe implementation
  (`stripe.paymentIntents.retrieve`).
- `PaymentUseCase.confirmPayment(userId, orderId)`: verifies ownership, reads the
  live PaymentIntent status from Stripe and, if `succeeded`, runs the same
  idempotent `markPaid` path the webhook uses (Payment → SUCCEEDED, Order
  PENDING → CONFIRMED). Returns `{ status, paid }`. Idempotent: a non-pending
  order returns immediately.
- `POST /payments/confirm` (auth) wired to it.
- Client: `commerce.confirmPayment(orderId)`. The checkout calls it right after
  Stripe reports success, before navigating; the order detail page also calls it
  as a resilient fallback while polling.

The webhook handler is unchanged and remains the authoritative async path for
production (and for events the client can't observe, e.g. async refunds).

## Why

PaymentIntents are confirmed in the browser via Stripe.js, so the client knows
the moment a payment succeeds. Relying solely on the webhook makes the happy path
hostage to webhook delivery — fragile in local dev and a single point of failure
in prod. Confirming from the client against Stripe's own API (the source of
truth) makes the UX immediate and correct, while the webhook still reconciles
anything missed. Both funnel through the same idempotent `markPaid`, so a double
confirmation is harmless.

## Alternatives considered

- **Require `stripe listen` locally** — rejected as the primary fix: it leaves
  the happy path dependent on out-of-band tooling and does nothing for resilience
  in production.
- **Trust the client's claim of success and mark paid without re-checking Stripe**
  — rejected: never trust the client for money. The server re-reads the
  PaymentIntent status from Stripe before confirming.
- **Poll the order longer** — rejected: still never resolves if the webhook never
  comes.

## Impact

- Server: `IPaymentService` (+`retrievePaymentIntent`), `StripePaymentService`,
  `PaymentUseCase` (+`confirmPayment`), `PaymentController`, payments route, test
  mock. 3 new unit tests; **61 server tests pass**.
- Client: `lib/commerce.ts` (+`confirmPayment`), checkout `handlePaymentSuccess`,
  order detail poll-and-confirm fallback.

## Follow-ups

- Document `stripe listen --forward-to localhost:5001/api/payments/webhook` + a
  real `STRIPE_WEBHOOK_SECRET` for testing the webhook path itself.
- Surface a "retry payment" affordance on a PENDING order whose confirmation
  reports the intent failed.

---

Shipped alongside this fix (same branch, quality pass):

- Stripe Payment Element now uses the app font (Plus Jakarta Sans) via `fonts`
  cssSrc + `appearance.variables.fontFamily` — `inherit` does not cross the iframe.
- Users can reach their orders: "Mes commandes"/"Mes favoris" in the header menu
  and a clickable live order count on the profile.
- Replaced text glyphs (← → and −/+) with lucide icons across checkout, orders,
  product and seller surfaces; made the mobile tab bar actually navigate.
