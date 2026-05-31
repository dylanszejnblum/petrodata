import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

// Run on every request EXCEPT:
//   - /api/*           (Payload CMS APIs + our /api/* routes)
//   - /admin/*         (Payload admin UI)
//   - /carto-fonts/*   (rewrite proxy for MapLibre fonts)
//   - /next/*          (Payload preview routes)
//   - /_next/*         (Next.js internal assets)
//   - any file with an extension (favicon.svg, opengraph-image.png, etc.)
export const config = {
  matcher: ['/((?!api|admin|carto-fonts|next|_next|.*\\..*).*)'],
}
