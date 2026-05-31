import type { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import { routing } from './routing'

/**
 * Build `metadata.alternates` for a given canonical path. Pass the path WITHOUT
 * the locale prefix — e.g. `/`, `/map`, `/minerals/uranium`.
 *
 * Spanish lives at the root, English under `/en/...`, and `x-default` mirrors
 * the default (Spanish).
 */
export function buildAlternates(path: string): NonNullable<Metadata['alternates']> {
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  const cleanPath = path === '/' ? '' : path
  const esUrl = `${baseUrl}${cleanPath || '/'}`
  const enUrl = `${baseUrl}/en${cleanPath || ''}` || `${baseUrl}/en`

  return {
    canonical: esUrl,
    languages: {
      [routing.defaultLocale]: esUrl,
      en: enUrl,
      'x-default': esUrl,
    },
  }
}
