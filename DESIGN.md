# Design — E-Commerce Platform

## Vision & Identity

A warm, inviting general marketplace — like browsing a vibrant indoor market, not a sterile warehouse. Playful without being childish. Rounded, warm, orange-tinted. The design should feel trustworthy and energetic, like a marketplace that's alive with activity. Think Amazon's density meets a modern warm aesthetic.

**Anti-reference:** Generic dropshipping sites, Temu's visual noise, AI-generated gradient blob backgrounds, neon glow effects. We are NOT a discount bazaar — we're a curated marketplace with personality.

**Anchors:** Amazon's information density and UX patterns. Shopify's visual polish. Vinted's warm playfulness (minus the peer-to-peer scrappiness).

## Color Palette

```css
:root {
  /* Brand */
  --color-brand-50: #fff7ed;
  --color-brand-100: #ffedd5;
  --color-brand-200: #fddcab;
  --color-brand-300: #ffc478;
  --color-brand-400: #ffa43c;
  --color-brand-500: #f07d1a; /* Primary orange */
  --color-brand-600: #d66a10;
  --color-brand-700: #b3520d;
  --color-brand-800: #8c3f0a;
  --color-brand-900: #6b3008;

  /* Gold accent */
  --color-gold-300: #ffd666;
  --color-gold-400: #ffc21a;
  --color-gold-500: #e5a800;

  /* Surfaces */
  --color-bg: #fffaf3;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;

  /* Text */
  --color-text: #1f1710;
  --color-text-muted: #7a6e62;
  --color-text-inverse: #ffffff;

  /* Borders */
  --color-border: #ede5da;
  --color-border-strong: #d4c9bb;

  /* Semantic */
  --color-success: #2d9f5f;
  --color-warning: #e5a800;
  --color-error: #dc3545;
  --color-info: #3b82f6;

  /* Star ratings */
  --color-star: #f59e0b;
}
```

## Typography

**Font:** Plus Jakarta Sans (Google Fonts) — geometric, slightly rounded terminals, modern without being childish.

```css
:root {
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 2rem; /* 32px */
  --text-4xl: 2.5rem; /* 40px */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
}
```

## Layout & Spacing

Base unit: 4px. Border-radius: 12px default for cards, 8px for buttons, 999px for pills/badges.

```css
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 999px;
  --shadow-sm: 0 1px 3px rgba(31, 23, 16, 0.06);
  --shadow-md: 0 4px 12px rgba(31, 23, 16, 0.08);
  --shadow-lg: 0 8px 24px rgba(31, 23, 16, 0.1);
  --max-width: 1280px;
}
```

## Component Patterns

| Component     | Pattern                                 | Notes                                                                                |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| ProductCard   | Image + info stack + hover add-to-cart  | 12px radius, shadow-sm, Motion whileHover lift, badge top-left, emoji scale on hover |
| Header        | Announcement bar + nav + search + pills | Pill search bar, "A" logo box + "Abracadabra" wordmark, cart with count badge        |
| CategoryBar   | Horizontal scroll pills                 | Icon + label, brand-500 filled active state, border pills inactive                   |
| HeroBanner    | Gradient card + 2 side cards (bento)    | Warm brand gradient, side cards on lg only, staggered fade-up entrance               |
| PriceDisplay  | Current + strikethrough                 | Brand-600 for sale price, text-muted strikethrough                                   |
| Badge         | Pill shape, bold, Motion spring scale   | radius-full, variant-based colors (sale/new/hot/instock/outofstock/category)         |
| StarRating    | Filled/empty stars                      | amber-400 fill, inline with review count                                             |
| MobileTabBar  | Fixed bottom pill nav, 5 tabs           | Motion slide-up entrance, brand-500 active tab, md:hidden                            |
| TrustSignals  | Icon box + text, 2x2→4 grid             | brand-50 icon bg, bordered card                                                      |
| PromoBanner   | Full-bleed gradient, CTA                | brand-800→500 gradient, Motion scale button                                          |
| Footer        | Dark bg (brand-900), 5 columns          | Logo, Shop, Support, Company, Legal + copyright                                      |
| SectionHeader | Title with accent bar + optional action | Reusable across all product sections                                                 |

## Design Decisions

