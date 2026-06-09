# Fix Stripe boot crash — dotenv loading the wrong .env path

**Date:** 2026-06-04
**Author:** feature/cart-orders
**Type:** fix

## Context

After the Stripe payment integration landed, `pnpm dev` crashed the server at
startup with:

```
Error: Neither apiKey nor config.authenticator provided
    at new StripePaymentService (server/src/infrastructure/services/StripePaymentService.ts:15)
    at routes/payments.ts:12
```

`StripePaymentService` is instantiated at module-load time when the payments
router is imported, so the missing key took down the whole server, not just the
payment endpoints.

## Decision

Two changes:

1. `server/src/config/index.ts` — fixed the dotenv path from `../../.env`
   (which resolves to a non-existent `server/.env`) to `../../../.env`, the
   actual root-level env file. The path is correct in both dev
   (`server/src/config`) and build (`server/dist/config`) layouts.
2. `StripePaymentService` constructor now throws a clear, actionable message
   when `STRIPE_SECRET_KEY` is empty, instead of leaking Stripe's opaque
   internal error.

## Why

The monorepo keeps a single `.env` at the repository root (per CLAUDE.md and
`.env.example`). The server config pointed dotenv one directory too shallow, so
it silently loaded nothing. Every other config value
(`MONGODB_URI`, `JWT_SECRET`, etc.) has a working localhost/default fallback, so
the misconfiguration stayed invisible until Stripe — the first dependency with
no usable default and eager instantiation at boot — surfaced it.

## Alternatives considered

- **Create a `server/.env`**: rejected — it would fork secrets across two files
  and contradict the documented single-root-`.env` convention.
- **Lazy-instantiate Stripe on first request**: would have hidden the crash but
  not the underlying config bug; deferred. The explicit guard gives a better
  failure mode without restructuring DI.

## Impact

- `server/src/config/index.ts` — dotenv path corrected; all env vars now load.
- `server/src/infrastructure/services/StripePaymentService.ts` — fail-fast guard.

## Follow-ups

- Consider a centralized env validation step (e.g. zod schema) at boot to catch
  every required variable at once instead of one crash at a time.
