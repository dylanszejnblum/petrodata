# frontend-v2 (vacamuerta.io v2). Mismo esquema que frontend/ y backend/:
# node:22-alpine, pnpm 10, build en una etapa y runtime en otra.
#
# OJO CON EL BUILD: `next build` prerenderiza 16 páginas pegándole a la API de
# verdad. Si el builder no llega a NEXT_PUBLIC_API_BASE_URL, withFallback() no
# falla —cae al fixture— y la imagen sale con datos viejos sin que nadie se
# entere. La etapa de build necesita red hacia la API, no sólo hacia el registry.

# ===================== BUILD STAGE =====================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

# Va como ARG porque NEXT_PUBLIC_* se inlinea en el bundle del cliente durante
# el build: cambiar esto en runtime no cambia a dónde pega el navegador.
ARG NEXT_PUBLIC_API_BASE_URL=https://api.petrodata.dylansz.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json next.config.ts postcss.config.js ./
COPY src ./src
COPY public ./public

RUN pnpm build

# ===================== PRODUCTION STAGE =====================
FROM node:22-alpine AS production

WORKDIR /app

# Y de nuevo acá: next.config.ts lee esta variable en runtime para armar el
# connect-src del CSP. Si falta, el CSP bloquea el fetch del voto en el navegador.
ARG NEXT_PUBLIC_API_BASE_URL=https://api.petrodata.dylansz.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3200

# output: 'standalone' deja en .next/standalone un server.js con sus deps ya
# adentro; static/ y public/ van aparte porque el trace no los incluye.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3200

CMD ["node", "server.js"]
