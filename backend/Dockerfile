# ===================== BUILD STAGE =====================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies, skip build scripts (handled separately below)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild native/build-required packages explicitly
RUN pnpm rebuild @nestjs/core @prisma/client @prisma/engines @swc/core prisma

# Copy source code
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/

# Generate Prisma client and build
RUN npx prisma generate
RUN pnpm run build

# Prune dev dependencies for production
RUN pnpm prune --prod --ignore-scripts

# ===================== PRODUCTION STAGE =====================
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built artifacts and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Prisma schema + migrations needed at runtime for migrations
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Run Prisma migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
