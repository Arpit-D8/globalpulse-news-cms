# ─── Base: Install dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS base

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Install libc6 compatibility for libc6 on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Minimal env vars for build (actual values set at runtime)
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# ─── Production server ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables are injected at runtime via docker run or docker-compose
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]
