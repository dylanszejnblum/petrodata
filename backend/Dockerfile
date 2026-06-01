# ===================== BUILD STAGE =====================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm (v10 for engines compatibility)
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild native/build-required packages explicitly
RUN pnpm rebuild @nestjs/core @prisma/client @prisma/engines @swc/core prisma

# Copy source code
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/

# Generate Prisma client
RUN pnpm prisma generate

# Build the NestJS app (use explicit nest binary)
RUN ./node_modules/.bin/nest build && ls -la dist/ && ls -la dist/main.js 2>/dev/null || (echo "BUILD FAILED - dist/main.js not found" && exit 1)

# ===================== PRODUCTION STAGE =====================
FROM node:22-alpine AS production

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copy full node_modules (includes prisma + generated client)
COPY --from=builder /app/node_modules ./node_modules

# Prisma schema + migrations needed for prisma migrate deploy
COPY --from=builder /app/prisma ./prisma

RUN ls -la /app/dist/main.js 2>/dev/null || (echo "dist/main.js MISSING in production" && exit 1)

EXPOSE 3001

# Use local prisma binary, then start app
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main"]
