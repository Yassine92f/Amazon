# Admin Dashboard, Users Management & Profile Page

**Date:** 2026-04-13
**Author:** Yass (commit fb9cece, branch `feature/auth-admin`)
**Type:** feature

## Context

With auth + RBAC in place ([2026-04-13-auth-jwt-rbac](2026-04-13-auth-jwt-rbac.md)), the next priority was giving admins tooling to operate the platform (view users, suspend abusive accounts, see growth signals) and giving regular users self-service profile management. Without these, every user action (password change, status update) would require a developer to touch the database directly.

## Decision

### Backend

**`AdminUseCase`** — admin operations:

- `getUsers(filters, pagination)` — paginated list with search and role/status filters
- `getUserById(id)`
- `updateUserStatus(id, status)` — activate / suspend
- `deleteUser(id)` — hard delete (revisit later for soft delete)
- `getDashboardStats()` — aggregate stats for the home dashboard

**`ProfileUseCase`** — self-service for the logged-in user:

- `getProfile()`
- `updateProfile(data)`

**Routes** — all admin routes gated by `authenticate` + `authorize('admin')`:

```
GET    /admin                         → dashboard stats
GET    /admin/users                   → paginated users
PUT    /admin/users/:id/status        → suspend / activate
DELETE /admin/users/:id               → delete
GET    /users/profile                 → current user profile
PUT    /users/profile                 → update profile
```

### Frontend

- **`/admin`** — dashboard with stat cards (total users, recent signups, etc.) + recent users table.
- **`/admin/users`** — full users list with search, role filter, status filter, pagination, inline suspend/delete actions.
- **`/profile`** — edit profile form + change password panel.
- **`Header`** updated with auth-aware UI: avatar dropdown when authenticated, admin link when role is admin, login/register CTAs otherwise.

### Design artifacts

- `ecommerce.pen` (Pencil) — design mockups for admin dashboard, users list, and profile page committed alongside code so the team can iterate visually.

## Why

- **Separate `AdminUseCase` from `ProfileUseCase`** — they have different authorization boundaries (admin global access vs. self-only) and different invariants. Mixing them invites accidental privilege escalation bugs.
- **Pagination on `/admin/users` from day one** — even at 100 users, scrolling a non-paginated table is bad UX. At 10k users, it's a server crash. Build it once correctly.
- **RBAC enforced in the middleware, not the controller** — `authorize('admin')` short-circuits before the controller runs, so there's no path where the use case executes without the gate.
- **Header avatar dropdown** — standard UX pattern; reduces clicks for the most common admin/user actions (profile, logout).
- **Design files in repo** — `.pen` mockups are versioned alongside code so design decisions are traceable in `git log`, not lost in a separate Figma/Pencil cloud.

## Alternatives considered

- **Single combined `UserUseCase` for admin + profile** — rejected: blurs authorization boundaries; future devs may forget to add the admin gate.
- **GraphQL admin API** — deferred: REST is simpler for this scope; we can add GraphQL when query flexibility actually pays for the complexity.
- **Soft delete on users (`isDeleted` flag)** — deferred to follow-up; current scope hard-deletes. Need to decide on data retention policy first (GDPR implications).
- **Server-side rendering for admin pages** — rejected: admin UI benefits from optimistic updates and rich client state; CSR with App Router suits better.

## Impact

- **New files (backend):**
  - `server/src/application/use-cases/{AdminUseCase.ts, ProfileUseCase.ts}`
  - `server/src/interfaces/http/controllers/{AdminController.ts, UserController.ts}`
  - `server/src/interfaces/http/routes/{admin.ts, users.ts}`
- **New files (frontend):**
  - `client/src/app/admin/page.tsx`, `client/src/app/admin/users/page.tsx`, `client/src/app/profile/page.tsx`
- **Modified:**
  - `server/src/interfaces/http/routes/index.ts` — registered admin + user routes
  - `client/src/components/Header.tsx` — auth-aware navigation (245 lines, was ~70)
- **Design:** `ecommerce.pen` — 12,898 lines of Pencil document (encrypted, opened via Pencil MCP tools).

## Follow-ups

- Replace hard delete with soft delete + GDPR-compliant purge job.
- Add audit log: who suspended whom, when, and why.
- Real trend data on dashboard stats (currently placeholder) → **done** in [2026-04-13-auth-admin-completion](2026-04-13-auth-admin-completion.md).
- Confirmation modals for destructive admin actions (currently `confirm()`) → **done** in [2026-04-13-auth-admin-completion](2026-04-13-auth-admin-completion.md).
- Profile page UX polish (panel height, button widths) → **done** in commit 580f4c1.
