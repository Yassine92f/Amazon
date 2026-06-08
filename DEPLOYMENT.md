# Deployment

Production topology: **frontend on Vercel**, **backend (API + MongoDB + Redis) on a VPS** via Docker Compose, **Caddy** in front of the API for automatic HTTPS.

```
app.tondomaine.com  ──►  Vercel (Next.js 15 SSR)
api.tondomaine.com  ──►  VPS : Caddy (TLS) ──► server:5001 ──► mongodb + redis
```

> All-in-one alternative (everything on the VPS, no Vercel): run the compose with
> `--profile full` to also build/serve the Next.js client. See the end of this doc.

---

## 1. Frontend — Vercel

1. Import the GitHub repo into Vercel. **Root Directory = repo root** (pnpm monorepo).
2. Override the build settings:
   - **Install**: `pnpm install`
   - **Build**: `pnpm build:shared && pnpm --filter @ecommerce/client build`
   - **Output**: `client/.next`
3. Environment variables (Production):
   - `NEXT_PUBLIC_API_URL=https://api.tondomaine.com/api`
   - `NEXT_PUBLIC_WS_URL=wss://api.tondomaine.com`
   - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...`
4. Add the domain `app.tondomaine.com` in Vercel → it gives you a DNS target.

Every push to `main` redeploys the front automatically.

---

## 2. Backend — VPS (Docker Compose)

### Prerequisites

- A VPS (Hetzner / OVH / DigitalOcean, ~4–5 €/mo), Ubuntu/Debian.
- Docker + Docker Compose plugin installed.
- DNS `A` record: `api.tondomaine.com` → VPS public IP (ports 80 + 443 open).

### First deploy

```bash
git clone https://github.com/Yassine92f/Amazon.git
cd Amazon

cp .env.example .env
# Fill in the secrets (NEVER commit .env):
#   API_DOMAIN=api.tondomaine.com
#   MONGO_ROOT_PASSWORD=<strong>
#   JWT_SECRET / JWT_REFRESH_SECRET=<random>
#   STRIPE_SECRET_KEY=sk_test_... / STRIPE_WEBHOOK_SECRET=whsec_... (after step below)
#   EMAIL_TRANSPORT=smtp + SMTP_* (real provider for prod emails)
#   CLIENT_URL=https://app.tondomaine.com   # CORS + email links

# Build & start the backend (mongodb + redis + server + caddy; NOT the client):
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy provisions a Let's Encrypt certificate for `API_DOMAIN` on first boot.
Check: `curl https://api.tondomaine.com/api/health` → `{"status":"ok"}`.

### Stripe webhook

In the Stripe dashboard, add a webhook endpoint:
`https://api.tondomaine.com/api/payments/webhook` → copy the `whsec_...` into
`.env` (`STRIPE_WEBHOOK_SECRET`) and `docker compose -f docker-compose.prod.yml up -d server`.

### Seed demo data (optional, once)

```bash
docker compose -f docker-compose.prod.yml exec server node dist/scripts/seed.js
```

### Redeploy (subsequent updates)

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build server
```

---

## 3. Persistence & backups

Named volumes (survive redeploys): `mongodb_data`, `redis_data`, `uploads_data`
(seller-uploaded images), `caddy_data` (TLS certs).

Daily MongoDB backup (cron):

```bash
docker compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --username admin --password "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
  --archive --gzip > "backup-$(date +%F).archive.gz"
```

---

## 4. Notes

- **Product images** (`/products/*.jpg`) ship in `client/public` → served by Vercel.
  **Uploaded images** (`/uploads/*`) live on the VPS in the `uploads_data` volume.
- The `server` host port is bound to `127.0.0.1` only; the public entrypoint is
  Caddy (80/443).
- WebSocket (socket.io) works through Caddy with no extra config.

### All-in-one on the VPS (no Vercel)

```bash
# also builds and serves the Next.js client (port 3000); point a proxy/domain at it
docker compose -f docker-compose.prod.yml --profile full up -d --build
```
