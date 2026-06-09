# Order disputes / litiges (buyer opens, admin resolves)

**Date:** 2026-06-09
**Author:** feature/catalog-enrichment
**Type:** feature

## Context

The spec requires: "En tant qu'administrateur, je peux gérer les commandes **et les
litiges**." Order management existed, but there was no concept of a dispute/claim
anywhere in the codebase. This was the last functional (non-DevOps) gap from the
spec audit.

## Decision

Added a full **disputes** resource following the existing clean/hexagonal layering:

- **shared**: `DisputeStatus` (open / under_review / resolved / rejected),
  `DisputeReason` (not_received / damaged / wrong_item / not_as_described / other),
  `Dispute`, `CreateDisputeRequest`, `ResolveDisputeRequest`.
- **domain**: `DisputeEntity` + `IDisputeRepository` (create, findById, findMany,
  findOpenByOrder, updateById).
- **infrastructure**: `DisputeModel` (Mongoose, indexed on orderId/userId/status) +
  `DisputeRepository`.
- **application**: `DisputeUseCase` — `open` (validates the order belongs to the
  buyer; blocks a second open dispute on the same order), `listMine`, `listAll`
  (admin, status filter, enriched with buyer email + order number), `resolve`
  (admin → under_review / resolved / rejected, stamps `resolvedAt`).
- **interfaces**: Zod schemas, `DisputeController`, `/disputes` router
  (`POST /` + `GET /mine` for buyers; `GET /` + `PATCH /:id` admin-guarded),
  registered in the route index; documented in the OpenAPI spec (new "Disputes"
  tag + 3 path entries).
- **client**: `lib/disputes.ts` API client; a dispute card on the order detail page
  (buyer opens a dispute with reason + description, then sees its status and the
  admin's resolution); a new `/admin/disputes` hub (status filter, table, resolve
  modal) linked from every admin sidebar.
- **seed**: two demo disputes on real buyer orders (one open, one resolved) so the
  admin hub shows an actionable and a closed case. Cleanup wipes all disputes
  (pure demo data) to avoid orphans across re-seeds.

## Why

- Disputes are modelled as their own aggregate (not a field on Order) because they
  have their own lifecycle, are buyer-initiated but admin-owned, and need to be
  listed/filtered independently for the admin hub.
- `open` enforces ownership + single-active-dispute in the use case (business rule),
  not the controller, per the dependency rules.
- Admin-centric resolution matches the spec wording ("l'administrateur gère les
  litiges"); the seller messaging system already covers buyer↔seller contact.

## Alternatives considered

- A free-text "contact support" flag on the order: rejected — no lifecycle, not
  filterable, doesn't satisfy "gérer les litiges".
- Letting sellers resolve disputes: out of scope for the spec (admin handles them);
  could be added later as a seller-visible read view.

## Impact

- New files across shared/domain/infra/application/interfaces + 2 client surfaces.
- Verified end to end (Playwright + DB): buyer opened a dispute from an order →
  persisted and shown as "Litige en cours / Ouvert"; admin listed all disputes,
  filtered by status, and resolved one with a resolution note → persisted and
  reflected. All 124 server tests still pass; server + client typecheck clean.

## Follow-ups

- A buyer "my disputes" list page (currently disputes are surfaced per-order); the
  `GET /disputes/mine` endpoint already backs it.
- Optional: email/WebSocket notification to the buyer when a dispute is resolved
  (the notification infrastructure already exists).
- The leftover `ORD-*` orders from earlier manual testing still inflate the admin
  order count; unrelated to disputes, can be pruned in a cleanup pass.
