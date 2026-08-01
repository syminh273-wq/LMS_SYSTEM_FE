# Build context is the monorepo root (see docker-compose.yml) — this app
# pulls in the root yarn.lock and packages/shared via the yarn workspace.
FROM node:20-alpine AS base

# ── deps: install the whole workspace (cached while lockfiles don't change) ──
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/consumer-web/package.json ./apps/consumer-web/package.json
COPY apps/space-web/package.json ./apps/space-web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN yarn install --frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace @lms/consumer-web run build

# ── runner ────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/consumer-web/public ./apps/consumer-web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/consumer-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/consumer-web/.next/static ./apps/consumer-web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/consumer-web/server.js"]
