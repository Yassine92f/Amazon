# Client i18n layer + storefront polish (shop page, section headers, product images)

**Date:** 2026-05-28
**Author:** feature/catalog-search
**Type:** refactor

## Context

A design review of the live client surfaced several issues on the customer-facing pages:

1. The public shop page (`/sellers/[slug]`) showed a raw, empty orange gradient bar
   (`h-40 bg-gradient-to-r`) that read as a broken "strange bar" and overlapped the
   identity card awkwardly. The whole page looked machine-generated rather than designed.
2. On the homepage section headers (e.g. "⚡ Flash Deals"), the "View all" action was
   glued directly to the title instead of sitting on the far right, because the
   `SectionHeader` was nested in a flex-wrap row and shrank to its content width.
3. The UI mixed English and French copy (English everywhere, with a handful of French
   strings in the header dropdown). There was no translation layer.
4. Product images were rendered with `object-contain` plus heavy padding on a white box,
   producing large empty white borders — most visible on the product detail gallery.

## Decision

- **Introduced a lightweight, framework-free i18n module** at `client/src/lib/i18n.ts`:
  a single typed French dictionary (`t`) plus locale-aware format helpers
  (`formatPrice`, `formatNumber`, `formatMonthYear`, `formatLongDate`) built on
  `Intl`. All customer-facing components now read copy from `t` instead of hardcoding
  strings. Prices now follow French convention (`279,00 €`).
- **Redesigned the public shop page** with a proper storefront pattern: a layered banner
  (radial highlight + oversized monogram motif + bottom fade into the page background, or
  a scrimmed banner image when present), an overlapping identity card with avatar /
  verified badge / rating, and a clean stat strip (sales, rating, reviews, products).
- **Reworked `SectionHeader`** to render full-width with the action pinned right via
  `ml-auto`, and added an optional `extra` slot so the Flash Deals countdown sits between
  the title and the "Tout voir" link.
- **Switched product images to `object-cover`** (catalog cards, product detail main image
  and thumbnails) on the warm `--color-bg` surface, removing the white borders.

## Why

- A single dictionary keeps the UI in one language and makes copy reusable and reviewable
  in one place. A full i18n library (next-intl, react-intl) was unnecessary for a
  single-locale app and would have added provider boilerplate; the module is shaped so it
  can later become a locale-keyed record without touching call sites.
- The banner bottom-fade and overlapping card are standard marketplace storefront
  patterns (Etsy/Vinted), which removes the "hard bar" artifact while keeping brand color.
- `ml-auto` is robust regardless of the header's container width, fixing the action
  position without a brittle layout wrapper.
- `object-cover` matches the explicit request and fills the frame; product photos are
  centered subjects, so cropping the white margins is desirable.

## Alternatives considered

- **next-intl / react-intl**: rejected — too heavy for one locale, adds runtime/provider
  complexity for no current benefit.
- **Keeping `object-contain` but shrinking padding / tinting the box**: rejected — the
  product photos already carry white backgrounds, so contain still left large empty areas.
- **Leaving the shop banner as a gradient block and only adjusting heights**: rejected —
  it would still read as a flat bar; the layered fade is what makes it feel designed.

## Impact

- New: `client/src/lib/i18n.ts`.
- Updated copy + formatters: `Header`, `MobileTabBar`, `app/page.tsx` (home),
  `app/products/[slug]/page.tsx`, `app/sellers/[slug]/page.tsx` (full rewrite),
  `app/c/[slug]/page.tsx`, `app/search/page.tsx`, `app/seller/layout.tsx`,
  `components/seller/SellerTopBar.tsx`, `components/seller/SellerNav.tsx`,
  `components/catalog/{CatalogShell,FiltersSidebar,ReviewsList,CatalogProductCard}.tsx`.
- Behavioral: prices now formatted as `279,00 €`; product images use `object-cover`.
- `tsc --noEmit` and `next lint` pass (only pre-existing `<img>` warnings on admin/profile).

## Follow-ups

- Category names and product data still come from the DB in English (seed data) — a future
  pass could localize seed content or add per-locale category labels.
- If a second locale is required, promote `t` to a `Record<Locale, Translations>` resolved
  via context; call sites already depend only on `t`.
- Consider a shared `<SectionHeader>` and `<Footer>` extracted from `app/page.tsx` for
  reuse across pages.
