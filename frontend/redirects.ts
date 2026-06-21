import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // /inversiones was renamed to /indicadores. Keep both locale shapes
  // (Spanish at root, English under /en) and a wildcard for any subpaths.
  const inversionesToIndicadores = [
    { source: '/inversiones', destination: '/indicadores' },
    { source: '/inversiones/:path*', destination: '/indicadores/:path*' },
    { source: '/en/inversiones', destination: '/en/indicadores' },
    { source: '/en/inversiones/:path*', destination: '/en/indicadores/:path*' },
  ].map((r) => ({ ...r, permanent: true }))

  return [internetExplorerRedirect, ...inversionesToIndicadores]
}
