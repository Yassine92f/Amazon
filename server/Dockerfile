FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# Build shared
COPY shared/ ./shared/
RUN pnpm --filter @ecommerce/shared build

# Build server
COPY server/ ./server/
RUN pnpm --filter @ecommerce/server build

# Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/shared/package.json ./shared/
COPY --from=base /app/server/dist ./server/dist
COPY --from=base /app/server/package.json ./server/
COPY --from=base /app/package.json ./

EXPOSE 5000
CMD ["node", "server/dist/server.js"]
