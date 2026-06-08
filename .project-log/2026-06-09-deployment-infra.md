# Deployment infrastructure: uploads volume, Caddy TLS proxy, deploy guide

**Date:** 2026-06-09
**Author:** feature/devops-hardening
**Type:** tooling

## Context

The spec's DevOps section requires real deployment + TLS + persistence. The repo
already had production-hardened Dockerfiles and `docker-compose.prod.yml`
(mongo + redis + server + client, health checks, secret validation, Mongo auth),
but three things were missing to actually ship: persistent storage for uploaded
images, HTTPS termination, and a written procedure. Target topology (chosen with
the team): **front on Vercel, back on a VPS** via Docker Compose.

## Decision

- **Uploads volume.** The API writes uploaded images to `/app/uploads` in the
  container (`path.resolve(__dirname,'../../../../uploads')`). The Dockerfile now
  creates that dir owned by the `nodejs` runtime user, and the prod compose mounts a
  named volume `uploads_data:/app/uploads` so seller images survive redeploys.
- **Caddy reverse proxy.** Added a `caddy:2-alpine` service + `Caddyfile` as the
  public entrypoint for the API: automatic Let's Encrypt TLS for `$API_DOMAIN`,
  transparent WebSocket (socket.io) proxying, gzip/zstd. The `server` host port is
  now bound to `127.0.0.1` only (Caddy is the public face).
- **Client is opt-in.** Since the front goes to Vercel, the compose `client` service
  is gated behind a `full` profile. Default `up` runs only mongo + redis + server +
  caddy; `--profile full` runs everything (all-in-one VPS alternative).
- **`.env.example`** gained the prod variables (`API_DOMAIN`, `MONGO_ROOT_*`,
  `SERVER_PORT`, `CLIENT_PORT`, prod `CLIENT_URL`).
- **`DEPLOYMENT.md`** documents the full procedure end to end (Vercel build
  settings + env, VPS clone/.env/DNS, Stripe webhook, seed, redeploy, backups).

## Why

- **Vercel for the front**: Next.js 15 App Router SSR runs natively; Cloudflare
  Pages would need the `next-on-pages` adapter. Cloudflare stays useful as DNS/CDN.
- **Caddy over nginx**: auto-TLS and WebSocket support with a 3-line config; far less
  boilerplate for a project this size.
- **Named volume for uploads**: simplest durable storage; object storage (S3/R2) is
  a later optimisation, not needed for the deliverable.
- **Clone + build on the VPS** (vs a CI→GHCR image): chosen for simplicity to start;
  the compose can switch `build:` → `image:` later without other changes.

## Alternatives considered

- **CI builds & pushes the image to GHCR, VPS only pulls**: cleaner for prod (no
  build on the box, tag-based rollback) but more setup; deferred.
- **Expose the server port publicly**: rejected — Caddy terminates TLS, the API port
  is bound to localhost only.

## Impact

- `server/Dockerfile`: create `/app/uploads` owned by `nodejs`.
- `docker-compose.prod.yml`: `uploads_data` volume on server, `127.0.0.1` server
  port, new `caddy` service, `client` behind `full` profile, new volumes.
- New `Caddyfile`, `DEPLOYMENT.md`; `.env.example` prod section.
- Verified: `docker compose -f docker-compose.prod.yml config` parses; default
  services = caddy + mongodb + redis + server; `--profile full` adds client.

## Follow-ups

- CD: a GitHub Actions job (SSH `git pull && compose up -d --build`, or build→GHCR).
- Monitoring/metrics (Sentry or `/metrics`) — logs (pino) are already in place.
- Off-site rotation for the MongoDB backups.
