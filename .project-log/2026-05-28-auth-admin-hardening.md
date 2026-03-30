# Auth & Admin — Security Hardening, Email Service, Verification, Audit Log, Tests

**Date:** 2026-05-28
**Author:** Teddy (branch `feature/auth-admin`)
**Type:** feature + architecture + security

## Context

The branch `feature/auth-admin` had delivered the happy path of auth & admin ([prior entries](2026-04-13-auth-admin-completion.md)) but several production-readiness gaps remained, surfaced by an audit:

- `forgotPassword` only logged the reset token to the server console — no real email was sent.
- No rate limiting on `/auth/*` — vulnerable to credential stuffing and password-reset spam.
- No account lockout — unlimited failed login attempts.
- No input validation at the HTTP boundary — controllers manually checked individual fields.
- No email verification flow — `emailVerified` field didn't even exist.
- Admin actions (suspend, role change, delete) were unaudited.
- Zero test coverage on the most security-critical use case (`AuthUseCase`).
- API responses were in French — broke the conventional REST contract.

The branch was functionally complete but not "complete enough" to ship.

## Decision

### Security middlewares

- **`rateLimit.ts`** — three express-rate-limit instances:
  - `authStrictLimiter` → 5 req / 15 min (login, register)
  - `passwordResetLimiter` → 3 req / 1 hour (forgot, reset, resend verification)
  - `authLooseLimiter` → 30 req / 15 min (refresh, verify-email)
  - Disabled when `NODE_ENV=test` so the test suite isn't blocked.
- **`validate.ts`** — Zod-based body/query/params validation, returns `400` with a structured message on first failure.
- **`schemas/authSchemas.ts`** — Zod schemas with **strong password policy**: 8–128 chars, ≥ 1 upper, ≥ 1 lower, ≥ 1 digit.

### Account lockout

- New fields on `UserEntity` and Mongoose schema: `failedLoginAttempts: number`, `accountLockedUntil?: Date`.
- New repo methods: `incrementFailedLoginAttempts`, `lockAccount`, `resetFailedLoginAttempts`.
- `AuthUseCase.login` increments on bad password and **locks for 15 min after 5 failures**. Successful login + password reset both clear the counter.

### Email service

- **`IEmailService`** in `domain/services` — three operations: `sendPasswordReset`, `sendWelcome`, `sendEmailVerification`.
- **`EmailService`** infrastructure implementation using **nodemailer**:
  - **Dev mode:** if no SMTP creds in env, uses Ethereal (free SMTP for testing) and logs the preview URL to stdout.
  - **Prod mode:** real SMTP from `config.email`.
  - HTML templates in French (end-user content, not API).
