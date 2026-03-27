# E-Commerce Platform

Advanced e-commerce platform (Amazon-like) — MERN + Next.js 15, TypeScript, pnpm monorepo.

## Tech Stack

**Frontend:** Next.js 15, React 19, Tailwind CSS, Zustand
**Backend:** Express.js, TypeScript, clean/hexagonal architecture
**Database:** MongoDB, Redis
**Infra:** Docker, GitHub Actions CI/CD, Stripe sandbox, Socket.IO

## Getting Started

**Prerequisites:** Node.js >= 20, pnpm >= 9, Docker

```bash
git clone <repo-url>
cd ecommerce-platform
cp .env.example .env          # fill in values
pnpm install
docker compose -f docker-compose.dev.yml up -d   # MongoDB + Redis
pnpm dev                                          # Server :5000 + Client :3000
```

Health check: `GET http://localhost:5000/api/health`

## Project Structure

```
shared/     → TypeScript API contracts (@ecommerce/shared)
server/     → Express backend — clean architecture (domain/application/infrastructure/interfaces)
client/     → Next.js 15 frontend (App Router)
```

## Scripts

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `pnpm dev`    | Run server + client                  |
| `pnpm build`  | Build all (shared → server → client) |
| `pnpm lint`   | Lint all workspaces                  |
| `pnpm format` | Format with Prettier                 |
| `pnpm test`   | Run tests                            |

## Docker

```bash
docker compose -f docker-compose.dev.yml up -d   # Dev: MongoDB + Redis only
docker compose up -d                              # Full stack
```

## Branch Strategy

```
main → develop → feature/<section>
```

| Branch                     | Section                      |
| -------------------------- | ---------------------------- |
| `feature/auth-admin`       | Auth & Admin (JWT, RBAC)     |
| `feature/catalog-search`   | Catalog & Search             |
| `feature/cart-orders`      | Cart, Orders & Payment       |
| `feature/infra-transverse` | Infra & Transversal features |

**Rules:** PR required to merge into `develop`. Rebase every 2 days. Changes to `/shared` types require team notification.

## License

MIT
