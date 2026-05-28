# Authentication System — JWT, RBAC, Login/Register

**Date:** 2026-04-13
**Author:** Yass (commit 47952da, branch `feature/auth-admin`)
**Type:** feature + architecture

## Context

The platform requires authenticated users with three distinct roles (`admin`, `seller`, `user`) before any business feature (cart, checkout, orders, seller dashboard) can be built. Sessions need to survive page reloads, support secure token rotation, and integrate cleanly with the clean/hexagonal backend architecture defined in `CLAUDE.md`.

## Decision

Implemented end-to-end auth with strict clean architecture layering:

**Backend** (`server/`):

- **Domain layer:** `User` entity, `IUserRepository`, `IHashService`, `ITokenService` — pure TS, zero framework dependencies.
- **Application layer:** `AuthUseCase` exposing `register`, `login`, `refresh`, `logout`, `changePassword`, `getMe`. Receives `AuthDtos` for input/output.
- **Infrastructure layer:** Mongoose `User` model, `UserRepository`, `HashService` (bcrypt, cost 10), `TokenService` (JWT + Redis blacklist for revoked tokens).
- **Interfaces layer:** `authenticate` middleware (parses Bearer token, attaches user), `authorize(...roles)` middleware for RBAC, `AuthController` + routes.

**Token strategy:**

- Access token: 15 min TTL, sent via `Authorization: Bearer <token>` header.
- Refresh token: 7 days, **rotated on every use** (old token blacklisted in Redis), longer-lived storage.
- Revocation: logout adds JTI to Redis blacklist with TTL matching token expiry.

**Frontend** (`client/`):

- **Login & register pages** styled with the Marché.io design system from the homepage commit.
- **AuthProvider** wraps the app — calls `init()` on mount to restore session from refresh token.
- **ProtectedRoute** component supporting RBAC via `requiredRole` prop.
- **Zustand store** (`client/src/store/index.ts`) — actions: `login`, `register`, `logout`, `init`, `changePassword`. Persists state appropriately.
- **API client** (`client/src/lib/api.ts`) — Axios with interceptors that auto-refresh on 401 and retry the original request.

**API surface:**

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
PUT  /auth/change-password
```

## Why

- **Hexagonal layering for auth** — auth is the canonical example of a use case that touches every layer: HTTP, persistence, crypto, caching. Doing it "the right way" first sets the pattern for every future feature (cart, orders, seller, admin).
- **Refresh token rotation** — single-use refresh tokens with rotation defeat replay attacks. If a refresh token is stolen, the legitimate user's next refresh invalidates the attacker's copy.
- **Redis blacklist** — JWTs are stateless by design, which makes revocation hard. A short-lived blacklist keyed on JTI gives us logout-on-demand without giving up the perf benefit of stateless verification.
- **15 min access token + 7 day refresh** — industry-standard balance: short access window limits exposure if leaked, long refresh window keeps users logged in across sessions without re-auth pain.
- **Zustand over Redux/Context** — auth state is small and read by many components; Zustand gives us subscription-based reactivity without provider boilerplate.
- **Centralized Axios interceptor** — the alternative (per-call refresh logic in every component) is unmaintainable. Interceptor handles 401 → refresh → retry transparently.

## Alternatives considered

- **Session cookies (server-side sessions)** — rejected: doesn't scale across multiple server instances without sticky sessions, and adds complexity for the mobile/native clients we may build later.
- **OAuth/social login as primary** — deferred: in-house email/password is simpler for the MVP; OAuth can be added as an additional provider via Passport later.
- **Single long-lived JWT** — rejected: no revocation story, and stolen tokens are valid until expiry.
- **NextAuth.js** — rejected: opinionated, ties auth to Next.js, and our backend is the source of truth (we need server-issued tokens to work with future native clients).
- **In-memory blacklist** — rejected: doesn't survive server restarts; loses revocations on deploys.

## Impact

- **New files:**
  - `server/src/domain/{entities/User.ts, repositories/IUserRepository.ts, services/IHashService.ts, services/ITokenService.ts}`
  - `server/src/application/{dtos/AuthDtos.ts, use-cases/AuthUseCase.ts}`
  - `server/src/infrastructure/{database/models/User.ts, repositories/UserRepository.ts, services/HashService.ts, services/TokenService.ts}`
  - `server/src/interfaces/http/{controllers/AuthController.ts, middlewares/auth.ts, routes/auth.ts}`
  - `client/src/app/{login,register}/page.tsx`
  - `client/src/components/{AuthProvider.tsx, ProtectedRoute.tsx}`
- **Modified:**
  - `server/src/interfaces/http/routes/index.ts` — registered auth routes
  - `server/src/config/index.ts` — JWT secrets, TTLs
  - `client/src/store/index.ts` — auth store from 0 → 78 lines
  - `client/src/app/layout.tsx` — wraps app with `AuthProvider`
  - `client/src/lib/api.ts` — port updated to 5001
- **Infrastructure dependency:** Redis required (for blacklist) — already provisioned via `docker-compose.dev.yml`.

## Follow-ups

- Add password complexity rules and rate-limiting on `/auth/login` (brute-force protection).
- Add email verification flow (token email on register, `emailVerified` flag).
- Add forgot-password flow → **done** in [2026-04-13-auth-admin-completion](2026-04-13-auth-admin-completion.md).
- Consider 2FA (TOTP) for admin/seller roles.
- Audit Redis TTLs to ensure blacklist entries never outlive token expiry.