- **2026-03-27**: Playful + warm orange/gold palette, light mode only. Plus Jakarta Sans for typography. Rounded but restrained (12px, not 24px). Marketplace UX inspired by Amazon/AliExpress density.
- **2026-03-27**: Emoji as placeholder product images — playful, zero-dependency, avoids stock photo uncanny valley. Replace with real images when available.
- **2026-03-27**: No dark mode for v1 — ship light mode, revisit later if needed.
- **2026-03-27**: Brand name "Marché.io" with M logo box. Footer uses dark brand-900 bg for contrast.
- **2026-05-28**: Brand renamed to "Abracadabra" (logo "A"). Single-word wordmark, no `.io` suffix.
- **2026-05-28**: Single-locale **French** UI via a lightweight typed dictionary (`client/src/lib/i18n.ts`) — no English/French mixing. Prices follow French convention (`279,00 €`) through `Intl.NumberFormat`.
- **2026-05-28**: Product imagery uses `object-cover` on the warm `--color-bg` surface (catalog cards + product detail) instead of padded `object-contain`, to fill the frame and kill empty white borders.
- **2026-05-28**: Storefront (public shop) banner pattern — layered brand gradient with a radial highlight + oversized monogram motif and a bottom fade into the page background (or a scrimmed banner image), with an overlapping identity card and a stat strip. Avoids the flat "hard bar" look.
- **2026-05-28**: `SectionHeader` renders full-width; the action link is pinned right with `ml-auto` and an optional `extra` slot holds inline content (e.g. the Flash Deals countdown) between title and action.
- **2026-05-31**: Product detail page reworked to match the Pencil `ProductPage` mockup — sticky gallery (left) + buy box (right), price with compare-at + savings badge, quantity stepper, three-up reassurance strip (livraison/retours/paiement), seller card, zebra **Caractéristiques** table, and a "Vous aimerez aussi" related grid (same-category).
- **2026-05-31**: **Multi-axis variant selector.** Option dimensions are derived dynamically from each variant's `attributes` map, so a product exposes any combination of axes (couleur, stockage, taille, bracelet, région…). The `color` axis renders circular swatches (dual colourways as a split gradient); other axes render labelled chips. Choosing a value resolves the matching variant while preserving the other axes when possible, and unavailable combinations are dimmed. Stock ≤ 5 surfaces a low-stock urgency line.
- **2026-05-31**: **Shops directory** (`/sellers`) — paginated grid of shop cards (gradient banner + overlapping avatar, rating, sales, verified badge), debounced search and a "verified only" toggle, backed by the existing `GET /sellers` endpoint via a new `listSellers()` client. Footer "Vendeurs" and a new header pill link here.
- **2026-05-31**: **Header category nav is now functional** — pills are real `/c/[slug]` links mapped to the seeded catalog categories (electronics, phones, audio, computers, wearables, gaming, fashion, home, sports, books, beauty, toys), replacing decorative buttons that pointed nowhere and listed non-existent categories. A leading orange "🏪 Boutiques" pill opens the directory.
- **2026-05-31**: **Public shop page** gains product sort (Meilleures ventes / Nouveautés / Prix / Mieux notés) and pagination (12/page) instead of a flat first-20 list.
- **2026-05-31**: Full French i18n pass over the **seller hub** (dashboard, product list, product form, settings) and the **admin** chrome (sidebar, role/status enums, filters). Reusable `t.roles` / `t.userStatus` enum→label maps. Admin logo corrected from "M" to the "A" wordmark for brand consistency.
- **2026-05-31**: **Product comparison.** A persisted compare store (max 4) drives a `CompareButton` on catalog cards (reveals on hover, stays lit when active), a floating `CompareBar` tray (above the mobile tab bar), and a `/compare` table that highlights the best price / best rating and surfaces per-variant attributes side by side.
- **2026-05-31**: **Seller reviews hub** (`/seller/reviews`) — Tous / Sans-réponse filter, inline reply form, replied state shown in a brand-tinted quote block. **Admin product moderation** (`/admin/products`) — full-width table across all sellers/statuses with hide (EyeOff) / show (Eye) / delete actions, hidden rows tinted red.
- **2026-05-31**: **Iconography — Lucide over emojis.** Added `lucide-react` and replaced decorative/functional emojis across the app with stroked Lucide icons: header category pills + nav (Cpu, Smartphone, Headphones, Laptop, Watch, Gamepad2, Shirt, House, Dumbbell, BookOpen, Sparkles, ToyBrick, Store, Zap), homepage trust/section/hero/promo (Truck, ShieldCheck, RefreshCw, MessagesSquare, ShoppingBag, Headphones, Footprints, Gift, Flame, Sparkles, Globe), seller hub (Store, TrendingUp, Calendar, Package, Plus, ExternalLink, SquarePen, Trash2, X, ArrowLeft, BadgeCheck), placeholders (Package, Store, SearchX), password rules (Check/Circle) and the cart CTA (ShoppingCart). `StarRating` now renders Lucide `Star`/`StarHalf` (amber fill) instead of ★/☆ glyphs. Icons inside translated copy were moved out of the dictionary strings and rendered in JSX so `t.*` stays text-only. Convention: stroked Lucide icons sized in `rem` (h-4/h-5 inline, larger for placeholders), `aria-hidden` when decorative, brand-500/600 tint.
- **2026-03-27**: Motion library (v12+) for all animations. Spring physics: snappy (buttons), smooth (cards), gentle (sections), bouncy (playful). Staggered fade-up for product grids via whileInView. Mobile tab bar slides up with delay.
- **2026-03-27**: Hero section uses bento layout — main gradient banner + 2 side promotional cards (lg only). Category section uses gradient tiles instead of plain bordered cards.