- Wired into `AuthUseCase` via DI — `forgotPassword` now actually sends an email, and `register` emits a welcome + verification email asynchronously (fire-and-forget so DB write isn't blocked by SMTP latency).

### Email verification flow

- New fields on `UserEntity`: `emailVerified: boolean`, `emailVerificationToken?`, `emailVerificationExpires?`.
- 24-hour TTL on verification tokens.
- New endpoints:
  - `POST /auth/verify-email` — consume token
  - `POST /auth/resend-verification` — re-emit verification email
- Frontend page **`/verify-email`** consumes a `?token=` query param, posts to API, handles success/error states + resend form.

### Admin audit log

- New domain entity `AuditLogEntity` + enum `AuditAction` (`user.status_changed`, `user.role_changed`, `user.deleted`).
- New `IAuditLogRepository` + Mongoose model `AuditLog` with indexes on `actorId`, `targetId`, `action`, `createdAt`.
- `AdminUseCase` now takes an `AdminActor` (id, email, IP, user-agent) on every state-changing method and writes an audit row.
- New endpoint `GET /admin/audit-log` with pagination and filters (`action`, `actorId`, `targetId`).
- JWT now carries the actor's `email` so the audit log doesn't need a DB lookup per action.

### API contract migration → English

- All `message` fields, `AppError`/`AuthError`/`ProfileError`/`AdminError` strings, Zod messages, and rate-limit response bodies translated to English.
- **Email templates remain in French** (they're end-user content, not API contract).
- Frontend UI strings remain French and are decoupled from API messages.

### Tests

- Jest config with `ts-jest` and a dedicated `tsconfig.test.json` (so test files don't pollute the build).
- **`tests/auth/authUseCase.test.ts`** — 20 unit tests covering register, login (success + 5 failure paths including lockout), refresh (rotation, blacklist, expiry), forgotPassword, resetPassword, verifyEmail, changePassword.
- All collaborators (`IUserRepository`, `IHashService`, `ITokenService`, `IEmailService`) replaced with hand-rolled fakes — no need for real Mongo/Redis to run the suite.
- `pnpm test` is now meaningful (20 tests pass; was previously `--passWithNoTests`).

### Documentation

- **`docs/api-testing.md`** — full Yaak/Postman/Insomnia walkthrough: env vars, every endpoint with copy-paste body, how to trigger rate limits, how to unlock a locked account, how to promote a user to admin, troubleshooting table.

## Why

- **Real email > console logs** — the previous `forgotPassword` was demo-grade; it would have been a production incident on first use. Ethereal in dev gives us full deliverability testing locally without paying for a transactional provider yet.
- **5/15 lockout threshold** — industry standard. Strict enough to defeat credential stuffing, lenient enough to forgive a memory lapse.
- **Zod at the HTTP boundary** — declarative validation in one place beats scattered `if (!field)` checks in every controller. The schemas also document the API contract.
- **JWT email payload** — 15-min token; the cache is "fresh enough" that injecting email into the payload is safer than an extra DB read on every admin write. Cost: ~30 bytes per token.
- **Audit log writes are fire-and-forget logged failures** — never block the admin's primary action on the audit write. A missing audit row is an operational problem, not a correctness one.
- **English API + French UI** — separates the technical contract from the user-facing locale. Future i18n won't fight the API.
- **Tests on AuthUseCase first** — highest blast radius if broken. Refresh-token rotation in particular has a subtle race that the test suite now pins down.

## Alternatives considered

- **Redis-backed rate limit** instead of in-memory — deferred. Current in-memory limiter works per-process; we have one server instance. When we scale horizontally, swap to `rate-limit-redis` (one config change).
- **Captcha on /auth/login after N failures** — rejected for now: adds frontend complexity. Lockout alone is sufficient defense at our threat level.
- **HttpOnly cookies for refresh tokens** — still deferred (noted in [2026-04-13-auth-admin-completion](2026-04-13-auth-admin-completion.md) follow-ups). Requires CSRF protection; current localStorage approach is acceptable for the MVP.
- **Separate "Audit" microservice / event stream** — overkill. A single Mongo collection serves perfectly for this volume.
- **Verification required before login** — rejected: too aggressive for an MVP. Users can browse and shop before verifying; we'll gate sensitive actions (high-value orders, seller onboarding) on `emailVerified` later if needed.
- **Translate emails to English too** — rejected: emails are end-user content, not API contract. Localizing them per user locale is the better future direction.
- **Integration tests with mongodb-memory-server** — deferred to a later commit. Unit tests on the use case cover the orchestration logic; integration tests would catch Mongoose-specific bugs but cost more setup time.

## Impact

### New files (backend)

| File                                                             | Purpose                           |
| ---------------------------------------------------------------- | --------------------------------- |
| `server/src/interfaces/http/middlewares/rateLimit.ts`            | Three rate limiters               |
| `server/src/interfaces/http/middlewares/validate.ts`             | Zod validation middleware         |
| `server/src/interfaces/http/schemas/authSchemas.ts`              | All auth Zod schemas              |
| `server/src/domain/services/IEmailService.ts`                    | Email service interface           |
| `server/src/infrastructure/services/EmailService.ts`             | Nodemailer impl + HTML templates  |
| `server/src/domain/entities/AuditLog.ts`                         | AuditLogEntity + AuditAction enum |
| `server/src/domain/repositories/IAuditLogRepository.ts`          | Audit log repo interface          |
| `server/src/infrastructure/database/models/AuditLog.ts`          | Mongoose audit log schema         |
| `server/src/infrastructure/repositories/AuditLogRepository.ts`   | Audit log impl                    |
| `server/jest.config.js` + `tsconfig.test.json`                   | Test setup                        |
| `server/tests/setup.ts`, `server/tests/auth/authUseCase.test.ts` | 20 unit tests                     |

### New files (frontend)

| File                                   | Purpose                                   |
| -------------------------------------- | ----------------------------------------- |
| `client/src/app/verify-email/page.tsx` | Email verification consumer + resend form |

### Modified files

- `server/src/domain/entities/User.ts` — added `emailVerified`, `emailVerificationToken/Expires`, `failedLoginAttempts`, `accountLockedUntil`
- `server/src/domain/repositories/IUserRepository.ts` — 6 new methods (verification + lockout)
- `server/src/infrastructure/database/models/User.ts` — Mongoose schema mirror
- `server/src/infrastructure/repositories/UserRepository.ts` — new repo methods
- `server/src/domain/services/ITokenService.ts` — JWT now carries `email`
- `server/src/infrastructure/services/TokenService.ts` — encode/decode email
- `server/src/application/use-cases/AuthUseCase.ts` — DI of EmailService + config, lockout, verification flow
- `server/src/application/use-cases/AdminUseCase.ts` — DI of AuditLogRepository, actor on state-changing methods, `getAuditLogs`
- `server/src/application/dtos/AuthDtos.ts` — `emailVerified` on result DTO
- `server/src/interfaces/http/controllers/AuthController.ts` — uses Zod-validated body, new `verifyEmail` + `resendVerification`
- `server/src/interfaces/http/controllers/AdminController.ts` — passes actor + IP/UA + new audit-log endpoint
- `server/src/interfaces/http/routes/auth.ts` — rate-limit + validate wired into every route
- `server/src/interfaces/http/routes/admin.ts` — new audit-log route + DI of repo
- `server/src/interfaces/http/middlewares/auth.ts` — exposes `userEmail` on `AuthRequest`
- All API response strings → English (Auth, Admin, Profile, User controllers + their use cases)

### New dependencies

- `express-rate-limit ^8`
- `nodemailer ^8` + `@types/nodemailer`
- `@types/jest` (dev)

### Migration / runtime notes

- **Existing sessions become invalid** after deploy: the JWT payload added `email`. Old tokens lack the field — controllers reading `userEmail` will get `undefined`. Fast forward: all users log in again (15-min access tokens make this transparent within a window).
- **Existing User documents** lack `emailVerified` (defaults to `false`), `failedLoginAttempts` (defaults to `0`). No backfill required — defaults handle it.
- **Email config** in `.env`: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`. In dev, leave `SMTP_USER` empty to use Ethereal automatically.

## Follow-ups

- **HttpOnly refresh cookie** with CSRF — still owed, see [prior follow-up](2026-04-13-auth-admin-completion.md).
- **Backfill `emailVerified=true`** for the existing seed admin user via a one-off script.
- **Audit log retention policy** — currently unbounded. Add a TTL index or scheduled purge once we have a data-retention decision.
- **Integration tests** with `mongodb-memory-server` to cover the repository layer.
- **i18n on emails** — pick per-user locale, currently hard-coded French.
- **Rate-limit by user ID** (not just IP) once we have authenticated paths that need it.
- **Webhook notifications** on critical admin actions (Slack/Discord) — the audit log makes this trivial to add.
- **Password complexity feedback** on the frontend (live strength meter) to match the new server policy.
