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
| Header        | Announcement bar + nav + search + pills | Pill search bar, "M" logo box + "Marché.io" wordmark, cart with count badge          |
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