## Anti-Patterns

- No gradient mesh blobs or floating glassmorphism cards
- No purple-to-cyan gradients (dead AI giveaway)
- No neon glow effects
- No generic "Welcome to our store" hero — always show real deals/products
- No identical 3-card rows with placeholder text
- No Comic Sans, Fredoka, or childish bubble fonts
- No rainbow color vomit — orange/gold + neutrals, that's it
- No stock photo models with fake smiles
- No "MEGA SALE 99% OFF" screaming banners — we're not Temu
- No decorative illustrations that add zero information

## Motion & Animation

Spring presets used across the app. All animations respect `prefers-reduced-motion`.

| Element         | Animation                                    | Spring Preset   |
| --------------- | -------------------------------------------- | --------------- |
| Page entrance   | Stagger fade-up (opacity + y + blur)         | smooth (300/30) |
| Product cards   | whileHover lift (-4px) + shadow-lg           | smooth (300/30) |
| Product emoji   | whileHover scale(1.1) + rotate(3deg)         | bouncy (400/15) |
| CTA buttons     | whileHover scale(1.03), whileTap scale(0.97) | bouncy (400/15) |
| Cart button     | whileTap scale(0.92)                         | snappy (500/30) |
| Badge           | initial scale(0.8) → scale(1)                | snappy (500/30) |
| Mobile tab bar  | initial y(80) → y(0), delay 0.5s             | smooth (300/30) |
| Promo banner    | whileInView fade-up                          | gentle (200/25) |
| Category tiles  | whileHover lift (-4px) + shadow              | smooth (300/30) |
| Section reveals | whileInView stagger + fade-up, once          | smooth (300/30) |

## Visual References

- **Amazon** — information density, search-centric header, category depth, "also bought" patterns
- **Shopify Themes (Dawn)** — clean product cards, typography hierarchy, whitespace confidence
- **Vinted** — warm palette, rounded UI, playful-but-mature tone
- **Stripe** — card elevation model (borders inline, shadows floating), spacing discipline

## Commerce & Checkout (cart, orders, payment, wishlist)

Added with `feature/cart-orders`. The whole purchase funnel follows the warm,
Stripe-inspired card model (inline borders, floating shadows, rounded-2xl panels).

**Cart is guest-first.** A logged-out shopper can add, view and edit the cart
(tracked by the backend's httpOnly `cartId` cookie). Authentication is required
only to **proceed to payment** — clicking checkout while logged out routes to
`/login?redirect=/checkout`. The cart store is server-backed (single source of
truth); on login the guest cart is merged into the user's.

**Surfaces**

| Screen / component        | Notes                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Header cart + wishlist    | Always visible (guests included); live count badges (snappy spring).                                                            |
| `CartDrawer` (slide-over) | Right slide-in (spring 380/38), free-shipping progress bar, line steppers.                                                      |
| `/cart`                   | Two-column: line items + sticky summary card with free-shipping nudge.                                                          |
| `/checkout`               | `ProtectedRoute`. Steps: address (radio cards + inline add) → delivery → coupon → Stripe Payment Element. Sticky order summary. |
| `PaymentForm`             | Stripe Payment Element, `redirect: 'if_required'`, brand-tinted appearance (`colorPrimary #f07d1a`). Test-card hint.            |
| `/orders`, `/orders/[id]` | History cards + detail with a 4-step status timeline; success banner polls the webhook.                                         |
| `StatusBadge`             | Shared order-status pill (tinted bg + dot), reused buyer + seller side.                                                         |
| `/wishlist`               | Product grid; heart toggle; add-to-cart resolves the cheapest in-stock variant.                                                 |
| `/seller/orders`          | Seller's orders narrowed to their own line items + `sellerSubtotal`; forward status transitions; filter pills.                  |

**Patterns**

- Empty states: centered icon-in-circle (`bg-brand-50`), bold title + muted line + a single brand CTA. Reused across cart, orders, wishlist, seller orders.
- Trust cues: `ShieldCheck` + "Paiement sécurisé par Stripe" under every pay/checkout CTA.
- Order summary card is the recurring right-rail element (cart, checkout) — subtotal / shipping / discount / total with a hairline divider before the total.
- Status colors: pending=amber, confirmed=blue, processing=indigo, shipped=sky, delivered=green, cancelled=red, refunded=gray.
