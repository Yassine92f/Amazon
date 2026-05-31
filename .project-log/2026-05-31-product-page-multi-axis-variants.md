# Product detail redesign + multi-axis variant selector

**Date:** 2026-05-31
**Author:** feature/catalog-search
**Type:** feature

## Context

Two issues on the product detail page (`client/src/app/products/[slug]/page.tsx`):

1. The page diverged from the Pencil `ProductPage` mockup — it was a thin
   two-column layout with no quantity control, no reassurance signals, no
   specification table and no related products.
2. Variant selection was a single flat list of pre-concatenated variant
   names (e.g. `White / Black — EU 42`, `… EU 43`, `… EU 44`). There was no
   way to pick along independent axes (colour, storage, size, region…),
   even though the data model already carries a structured
   `attributes: Record<string, string>` per variant.

## Decision

- Rebuilt the page to mirror the mockup: sticky gallery + buy box, price
  with compare-at and a savings badge, a quantity stepper, a three-up
  reassurance strip (livraison offerte / retours faciles / paiement
  sécurisé), a seller card, a zebra-striped **Caractéristiques** table, and
  a same-category "Vous aimerez aussi" grid.
- Replaced the flat variant list with a **multi-axis selector derived from
  `attributes`**. `deriveOptionGroups()` collapses all variants into ordered,
  de-duplicated axes. The `color` axis renders circular swatches (dual
  colourways via a CSS split gradient); every other axis renders labelled
  chips. Picking a value (`selectValue`) resolves the matching variant while
  keeping the other axes fixed when such a variant exists, otherwise snapping
  to the nearest in-stock variant for that value. `isValueAvailable()` dims
  options with no in-stock combination given the current selection.
- All copy routes through the i18n dictionary; added a `t.product.attr`
  key→label map (color→Couleur, storage→Stockage, size→Taille, band→Bracelet,
  region→Région…) with a capitalized-key fallback, plus trust/spec/related
  strings and a `lowStock(n)` urgency line (shown when stock ≤ 5).

## Why

- The structured `attributes` map was already populated by the seed and the
  domain model but unused by the UI, which flattened everything into
  `variant.name`. Deriving axes from it is the minimal, data-driven way to
  support arbitrary variant dimensions without schema changes.
- Keeping the other axes fixed on selection (with a snap fallback) matches
  the Amazon/marketplace mental model and avoids dead-end combinations.
- The specification table is built from real data (brand, category, selected
  variant SKU, selected attributes, availability, units sold) rather than a
  hardcoded list, so it stays correct as the variant changes.

## Alternatives considered

- **A new `options`/`optionValues` schema on Product** (explicit axis
  definitions). Rejected for now: the `attributes` map already encodes the
  same information and derivation keeps the change client-only with no
  migration. Worth revisiting if sellers need to control axis order/labels.
- **Hiding unavailable combinations** instead of dimming them. Rejected:
  dimming keeps the option grid stable and still lets the user jump to a
  value (snapping to the nearest in-stock variant), which is less jarring.
- **A dropdown per axis.** Rejected: swatches/chips are more scannable and
  match the mockup; dropdowns hide the available range.

## Impact

- `client/src/app/products/[slug]/page.tsx` — full rewrite (gallery, buy box,
  multi-axis selector, stepper, trust strip, specs table, related grid).
- `client/src/lib/i18n.ts` — extended `t.product` (attr map, trust, specs,
  related, quantity, lowStock).
- `DESIGN.md` — two new 2026-05-31 decisions.
- No server, shared-type, or database changes. `tsc --noEmit`, `next lint`
  and `next build` all pass. Verified in-browser on the Samsung S24 Ultra
  (colour + storage axes) and Nike Air Max 90 (colour split-swatch + size
  axis, low-stock line on EU 44 with stock 3).

## Follow-ups

- Variant-specific galleries already supported (`variant.images` preferred
  over `product.images`) but seed variants carry no images yet — populate
  per-variant imagery so the gallery swaps on colour change.
- Consider a seller-defined axis order/label override if the derived order
  (color → storage → size → …) proves insufficient.
- Wire the quantity + selected variant into the cart once
  `feature/cart-orders` lands.
