import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacamuerta.io'

export function siteMetadata(locale: string, path = '/', description?: string, pageTitle?: string): Metadata {
  const isEnglish = locale === 'en'
  const title = pageTitle ?? (isEnglish ? 'Vacamuerta — Energy intelligence' : 'Vacamuerta — Inteligencia energética')
  const copy = description ?? (isEnglish ? 'A live intelligence platform for Argentina’s energy and mineral economy.' : 'Una plataforma de inteligencia viva para la economía energética y minera de Argentina.')
  const canonical = `${siteUrl}/${locale}${path === '/' ? '' : path}`
  return { metadataBase: new URL(siteUrl), title: { default: title, template: `%s · Vacamuerta` }, description: copy, alternates: { canonical }, openGraph: { type: 'website', url: canonical, siteName: 'Vacamuerta', title, description: copy, locale: isEnglish ? 'en_US' : 'es_AR', images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: isEnglish ? 'Vacamuerta energy intelligence' : 'Vacamuerta, inteligencia energética de Argentina' }] }, twitter: { card: 'summary_large_image', title, description: copy, images: ['/opengraph-image.png'] }, robots: { index: true, follow: true } }
}
