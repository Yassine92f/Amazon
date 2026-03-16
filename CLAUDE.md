# CLAUDE.md — Project Context for Claude Code

## Project Overview

Advanced e-commerce platform (Amazon-like) built as a MERN + Next.js 15 monorepo with TypeScript everywhere.

## Monorepo Structure

```
projet-ecommerce/
  shared/        → TypeScript API contracts (@ecommerce/shared)
  server/        → Express.js backend (@ecommerce/server)
  client/        → Next.js 15 frontend (@ecommerce/client)
```

**Package manager: pnpm** (NOT npm, NOT yarn). Always use `pnpm` commands and `workspace:*` protocol for internal dependencies.

## Key Commands

| Command                                          | Description                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| `pnpm dev`                                       | Run both server and client in dev mode                  |
| `pnpm build`                                     | Build all packages (shared first, then server + client) |
| `pnpm lint`                                      | Lint all packages                                       |
| `pnpm format`                                    | Format all packages                                     |
| `pnpm test`                                      | Run tests (Jest, server-side)                           |
| `docker compose -f docker-compose.dev.yml up -d` | Start MongoDB + Redis containers                        |

## Backend Architecture — Clean / Hexagonal

```
server/src/
  domain/          → Business entities, repository interfaces, domain services
  application/     → Use cases, DTOs (orchestrates domain layer)
  infrastructure/  → Mongoose models, Redis, repository implementations, external services
  interfaces/      → Express controllers, routes, middlewares, WebSocket handlers
  config/          → App configuration
```

### Dependency Rules (STRICT)

- **Domain layer** has ZERO external dependencies — no Mongoose, no Express, no Redis, no third-party libraries. Pure TypeScript only.
- **Application layer** depends only on domain. No framework imports.
- **Infrastructure layer** implements domain interfaces (repositories, services). This is where Mongoose, Redis, and external SDKs live.
- **Interfaces layer** handles HTTP/WebSocket concerns and calls application use cases. Express controllers and middlewares live here.
- **Dependency injection flow:** infrastructure -> application -> domain (outer layers depend on inner layers, never the reverse).

### When Adding a New Feature (Backend)

1. Define entities and repository interfaces in `domain/`
2. Create use case(s) in `application/` that depend on domain interfaces
3. Implement repository in `infrastructure/` using Mongoose/Redis
4. Create controller + routes in `interfaces/http/`
5. Wire everything together via dependency injection

## Frontend Architecture

- **Next.js 15 with App Router** (NOT Pages Router)
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** client with JWT interceptors in `client/src/lib/api.ts`
- Shared types imported from `@ecommerce/shared`

## TypeScript Conventions

- Strict mode enabled in all packages
- All API contracts defined in `shared/src/types/`
- Use enums from shared types (`UserRole`, `OrderStatus`, etc.)
- **No `any`** — use proper typing. Prefer `unknown` when the type is truly unknown.
- When modifying shared types, be aware this affects both server and client.

## API Conventions

- All routes prefixed with `/api`
- Standard success response format:
  ```ts
  { success: boolean; data?: T; message?: string; errors?: Record<string, string[]> }
  ```
- Paginated response format:
  ```ts
  { items: T[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
  ```
- Error handling via `AppError` class in `server/src/interfaces/http/middlewares/errorHandler.ts`

## Authentication & Authorization

- JWT-based: access token (15 min TTL) + refresh token (7 days, rotated on use)
- Access token sent in header: `Authorization: Bearer <token>`
- RBAC with 3 roles: `admin`, `seller`, `user`
- Auth middleware validates token and attaches user object to the request
- Refresh token rotation: each refresh invalidates the previous token

## Database

- **MongoDB** via Mongoose — connection in `server/src/infrastructure/database/connection.ts`
- **Redis** via ioredis — client in `server/src/infrastructure/cache/redis.ts`
- Used for caching and session management
- Dev containers managed by `docker-compose.dev.yml`

## Testing

- **Jest** for server-side tests
- Test files located in `server/tests/`
- Run with `pnpm test`

## Git Conventions

- **Branching model:** `main` -> `develop` -> `feature/<section-name>`
- **Commit format:** `type: description` where type is one of: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`
- Pull request required to merge into `develop`
- Pre-commit hooks enforced via Husky + lint-staged (ESLint + Prettier)

## Environment Variables

- `.env.example` contains all required variables — copy to `.env` and fill in values
- **Never commit `.env` files**

## Critical Files (Modify with Care)

| File                                                     | Purpose                                     |
| -------------------------------------------------------- | ------------------------------------------- |
| `shared/src/types/*.ts`                                  | API contracts — changes affect all packages |
| `server/src/interfaces/http/routes/index.ts`             | Route registry                              |
| `server/src/config/index.ts`                             | Centralized server configuration            |
| `server/src/interfaces/http/middlewares/errorHandler.ts` | Global error handling with `AppError`       |
| `client/src/lib/api.ts`                                  | Axios client with auth interceptors         |
| `client/src/store/index.ts`                              | Zustand auth store                          |
