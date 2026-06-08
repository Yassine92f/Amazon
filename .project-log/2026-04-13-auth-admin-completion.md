# Auth & Admin Completion — Forgot Password, Addresses, Preferences, UX Polish

**Date:** 2026-04-13
**Author:** Teddy (commit 9aaaa56, branch `feature/auth-admin`)
**Type:** feature + fix

## Context

The auth and admin foundations were in place ([2026-04-13-auth-jwt-rbac](2026-04-13-auth-jwt-rbac.md), [2026-04-13-admin-dashboard](2026-04-13-admin-dashboard.md)), but several gaps blocked a real production scenario:

- No password recovery — users were locked out forever if they forgot their password.
- Profile lacked address book and preference toggles, both required by checkout and notifications down the line.
- Admin tooling used native `confirm()` dialogs and raw `alert()`s — fine for demo, unacceptable for actual operators.
- A race condition existed in the refresh token interceptor: concurrent 401s could trigger multiple refresh calls, blacklisting valid tokens.
- Dashboard stats showed placeholder trend percentages instead of real data.
- Several auth UX flows had bad defaults: `/login` accessible while already authenticated, no return-to-page after auth, etc.

## Decision

### Forgot / Reset password flow

- New pages: `/forgot-password` (request reset token), `/reset-password` (consume token, set new password).
- Backend additions in `AuthUseCase`: `requestPasswordReset(email)`, `resetPassword(token, newPassword)`.
- Token storage: short-lived (1h) reset token, single-use, invalidated on consumption.

### Address management

- CRUD on user addresses (`addresses[]` on the `User` entity).
- New repository methods on `IUserRepository` and `UserRepository` (Mongoose).
- Frontend: address tab on `/profile` with form for create/edit, list with default-address selection.

### User preferences

- Language, currency, and notification toggles (email, push, sms).
- Stored as embedded `preferences` object on `User`.
- Frontend: preferences tab on `/profile`.

### Profile UX

- Tabbed layout: Profile / Addresses / Preferences.
- Avatar upload (base64, with fallback to user initials on render failure).
- Password confirmation required when updating profile (defense against session-hijack profile rewrites).

### Admin polish

- **Real dashboard trends:** stats now compute true period-over-period deltas (correct endpoint, proper aggregation).
- **Role change:** admins can promote/demote users between `user`, `seller`, `admin` in the users panel.
- **Confirmation modals:** replaced `window.confirm()` with in-app modals — better UX, testable, branded.
- **Toast notifications:** consistent feedback across admin + profile actions (replaces `alert()`).
- **Dynamic pagination with ellipses:** for >7 pages, collapses middle pages into `...`.

### Auth UX fixes

- **`GuestRoute` component:** mirrors `ProtectedRoute` but in reverse — redirects authenticated users away from `/login` and `/register`.
- **Redirect param on `ProtectedRoute`:** unauthenticated user hitting a protected page is sent to `/login?redirect=/original-path`, then bounced back after auth.
- **Refresh-token mutex:** the Axios interceptor now serializes concurrent refresh attempts via a single in-flight promise — fixes the race where parallel 401s caused token thrash.

## Why

- **Forgot password is non-negotiable** — without it, every forgotten-password incident is a support ticket and a DB write.
- **Embedded addresses/preferences** (not separate collections) — these fields are always loaded with the user, never queried independently. Mongoose embedded docs are faster and avoid join logic.
- **Password confirm on profile update** — covers the "attacker steals a session and changes email + password to take over the account" attack. Cheap defense, big payoff.
- **Real trends > fake trends** — dashboards lie if their stats are wrong; this is worse than not showing them.
- **In-app confirmation modals** — `window.confirm()` is unstyleable, untestable, and breaks the design language. Worth the small investment in a reusable modal.
- **Refresh mutex** — the symptom was sporadic logouts under load (e.g., multiple components mounting in parallel each firing an authenticated request, all hitting 401 simultaneously). Each parallel refresh blacklisted the previous one. Mutex pattern (single in-flight promise) is the standard fix.
- **`GuestRoute` + redirect param** — together they give the expected "click a deep link → log in → land where you intended" flow that users assume works.

## Alternatives considered

- **Email-based magic link login (passwordless)** — deferred: add later as an additional method. Password reset alone unblocks the immediate gap.
- **Storing addresses in a separate `addresses` collection** — rejected: addresses are always accessed in the context of a specific user; embedded docs win on read perf.
- **Library for toast notifications (`react-hot-toast`, `sonner`)** — picked an in-house lightweight toast to match design language; can swap to a library later if we need richer features (queue, position variants, undo).
- **Optimistic UI updates on admin actions** — partially done; full optimistic update with rollback deferred until we have a clearer pattern across the app.
- **HttpOnly cookie for refresh token** — would eliminate the JS-accessible refresh-token attack surface, but requires CSRF protection and same-origin or proper CORS setup. Deferred; current localStorage approach is acceptable for the scope.

## Impact

- **Backend new files:** none — all changes additive to existing use cases / repositories / controllers / routes.
- **Backend modified:**
  - `server/src/application/use-cases/{AuthUseCase.ts, AdminUseCase.ts, ProfileUseCase.ts}`
  - `server/src/domain/entities/User.ts` — added `addresses`, `preferences`, `avatar`
  - `server/src/domain/repositories/IUserRepository.ts` — address/preferences/avatar methods
  - `server/src/infrastructure/repositories/UserRepository.ts` — implementation
  - `server/src/infrastructure/database/models/User.ts` — Mongoose schema updates
  - `server/src/interfaces/http/controllers/{AuthController.ts, AdminController.ts, UserController.ts}`
  - `server/src/interfaces/http/routes/{auth.ts, admin.ts, users.ts}` — new endpoints
- **Frontend new files:**
  - `client/src/app/forgot-password/page.tsx`, `client/src/app/reset-password/page.tsx`
  - `client/src/components/GuestRoute.tsx`
- **Frontend modified:**
  - `client/src/app/profile/page.tsx` — grew from ~320 to ~1100 lines (tabs, addresses, preferences, avatar)
  - `client/src/app/admin/page.tsx`, `client/src/app/admin/users/page.tsx` — real trends, role change, modals, toasts
  - `client/src/app/login/page.tsx`, `client/src/app/register/page.tsx`
  - `client/src/components/ProtectedRoute.tsx` — redirect param
  - `client/src/lib/api.ts` — refresh mutex

## Follow-ups

- **Actually send the reset email** — currently the reset token is returned in the API response (dev convenience). Wire to a transactional email provider (Resend, Postmark) before launch.
- **Address validation** — integrate a postal-code / address API (e.g., Google Places, Adresse API for FR) to prevent invalid addresses.
- **Preferences enforcement** — currency/language toggles store the preference; downstream pages still need to read and apply it (Intl formatting, i18n routing).
- **Audit trail for admin role changes** — promotion/demotion should be logged.
- **Migrate refresh token storage** to HttpOnly cookie when CSRF protections land.
