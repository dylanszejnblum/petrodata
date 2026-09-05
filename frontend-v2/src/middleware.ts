import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

// Run on every request EXCEPT:
//   - /api/*           (route handlers)
//   - /carto-fonts/*   (rewrite proxy for MapLibre fonts)
//   - /_next/*         (Next.js internal assets)
//   - any file with an extension (favicon.svg, opengraph-image.png, etc.)
export const config = {
  matcher: ['/((?!api|carto-fonts|_next|.*\\..*).*)'],
}
