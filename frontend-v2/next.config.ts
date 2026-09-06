import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* Para el Dockerfile: server.js + sólo las dependencias que el build usa.
     Sin esto habría que copiar node_modules entero a la imagen final. */
  output: 'standalone',
  /* Sin esto Next busca la raíz del monorepo hacia arriba, encuentra
     ~/Documents y escupe .next/standalone/minerals/frontend-v2/server.js.
     Anclarlo acá hace que local y Docker den la misma ruta. */
  outputFileTracingRoot: import.meta.dirname,
  images: {
    localPatterns: [
      {
        pathname: '/images/**',
      },
    ],
    qualities: [100],
  },
  async rewrites() {
    return [
      {
        source: '/carto-fonts/:fontstack/:range',
        destination: 'https://tiles.basemaps.cartocdn.com/fonts/:fontstack/:range',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://*.basemaps.cartocdn.com",
              `connect-src 'self' ${API_BASE_URL} https://*.cartocdn.com https://*.basemaps.cartocdn.com`,
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
