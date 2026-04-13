# Replace emojis with Lucide icons across the client

**Date:** 2026-05-31
**Author:** feature/catalog-search
**Type:** decision

## Context

The UI leaned on emojis for category pills, section headers, trust signals,
empty-states, seller-hub stat cards, row actions and password-strength hints.
Emojis render inconsistently across platforms/fonts, can't be recoloured to the
brand palette, don't scale crisply, and read as "AI-generated placeholder" — at
odds with the production-grade direction in `DESIGN.md`. The brand also already
uses clean stroked SVGs in several places (filters, ratings), so the emojis were
a visual inconsistency.

## Decision

Adopted **`lucide-react`** as the single icon library and swept the client,
replacing every emoji (and the ✓/○/↗/✎/🗑/× dingbats acting as icons) with
Lucide components. Key mappings:

- **Header**: category pills → per-category icons (Cpu, Smartphone, Headphones,
  Laptop, Watch, Gamepad2, Shirt, House, Dumbbell, BookOpen, Sparkles,
  ToyBrick); announcement ⚡ → Zap; Boutiques pill 🏪 → Store.
- **Homepage**: trust signals (Truck, ShieldCheck, RefreshCw, MessagesSquare);
  section headers gained an optional `Icon` prop (Zap/Flame/Sparkles); hero
  watermark 🛍️ → ShoppingBag, side cards 🎧/👟 → Headphones/Footprints; promo
  🎁 → Gift; category grid maps slug → icon; footer flag 🇫🇷 → Globe.
- **Seller hub**: shop avatar 🎧 → Store; StatCard `icon: string` → `Icon:
LucideIcon` (TrendingUp/Calendar/ShoppingBag/Package); row actions ↗/✎/🗑 →
  ExternalLink/SquarePen/Trash2; `+` buttons → Plus; `×` chips → X; `←` back →
  ArrowLeft; verified ✓ → BadgeCheck.
- **Placeholders/empties**: product/card 📦 → Package, shop 🏪 → Store, catalog
  🔍 → SearchX.
- **StarRating**: ★/☆ glyphs → Lucide `Star` + `StarHalf` with amber fill.
- **Password rules** (profile, reset-password): ✓/○ → Check/Circle.
- **Product CTA**: hand-rolled cart SVG → Lucide `ShoppingCart`.

Emojis that lived **inside** i18n strings (`'⚡ Ventes flash'`, `'🔥 …'`,
`'✨ …'`, `'🇫🇷 Français'`, `'📦 Gérer…'`, `'⭐ …'`, the leading `+`/`←`) were
stripped from the dictionary and the icon rendered in JSX, keeping `t.*`
text-only and locale-clean.

## Why

- One coherent, brand-tintable, crisp icon system instead of platform-dependent
  emoji glyphs.
- Keeping icons out of translation strings preserves the single-responsibility
  of the i18n layer (text only) and avoids re-stripping emojis per future locale.
- `StarRating` as real vector stars (with a true half-star) looks sharper and
  matches the SVG stars already used in reviews/filters.

## Alternatives considered

- **react-icons / heroicons**: Lucide has the broadest, most consistent stroked
  set, tree-shakes per-icon, and ships its own types. Chosen over heroicons
  (smaller set) and react-icons (mixed styles).
- **Keeping ★ in the "X★ et plus" filter label**: left as-is. It's a typographic
  star inside a plain-text chip label (not composable JSX without restructuring
  the chip), reads as a standard rating convention, and isn't an emoji.
- **An emoji font / Twemoji**: rejected — still pictographic, not brand-tintable,
  extra payload.

## Impact

- Added dependency `lucide-react@^1.17.0` (latest; React 19 peer-supported).
- Touched: `components/Header.tsx`, `components/StarRating.tsx`,
  `app/page.tsx`, `components/catalog/{CatalogShell,CatalogProductCard}.tsx`,
  `app/products/[slug]/page.tsx`, `app/sellers/page.tsx`,
  `app/sellers/[slug]/page.tsx`, all `app/seller/**`,
  `components/seller/ProductForm.tsx`, `app/profile/page.tsx`,
  `app/reset-password/page.tsx`, and `lib/i18n.ts` (emoji-free strings).
- `tsc --noEmit` + `next lint` clean (only pre-existing `<img>` warnings).
  Verified in-browser: homepage (nav, section, hero, footer icons), product
  page (Lucide StarRating + ShoppingCart CTA) render correctly.

## Follow-ups

- The single remaining ★ in `t.catalog.ratingAndUp` could become an inline icon
  if the active-filter chip is refactored to accept JSX.
- Consider a thin `<Icon>` wrapper or size tokens if icon sizing proliferates.
