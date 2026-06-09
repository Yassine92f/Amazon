# Homepage UI, Design System & Shared Types Foundation

**Date:** 2026-03-27
**Author:** Teddy (commit 670189d, branch `feature/auth-admin`)
**Type:** feature + architecture

## Context

The project needed a visual identity and a complete homepage before iterating on functional features (auth, catalog, cart). Without a design system in place, every new page would re-invent colors, spacing, and motion — leading to visual incoherence. We also needed the shared types layer to be rich enough to cover upcoming features (payments, websockets, admin) so that server and client could be built in parallel without breaking contracts.

## Decision

1. Built a full homepage with: Header, Hero bento layout, Flash Deals, Categories, Trending, New Arrivals, Promo Banner, Trust Signals, Footer — fully responsive with a dedicated `MobileTabBar`.
2. Introduced `DESIGN.md` at the repo root as the living source of truth for visual decisions (colors, typography, spacing, motion).
3. Adopted **Motion v12** for animations (stagger reveals, hover lifts, spring physics) instead of Framer Motion v11 or CSS-only transitions.
4. Created reusable primitives: `Badge`, `StarRating`, `ProductCard` (image + emoji fallback).
5. Extended `shared/src/types/` to cover:
   - Payment domain (Stripe-compatible types)
   - WebSocket events (Socket.io)
   - Extended auth types (`UserPreferences`, `SellerDashboard`, admin DTOs)
   - Extended product/order types (`ProductSummary`, `CategoryWithCount`, cart DTOs, coupon validation)
6. Stored real product images in `.design-assets/products/` (full-res) and `client/public/products/` (small variants) — 13 products with `-sm` thumbnails.

## Why

- **DESIGN.md as a contract:** every designer/dev iterating on UI references the same document. Prevents the typical "each page has its own button style" drift.
- **Motion v12 over alternatives:** v12's `LazyMotion` + bundle splitting reduces JS payload vs. Framer Motion v11; spring physics presets fit the design language (springy, tactile micro-interactions).
- **Shared types upfront:** by pre-declaring payment, websocket, admin, and seller types, server and client work can proceed in parallel without contract negotiations breaking subsequent commits.
- **Bento hero layout:** modern Amazon competitors (Marché.io style) use bento grids for visual richness on desktop while collapsing cleanly to mobile stacks.
- **Two image folders:** `.design-assets/` keeps the high-res originals out of the build (Git LFS-friendly), `client/public/` ships only the optimized `-sm` variants.

## Alternatives considered

- **Framer Motion v11** — rejected: heavier bundle, no `LazyMotion` improvements yet.
- **Pure CSS animations** — rejected: spring physics and orchestrated stagger reveals are painful in CSS; the design language relies on them.
- **Storing types per-package** (duplicating between server and client) — rejected: contract drift is the most common cause of MERN bugs.
- **Headless UI libraries (Radix, shadcn)** — deferred: we want the design language to be distinctive, not boilerplate. Primitives are written in-house, headless lib can be added later for complex interactions (combobox, dialog accessibility).

## Impact

- **New files:** `DESIGN.md`, `client/src/components/{Header,MobileTabBar,Badge,StarRating,ProductCard}.tsx`, all `shared/src/types/*.ts` extensions.
- **Modified:** `client/src/app/page.tsx` (full homepage), `client/src/app/layout.tsx`, `client/tailwind.config.ts`, `client/src/app/globals.css`.
- **Dependencies added:** `motion@12.x` in `client/package.json`.
- **Asset folders:** `.design-assets/products/` (13 products × 2 sizes, gitignored from production build), `client/public/products/` (13 small variants).

## Follow-ups

- Convert hero/bento elements into reusable components when a second page (PLP, PDP) needs the same patterns.
- Eventually move product data from hardcoded arrays in `page.tsx` to API-fetched `ProductSummary[]`.
- Consider Next.js Image component optimization once we hit Lighthouse budget thresholds.
