FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
RUN pnpm install --frozen-lockfile

# Build shared
COPY shared/ ./shared/
RUN pnpm --filter @ecommerce/shared build

# Build client
COPY client/ ./client/
RUN pnpm --filter @ecommerce/client build

# Production
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/shared/package.json ./shared/
COPY --from=base /app/client/.next ./client/.next
COPY --from=base /app/client/public ./client/public
COPY --from=base /app/client/package.json ./client/
COPY --from=base /app/package.json ./

EXPOSE 3000
CMD ["pnpm", "--filter", "@ecommerce/client", "start"]
