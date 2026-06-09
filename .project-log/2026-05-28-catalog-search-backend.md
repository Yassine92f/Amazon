# Catalog & Search — Backend + Pencil Designs (Section 2 kickoff)

**Date:** 2026-05-28
**Author:** Teddy (branch `feature/catalog-search`)
**Type:** feature + architecture

## Context

Section 2 of the project (Catalog & Search) follows the auth/admin foundation. The frontend ships of the entire product browsing experience plus the seller hub depend on a stable catalog API. This branch delivers:

1. The full backend (Seller, Category, Product, Search, Review browse) — coded directly.
2. The frontend screens designed in Pencil (`ecommerce.pen`) — to be reviewed before any React code is written.

The branch is built on top of `feature/auth-admin` (which has not yet been merged into `develop`) so the catalog domain can leverage `User`, `RBAC`, audit log, and shared types without conflict resolution detours.

## Decision

### Backend — Clean architecture (4 layers, every entity)

**Seller domain** (`/sellers/*`)

- `SellerEntity` — owns shopName/shopSlug, rating aggregates, isVerified, commissionRate
- `ISellerRepository` + Mongoose model
- `SellerUseCase` — `becomeSeller` upgrades a User → role SELLER and creates the profile; `getMyShop`, `updateMyShop`, `getPublicShop` (by slug), `listSellers`, admin `verifySeller`
- Routes: `POST /sellers/register`, `GET /sellers/me/shop`, `PUT /sellers/me/shop`, `GET /sellers/:slug`, `GET /sellers`, `PUT /sellers/:id/verify`

**Category domain** (`/categories/*`)

- `CategoryEntity` with optional `parentId` for hierarchy
- `CategoryUseCase` — list (flat), tree (nested), getBySlug, admin CRUD with slug auto-generation + parent validation + no-orphan delete
- Routes: `GET /categories`, `GET /categories/tree`, `GET /categories/:slug`, admin `POST/PUT/DELETE /categories/:id`

**Product domain** (`/products/*`)

- `ProductEntity` with embedded variants (price, stock, attributes), denormalized `minPrice`/`maxPrice`/`inStock` fields (recomputed via Mongoose `pre('save')` hook)
- `IProductRepository.search()` runs a single aggregation with `$facet` to return: items + total + category facets + brand facets + price range + rating distribution
- `ProductUseCase` — create/update/delete restricted to the seller-owner, `getBySlug` / `getById` enrich with seller name + category name, `search` enriches facets with category labels, `listMyProducts` filters by current seller's id
- Routes: `GET /products` (search), `GET /products/:slug`, `GET /products/by-id/:id`, seller `POST /products`, `PUT/DELETE /products/:id`, `GET /products/me/list`, `GET /products/me/:id`

**Search**

