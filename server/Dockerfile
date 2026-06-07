# syntax=docker/dockerfile:1

# ---- Builder: install every dependency and compile TypeScript ----
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

# Copy manifests first so dependency installation is cached across code changes.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# Build the shared contracts, then the server.
COPY shared/ ./shared/
RUN pnpm --filter @ecommerce/shared build
COPY server/ ./server/
RUN pnpm --filter @ecommerce/server build

# Produce a self-contained, production-only deployment (prunes dev deps and
# injects the built @ecommerce/shared workspace package into node_modules).
RUN pnpm --filter @ecommerce/server deploy --prod --legacy /app/deploy

# ---- Runner: minimal runtime image ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=5001
WORKDIR /app

# Run as an unprivileged user instead of root.
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=builder --chown=nodejs:nodejs /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/deploy/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/deploy/package.json ./package.json

USER nodejs
EXPOSE 5001

# Liveness probe used by docker-compose / orchestrators.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
