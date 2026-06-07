# API documentation (OpenAPI/Swagger) and HTTP integration tests

**Date:** 2026-06-07
**Author:** feature/infra-transverse
**Type:** tooling

## Context

The backend exposed a large REST surface (auth, catalog, cart, orders, payments,
coupons, wishlist, reviews, admin) with no machine-readable contract and no
browsable documentation. Until now the only automated coverage was unit tests
against mocked repositories: they verify use-case logic in isolation but never
exercise the wired Express stack (routing, middlewares, validation, DI, the real
Mongoose layer). Two gaps to close for a professional deliverable:

1. Discoverable, always-up-to-date API docs.
2. At least one test layer that proves the HTTP stack actually works end to end.

## Decision

1. **OpenAPI 3.0.3 + Swagger UI.** Hand-authored a single typed spec object in
   `server/src/interfaces/http/openapi.ts` (`export const openapiSpec`), mounted
   in `server/src/app.ts`:
   - `GET /api/docs.json` — raw OpenAPI document.
   - `GET /api/docs` — Swagger UI (served with `helmet({ contentSecurityPolicy:
false })` on that path only, because the default CSP blocks Swagger UI's
     inline assets).
2. **Integration tests** in `server/tests/integration/api.integration.test.ts`
   using `supertest` against the real `app` and `mongodb-memory-server` for a
   throwaway MongoDB. They cover: register → `/auth/me`, bad login + unauthenticated
   401, the full purchase flow (register → add address → add to cart → create
   order, asserting atomic stock decrement), an out-of-stock order returning 409,
   and the OpenAPI document being served.
3. **Deterministic email in tests.** `EmailService.getTransporter()` now uses
   nodemailer's `jsonTransport` when `config.env === 'test'`, so best-effort
   welcome/order emails never open a network connection during tests.
4. **Test env hardening.** `tests/setup.ts` sets dummy `STRIPE_SECRET_KEY` /
   `STRIPE_WEBHOOK_SECRET` so importing the app (the Stripe service constructs at
   module load) never depends on a real `.env`.

## Why

- A hand-authored spec object (vs. scattered JSDoc annotations) keeps the whole
  contract in one reviewable file, is plain TypeScript (typo-checked at build),
  and needs no extra build step. `swagger-jsdoc` was already a dependency but the
  annotation-per-route approach spreads the contract across dozens of files and
  is easy to let rot.
- `mongodb-memory-server` gives real Mongoose behavior (indexes, atomic `$inc`
  stock guards, validation) without a Docker/Mongo dependency in the test run, so
  the suite stays self-contained and CI-friendly.
- Integration tests catch wiring bugs that mocked unit tests structurally cannot:
  DI assembly, middleware order, validation schemas, status codes.

## Alternatives considered

- **`swagger-jsdoc` annotations on each route** — rejected: contract scattered
  across files, no compile-time check, more churn to keep in sync.
- **Running tests against the dev MongoDB container** — rejected: requires Docker
  running, pollutes/depends on shared state, not reproducible in CI.
- **Mocking the HTTP layer** — defeats the purpose; the point is to test the real
  wired stack.

## Impact

- New: `server/src/interfaces/http/openapi.ts`,
  `server/tests/integration/api.integration.test.ts`.
- Edited: `server/src/app.ts` (mount docs), `server/tests/setup.ts` (dummy env),
  `server/src/infrastructure/services/EmailService.ts` (`jsonTransport` in test).
- New dev dependencies: `swagger-ui-express`, `@types/swagger-ui-express`,
  `supertest`, `@types/supertest`, `mongodb-memory-server`.
- Test suite: 74 passing (5 new integration tests). Docs live at `/api/docs`.

## Follow-ups

- Could generate a typed client from `docs.json` for the frontend instead of the
  hand-written `commerce.ts` calls.
- Expand integration coverage to seller flows and the payment confirm endpoint
  (Stripe stubbed).
- Wire the suite into CI once the DevOps branch lands.
