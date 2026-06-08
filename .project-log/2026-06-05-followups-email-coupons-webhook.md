# Follow-ups: order confirmation email, coupon admin CRUD, webhook & transactions

**Date:** 2026-06-05
**Author:** feature/cart-orders
**Type:** feature

## Context

After the commerce flow shipped, the recap listed follow-ups. This entry covers
the backend ones delivered now.

## Decision

**Order confirmation email.** `IEmailService.sendOrderConfirmation` +
`EmailService` template (reuses the existing `shell`/`button` HTML helpers).
`PaymentUseCase.markPaid` sends it on the PENDING → CONFIRMED transition, after
looking up the buyer via `IUserRepository`. The send is wrapped in try/catch and
never throws — a mail failure must not break payment reconciliation. The mail
goes out once (markPaid is idempotent) whether confirmation came from the webhook
or the client confirm call. `PaymentUseCase` gained `userRepo`, `emailService`
and `{ clientUrl }` constructor deps (clientUrl injected from config in the route,
mirroring `AuthUseCase`). +1 test asserts the mail is sent on confirm.

**Coupon admin CRUD.** Admins can now manage coupons instead of seeding only.
`ICouponRepository` gained `create/findById/findMany/updateById/deleteById/codeExists`;
`CouponAdminUseCase` enforces code uniqueness and discount sanity (>0, percentage
≤ 100) and maps `null` vs `undefined` for clearing optional fields; routes under
`/api/admin/coupons` (admin-only) with zod schemas. +4 unit tests.

**Webhook.** With a real `STRIPE_WEBHOOK_SECRET` now in `.env`, the webhook path
verifies signatures. To exercise it locally, forward events:
`stripe listen --forward-to localhost:5001/api/payments/webhook` (the CLI prints
the `whsec_…` to put in `.env`). The deterministic `/payments/confirm` call
remains the primary path; the webhook is the async backup.

## Why

- Email as a best-effort side effect (not part of the "transaction") keeps payment
  confirmation reliable regardless of SMTP health.
- Coupon CRUD lives under `/admin` behind the existing admin RBAC, consistent with
  user/product moderation already there.

## Alternatives considered

- **Send the email from the webhook only** — rejected: in local dev the webhook
  may never arrive, so confirmations (and now emails) would be missed. Driving it
  from `markPaid` covers both entry points once.
- **Coupon CRUD on the buyer `CouponUseCase`** — rejected: that use-case is the
  buyer-facing evaluate/markUsed path; admin concerns belong in a separate
  `CouponAdminUseCase`.

## Impact

- Server: `IEmailService`/`EmailService`, `PaymentUseCase` (+deps), payments route
  DI, `ICouponRepository`/`CouponRepository`, new `CouponAdminUseCase`,
  `CouponAdminController`, `couponSchemas`, admin route. Test mocks extended.
  **66 server tests pass.**

## Follow-ups / deferred

- **MongoDB transactions** for the order/stock/coupon side effects are deferred:
  Mongo multi-document transactions require a replica set, and local dev runs a
  single mongod (docker-compose.dev.yml) where `session.startTransaction()` throws.
  The current design already guards the critical step — atomic `$inc` with a
  `$gte` stock guard and explicit rollback/restock on failure — so correctness
  does not depend on transactions. Revisit when the deployment target runs a
  replica set; wrap createOrder's decrement + order insert + coupon increment in a
  session then.
- Per-user coupon usage limits.
- Admin coupons UI + "pay later" affordance are delivered in the client part of
  this batch.
