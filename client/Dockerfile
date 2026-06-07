# syntax=docker/dockerfile:1

# ---- Builder: install deps and produce the Next standalone bundle ----
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# must be supplied as build args (the runtime container never sees them).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLIC_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY=$NEXT_PUBLIC_STRIPE_PUBLIC_KEY

COPY shared/ ./shared/
RUN pnpm --filter @ecommerce/shared build
COPY client/ ./client/
RUN pnpm --filter @ecommerce/client build

# ---- Runner: minimal runtime serving the standalone server ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Traced standalone server + static assets (tracing root is the monorepo root,
# so paths are nested under client/).
COPY --from=builder --chown=nodejs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/client/public ./client/public

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "client/server.js"]
