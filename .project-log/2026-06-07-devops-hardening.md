# DevOps hardening and production readiness

**Date:** 2026-06-07
**Author:** feature/devops-hardening
**Type:** architecture

## Context

The application was feature-complete but had only ever run in development mode:
secrets fell back to hard-coded defaults, logs were unstructured `console.log`
lines, the process did not shut down cleanly, every catalog read hit MongoDB,
the refresh token was stored in `localStorage` (readable by any XSS payload),
and the Docker images shipped the entire monorepo plus dev dependencies. None of
this is acceptable for a graded "professional" deliverable or for a real deploy.
This branch closes the gap between "it works on my machine" and "it can be
deployed and operated". It groups five related production-readiness concerns.

## Decision

### 1. Fail-fast configuration validation

Added `validateConfig()` (called once from the boot path, not on import so tests
stay unaffected). In **production** it throws — aborting the boot — if a JWT
secret is still the built-in default, if the two JWT secrets are equal, if
`JWT_SECRET` is shorter than 32 chars, or if `STRIPE_SECRET_KEY`/`MONGODB_URI`
are missing. In development the same issues print a warning instead.

### 2. Structured logging + graceful shutdown

Replaced `morgan` and scattered `console.*` with a single **pino** logger
(`pino-http` for request logs). Pretty-printed in dev, **newline-delimited JSON**
in production (directly ingestible by Loki/CloudWatch/Datadog), silent in tests.
Authorization headers, cookies and password/token fields are redacted. Rewrote
`server.ts` to keep the `http.Server` handle and handle `SIGTERM`/`SIGINT`: it
stops accepting connections, drains in-flight requests, closes Mongo and Redis,
then exits — with a 10s hard-timeout failsafe. Added `GET /api/health` for
container liveness probes.

### 3. Redis caching for catalog reads

Added a `cacheResponse(namespace, ttl)` middleware that stores successful JSON
GET responses in Redis keyed by full URL, plus `invalidateNamespace()` called
from the product/category write paths. Products cache for 60s, categories for
300s. The middleware **degrades gracefully**: any Redis error (or no Redis at
all) silently bypasses the cache rather than failing the request.

### 4. Refresh token in an httpOnly cookie

The server now sets the refresh token as an `httpOnly`, `SameSite=Strict`,
`Path=/api/auth`, `secure`-in-prod cookie on register/login/refresh, reads it
from the cookie (falling back to the request body for legacy clients), and
clears it on logout. The client stopped persisting the refresh token in
`localStorage` (only the short-lived access token remains in JS) and calls
`/auth/refresh` with credentials so the cookie is sent automatically.

### 5. Production Docker images + compose

Rewrote both Dockerfiles as multi-stage builds: the **server** uses
`pnpm deploy --prod` to ship only pruned runtime dependencies (185 MB), the
**client** uses Next.js `output: 'standalone'` to ship only traced files
(198 MB). Both run as a non-root user with a `HEALTHCHECK`. Added
`docker-compose.prod.yml` (Mongo auth, healthcheck-gated `depends_on`,
`init: true` for signal forwarding, required-secret interpolation), a root
`.dockerignore`, and pinned `packageManager: pnpm@10.28.2`.

## Why

- **Fail-fast** turns a silent, catastrophic misconfiguration (running prod with
  a publicly-known signing key — anyone could forge tokens) into a loud boot
  failure, while keeping local dev frictionless.
- **Structured JSON logs** are queryable/alertable in aggregation tools;
  `console.log` is not. **Graceful shutdown** prevents dropped requests and
  corrupted connections during the rolling deploys an orchestrator performs.
- **Caching** removes repeated identical DB queries from the hottest, most
  read-heavy endpoints (search, product, categories) with a tiny TTL, so the
  staleness window is negligible while load on Mongo drops sharply. Graceful
  degradation means caching is a pure optimization, never a new failure mode.
- **httpOnly cookie** is the standard defense for the most sensitive credential:
  a token in `localStorage` is exfiltrated by any successful XSS, whereas an
  httpOnly cookie is unreadable from JS. `SameSite=Strict` + a narrow path also
  mitigate CSRF and limit where the cookie is sent.
- **Small, non-root, health-checked images** build faster, have a smaller attack
  surface, start behind readiness gates, and are what any real platform expects.

## Alternatives considered

- **Throw inside `config` on import** — rejected: it would break the test suite
  and any tooling that imports config; validation belongs on the boot path.
- **Winston instead of pino** — rejected: pino is faster and JSON-first; the
  pretty transport covers the dev ergonomics Winston is usually chosen for.
- **In-memory LRU cache** — rejected: does not survive restarts and is not
  shared across multiple server instances; Redis is already provisioned.
- **Caching in the use-case/application layer** — rejected: would drag Redis and
  HTTP concerns into the framework-free application layer, violating the clean
  architecture rules; caching lives in the interfaces layer as middleware.
- **Keeping the refresh token in `localStorage`** — rejected on security grounds
  (XSS exfiltration). **Access token in a cookie too** — rejected: it is
  short-lived and needs to be attached as a bearer header on every API call.
- **Copying full `node_modules` into the runtime image (previous Dockerfile)** —
  rejected: ships dev dependencies and bloats the image; `pnpm deploy --prod`
  and Next standalone are the purpose-built solutions.

## Impact

- **New:** `server/src/infrastructure/logging/logger.ts`,
  `server/src/interfaces/http/middlewares/cache.ts`, `docker-compose.prod.yml`,
  `.dockerignore`.
- **Changed (server):** `config/index.ts` (+`validateConfig`), `server.ts`
  (graceful shutdown), `app.ts` (pino-http, `/api/health`),
  `database/connection.ts` + `cache/redis.ts` (logger + close helpers),
  `AuthController.ts` + `authSchemas.ts` (cookie), `ProductController.ts` /
  `CategoryController.ts` + their routes (cache), Dockerfile.
- **Changed (client):** `lib/api.ts` + `store/index.ts` (cookie-based refresh),
  `next.config.ts` (`output: standalone`), Dockerfile.
- **Changed (root):** `package.json` (`packageManager`), `docker-compose.yml`
  (port fix 5000→5001, client build args, `init`).
- **Verified:** server `tsc` clean, lint clean, 69 unit tests green; both images
  build and run; the server container logs JSON, serves `/api/health`, and shuts
  down gracefully on `SIGTERM` (verified as PID 1); the client container serves
  the homepage; the cookie flow (set on login, refresh with cookie-only, cleared
  on logout) verified end-to-end against a live server.
- **Operational note:** Mongo transactions remain deferred — they require a
  replica set, which the single-node dev/prod-compose Mongo is not.

## Follow-ups

- Add a small Redis-backed test once a Redis test container is wired into CI.
- Consider a rotating refresh-token-id stored server-side to enable global
  session revocation (currently revocation relies on the blacklist).
- Add CI (build images, run tests, run `tsc`/lint) — intentionally left out of
  scope for this branch.
- Optionally serve the client behind a reverse proxy (TLS termination, gzip).
