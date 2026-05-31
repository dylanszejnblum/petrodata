# ===================== BUILD STAGE =====================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build-time env vars required by Payload CMS + Next.js
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG CRON_SECRET
ARG PREVIEW_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV CRON_SECRET=$CRON_SECRET
ENV PREVIEW_SECRET=$PREVIEW_SECRET
ENV NODE_OPTIONS="--no-deprecation"

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild native/build-required packages explicitly
RUN pnpm rebuild sharp esbuild unrs-resolver

# Copy source code and config files
COPY tsconfig.json next.config.ts next-sitemap.config.cjs playwright.config.ts vitest.config.mts postcss.config.mjs ./
COPY src ./src
COPY public ./public
COPY redirects.ts ./
COPY messages ./messages
COPY components.json ./

# Generate Payload importmap and types, then build Next.js
RUN pnpm generate:importmap
RUN pnpm build

# Prune dev dependencies for production
RUN pnpm prune --prod --ignore-scripts

# ===================== PRODUCTION STAGE =====================
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Runtime env vars
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID

ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NODE_OPTIONS="--no-deprecation"
ENV HOSTNAME="0.0.0.0"

# Copy built artifacts and production deps
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/redirects.ts ./redirects.ts
COPY --from=builder /app/messages ./messages
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

EXPOSE 3000

CMD ["pnpm", "start"]
