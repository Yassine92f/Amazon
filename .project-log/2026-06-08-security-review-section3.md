# Security review of Section 3 before merge into develop

**Date:** 2026-06-08
**Author:** feature/cart-orders
**Type:** decision

## Context

Before opening the pull request from `feature/cart-orders` into `develop`, we ran
a focused security review of the whole branch. The branch carries most of the
net-new backend surface (cart, orders, coupons, wishlist, Stripe payments,
reviews, recommendation engine) plus the devops hardening and the recent
frontend work (brand logo, info pages, wishlist on cards). Money and personal
data flow through this code, so a sign-off was warranted before it reaches a
shared branch.

## Decision

Treat the branch as merge-ready from a security standpoint. The review found
**no HIGH or MEDIUM confidence exploitable vulnerabilities**. The methodology:
map the existing auth/validation/ownership patterns, compare the new code against
them, then trace each data flow from user input to DB/payment operations.
Candidate issues were filtered for false positives; none cleared the bar.

## Why

The review confirmed the controls that matter for this domain hold up:

- **IDOR / ownership** — payments, orders, reviews and products all verify the
  resource belongs to the caller before acting; Stripe charge amounts are
  computed server-side from the order, never taken from the client.
- **Stripe** — webhook signature verified via `constructEvent`; raw body mounted
  before the JSON parser; refunds admin-only; `markPaid` idempotent.
- **NoSQL injection** — user-supplied ids/tokens reach Mongoose as Zod-validated
  strings or are coerced (`ObjectId`/`String`), blocking `{$gt:""}`-style
  operator injection.
- **Auth / RBAC** — `authenticate`/`optionalAuthenticate`/`authorize` correctly
  applied; insecure JWT secret defaults rejected at boot in production; refresh
  rotation + Redis blacklist present.
- **Privilege escalation / mass assignment** — role/status updates validate the
  enum and block touching admins; `sellerId` is derived server-side, never from
  the request body.

## Alternatives considered

- **Skip the review and rely on the PR reviewer** — rejected; Section 3 is the
  highest-risk area of the project (payments + PII) and deserved a dedicated pass
  before review load landed on a teammate.

## Impact

No code changes resulted from the review — it is a validation milestone. Two
sub-threshold hygiene notes were recorded for later (not vulnerabilities):

- `UserController.updateAddress` forwards `req.body` into a per-key
  `addresses.$.<key>` update; scoped to the caller's own address subdocument, so
  no cross-user impact. A field whitelist would be cleaner.
- `ProductController.parseFilters` reads `q.query` without explicit string
  coercion, but it only feeds `$text.$search`, which MongoDB rejects for
  non-strings — no injection path.

## Follow-ups

- Apply a field whitelist to `updateAddress` as a hardening nicety.
- Re-run a security pass whenever a new money/PII-touching endpoint is added.
