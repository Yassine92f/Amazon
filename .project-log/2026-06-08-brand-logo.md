# Brand logo (Abracadabra wordmark)

**Date:** 2026-06-08
**Author:** feature/cart-orders
**Type:** feature

## Context

The app used a placeholder logo everywhere: a `bg-brand-500` rounded square with
a single "A" next to the text "Abracadabra". A real vector wordmark (the
"abracadabra" lettering topped with a magic wand/sparkle) was provided.

## Decision

Added the wordmark as `client/public/logo.svg` and replaced every placeholder
logo with `<img src="/logo.svg" class="h-* w-auto">`:

- `components/Header.tsx` (storefront header)
- `components/seller/SellerTopBar.tsx` (seller hub header)
- `app/page.tsx` footer — on the dark `bg-brand-900` footer the logo is forced
  white via `brightness-0 invert`
- auth pages: `login`, `register`, `forgot-password`, `reset-password`,
  `verify-email`

The raw SVG was cleaned up for web use: `viewBox` cropped to `280 200 840 350`
(the source had a large transparent margin around the artwork) and `fill` set to
the brand color `#6b3008` (matches the previous `text-brand-900` wordmark).

## Why

One shared asset keeps every surface in sync — swapping the file updates the
whole app. SVG scales crisply at any header height. Fixed `#6b3008` fill instead
of `currentColor` because an external `<img>` SVG does not inherit the parent's
text color; the footer recolors to white with a CSS filter instead of shipping a
second asset.

## Alternatives considered

- **Inline SVG React component** — would allow `currentColor` theming, but adds
  ~60 lines of path markup to every consumer or a new component + svgr setup.
  Rejected as over-engineering for a static brand mark.
- **`next/image`** — lint warns about `<img>`, but the codebase already uses
  `<img>` (e.g. `profile/page.tsx`) and `next/image` adds little for a tiny
  static SVG. Kept `<img>` for consistency.

## Impact

- New file `client/public/logo.svg`.
- 8 components/pages updated; removed the inline "A" square + text markup.
- Lint: only the pre-existing `no-img-element` warnings, no errors.

## Follow-ups

- Optionally reuse the mark as the favicon (`app/icon`) and in transactional
  email templates.
