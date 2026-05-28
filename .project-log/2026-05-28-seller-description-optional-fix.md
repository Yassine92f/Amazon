# Fix: seller onboarding rejected empty shop description

**Date:** 2026-05-28
**Author:** feature/catalog-search
**Type:** fix

## Context

Creating a shop via `/become-seller` failed with
`Seller validation failed: description: Path \`description\` is required.`
whenever the description was left empty — even though the form labels the field
**(optional)** and the public shop page renders the description conditionally.

## Decision

Removed `required: true` from the `description` field in the Mongoose seller schema
(`server/src/infrastructure/database/models/Seller.ts`), keeping `trim` and `default: ''`.
Also localized the `/become-seller` page to French via the i18n dictionary.

## Why

The schema declared `description: { type: String, required: true, trim: true, default: '' }`,
which is self-contradictory: Mongoose's `required` validator treats an empty string as
missing, so the `default: ''` could never satisfy it. The request validation layer (Zod
`becomeSellerSchema`) already declares `description` as `.default('')` (optional), and the
UI advertises the field as optional — so the Mongoose `required` flag was the outlier and
the correct intent is an optional description. Dropping `required` aligns all three layers.

## Alternatives considered

- **Make description mandatory in the UI + Zod**: rejected — a shop should be creatable
  without a bio; forcing copy at onboarding adds friction for no domain reason.
- **Send `undefined` instead of `''` from the client when empty**: rejected — it hides the
  schema contradiction rather than fixing it, and the next caller would hit the same wall.

## Impact

- `server/src/infrastructure/database/models/Seller.ts` — `description` no longer required.
- `client/src/app/become-seller/page.tsx` + `client/src/lib/i18n.ts` — page translated to
  French (`becomeSeller` namespace).
- No DB migration needed (existing docs already store a string; default stays `''`).
- Server and client `tsc --noEmit` pass; no seller tests asserted the old constraint.

## Follow-ups

- Audit other Mongoose schemas for the same `required: true` + `default: ''` contradiction.
