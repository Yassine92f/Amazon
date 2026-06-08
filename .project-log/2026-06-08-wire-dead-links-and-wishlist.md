# Wire up dead links, wishlist on cards, and dashboard stats

**Date:** 2026-06-08
**Author:** feature/cart-orders
**Type:** fix

## Context

An audit of the frontend turned up several things that were built but not wired
up end-to-end:

- Multiple `href="#"` dead links: the header promo banner CTA, the homepage
  footer (Company: about/careers/press — Legal: privacy/terms), and the seller
  hub footer (policies/fees/support).
- The wishlist feature (store + `/wishlist` page + backend) was only reachable
  from the product **detail** page — no way to add to favourites from product
  listings (home, search, category).
- The seller dashboard `drafts` stat was hardcoded to `0`, and `outOfStock` was
  computed from a 1-item fetch (`limit: 1`), so the "X en rupture" hint was wrong.
- Two dead i18n keys (`common.soon`, `seller.dash.soon`) left over from a removed
  placeholder.
- `components/ProductCard.tsx` was dead code (imported nowhere; superseded by
  `CatalogProductCard`) and itself contained an unwired "Add to cart" button.

## Decision

- **Static pages**: created `/about`, `/careers`, `/press`, `/contact`,
  `/privacy`, `/terms` via a shared `InfoPage` component (Header + prose +
  footer). Extracted the homepage footer into a reusable `SiteFooter` component
  and pointed every former `#` link at a real route. Promo CTA → `/search`.
  Seller footer: policies → `/terms`, fees → `/become-seller`, support →
  `/contact`.
- **Wishlist on cards**: new `WishlistButton` component (mirrors `CompareButton`)
  added to `CatalogProductCard`. Reads membership from the global wishlist store
  (`ids`), toggles via the store, and redirects anonymous users to
  `/login?redirect=…`. Placed bottom-left to avoid the discount (top-left) and
  out-of-stock (top-right) badges.
- **Dashboard stats**: bumped the product fetch to `limit: 100` so `outOfStock`
  is accurate; dropped the never-rendered `active`/`drafts` fields.
- Removed the two dead i18n keys and deleted `ProductCard.tsx`.

## Why

These were all "looks finished but isn't" gaps — the most damaging for a project
graded on completeness. Extracting `SiteFooter` keeps the footer in one place
instead of duplicating ~80 lines across every page that needs it. The wishlist
backend was already done, so surfacing it on cards is the highest-UX-value, lowest-risk fix.

## Alternatives considered

- **Leave footer inline and copy it per page** — rejected; duplication that would
  drift out of sync.
- **Add wishlist to a card via a new prop on every call site** — unnecessary;
  `CatalogProductCard` already receives the full `ProductSummaryDto`, so the
  button only needs `product._id`.
- **Compute `drafts` from the product list** — `ProductSummaryDto` has no status
  field and the stat isn't displayed, so it was removed rather than faked.

## Impact

- New: `app/{about,careers,press,contact,privacy,terms}/page.tsx`,
  `components/{InfoPage,SiteFooter,WishlistButton}.tsx`, `public/logo.svg`.
- Modified: `Header.tsx`, `seller/layout.tsx`, `seller/page.tsx`,
  `catalog/CatalogProductCard.tsx`, `page.tsx`, `i18n.ts`.
- Deleted: `components/ProductCard.tsx`.
- Client lint + typecheck pass (after building `@ecommerce/shared`).

## Follow-ups

- Replace the placeholder copy on the legal/company pages with real legal text
  before any production use.
- Optionally add the wishlist heart to the product detail gallery thumbnails too.