- Mongo full-text index over `name` (weight 10) + `brand` (5) + `tags` (3) + `description` (1) — single composite index named `product_text_index`
- Faceted filters: category[], price min/max, brand[], minRating, inStock, tags[], sellerId, isFeatured
- Sort options: relevance (uses `$meta: textScore` when there's a query), price asc/desc, rating, totalSold, createdAt
- One Mongo round-trip per request thanks to `$facet`

**Review browse** (`GET /products/:productId/reviews` — POST owned by cart-orders)

- `ReviewEntity` + Mongoose model with unique compound index `(userId, productId, orderId)`
- `IReviewRepository.findByProduct` + `getStats` (avg rating + per-star distribution)
- `ReviewBrowseUseCase.listForProduct` enriches reviews with author name (`firstName + lastName initial`) + avatar
- POST `/reviews` is deliberately absent — it requires `orderId` and ownership verification that lives in `feature/cart-orders`

### Frontend — Pencil designs only (no React code)

Per user direction, the frontend is **designed first, coded later**. The following screens were added to `ecommerce.pen`:

| Frame ID | Screen                | x,y position |
| -------- | --------------------- | ------------ |
| `4ZbQw`  | PLP / Category browse | 5800, 2050   |
| `csDCJ`  | Search Results        | 7350, 2050   |
| `mDCBZ`  | Seller Dashboard      | 8900, 2050   |
| `0TKHE`  | Seller Products List  | 10450, 2050  |
| `pf85q`  | Seller New Product    | 12000, 2050  |
| `wkk5L`  | Seller Edit Product   | 13550, 2050  |

Each reuses the existing design system components (`ProductCard`, `StarRating`, `Badge/*`, `Button/*`, `Input/*`) and respects the variables defined in the DS frame (`coJjr`).

Common patterns across screens:

- Top bar: logo, search, nav icons, avatar (60–72px) — Seller Hub variant adds a verified pill
- Seller Hub sub-nav: Dashboard / Products / Orders / Reviews / Settings
- Footer: dark brand-900 background with copyright + 4 links

### Quality

- 12 new Jest unit tests on `ProductUseCase` (32 total tests across the repo)
- TypeScript strict still clean (`pnpm build` passes)
- ESLint clean

## Why

- **Seller upgrade flow (User → role:SELLER)** instead of separate registration: a buyer who wants to sell shouldn't create a second account. The `becomeSeller` use case transactionally creates the profile and updates the role.
- **Embedded variants vs separate Variant collection**: variants are always read in the context of their parent product; never queried standalone. Embedded reads in one round-trip; embedded writes update product price aggregates via the `pre('save')` hook.
- **Denormalized `minPrice` / `maxPrice` / `inStock` on the product**: faceted price filtering on the cheapest variant of each product needs these as top-level fields. Recomputing them in code on every variant edit beats the alternative (computing across the variant array in every search query).
- **`$facet` for search + facets**: one aggregation returns items + total + 4 facet buckets. The alternative (sequential queries) is 5 round-trips and risks inconsistent results between queries on a busy collection.
- **Text index over `name+brand+tags+description`**: matches user search intent (brand and product name dominate); tags catch synonyms; description catches long-tail. Weights bias toward exact name matches.
- **Review browse here, post in cart-orders**: avoids a cyclic dependency between catalog and cart-orders. The Review entity exists here because the PDP needs to show reviews; the _guarded write path_ (must own an order containing the product) belongs to cart-orders.
- **Designs in Pencil before code**: catches UX mistakes for free (cheap to redraw, expensive to refactor React). The user reviews the screens, gives direction, then the code work proceeds with no ambiguity.

## Alternatives considered

- **Elasticsearch / MeiliSearch** — rejected. Mongo text search is "good enough" for the school-project scope; the extra infra and ops cost don't pay off. Tradeoffs (no typo tolerance, basic ranking) are acceptable. A swap stays cheap because the search lives behind `IProductRepository.search()`.
- **Reviews fully in catalog-search (incl. POST)** — rejected. POST needs an orderId and a "user has actually bought this" check; both belong to cart-orders. Splitting browse here / write there is the right boundary.
- **Seller upgrade as part of the auth-admin branch** — rejected. The `SellerProfile` type was declared early on auth-admin (commit 670189d) so the contract exists, but the implementation lives where products live, because they're the consumer.
- **Code the frontend in parallel with the backend** — rejected on user direction. Designs first means screens get a real review pass before they're worth refactoring.

## Impact

### New files (backend)

| File                                                                                   | Purpose                                       |
| -------------------------------------------------------------------------------------- | --------------------------------------------- |
| `server/src/domain/entities/{Seller,Category,Product,Review}.ts`                       | Domain entities                               |
| `server/src/domain/repositories/I{Seller,Category,Product,Review}Repository.ts`        | Repo interfaces                               |
| `server/src/infrastructure/database/models/{Seller,Category,Product,Review}.ts`        | Mongoose models                               |
| `server/src/infrastructure/repositories/{Seller,Category,Product,Review}Repository.ts` | Repo implementations                          |
| `server/src/application/use-cases/{Seller,Category,Product,ReviewBrowse}UseCase.ts`    | Use cases                                     |
| `server/src/application/utils/slugify.ts`                                              | Slug helper used by Seller, Category, Product |
| `server/src/interfaces/http/controllers/{Seller,Category,Product,Review}Controller.ts` | HTTP layer                                    |
| `server/src/interfaces/http/routes/{sellers,categories,products}.ts`                   | Route registries                              |
| `server/src/interfaces/http/schemas/{seller,category,product}Schemas.ts`               | Zod validation                                |
| `server/tests/catalog/productUseCase.test.ts`                                          | 12 unit tests                                 |

### Modified

- `server/src/interfaces/http/routes/index.ts` — registered `/sellers`, `/categories`, `/products`

### Design artifacts

- `ecommerce.pen` — 6 new top-level frames, all sharing the existing design system + variables. Reuses `ProductCard` component for PLP/search/product preview.

## Follow-ups

- **Frontend code** — once designs are validated, build the React pages (App Router routes `/c/[slug]`, `/search`, `/products/[slug]`, `/seller`, `/seller/products`, `/seller/products/new`, `/seller/products/[id]/edit`).
- **Inventory decrement on order** — when an order is placed in cart-orders, decrement `variant.stock`. Use case lives there but the data lives here.
- **Reindex when product changes** — Mongo text index is auto-maintained; no action needed for now.
- **Image upload pipeline** — current `images: string[]` accepts URLs only. Add a real upload endpoint (S3 / Cloudinary / local) before launch. Out of scope for this branch.
- **Search synonyms** — Mongo text search doesn't handle "headphones" vs "headphone" stem identically. If conversion data shows this matters, add Mongo's text index `weights` tuning + manual synonym dictionary.
- **Product page (`PFvlR`) refresh** — the existing PDP design from auth-admin commit `fb9cece` is functional but predates the catalog domain. Could be refreshed with reviews + seller card + related-products grid once catalog ships.
- **Audit log integration** — admin verifySeller is not yet audited. Should write an `AuditLog` entry like the existing admin endpoints.
- **Pagination cursor option** — for very deep pagination (page > 100), cursor-based pagination scales better than offset. Defer until needed.
