import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacamuerta.io'

export function siteMetadata(locale: string, path = '/', description?: string): Metadata {
  const isEnglish = locale === 'en'
  const title = isEnglish ? 'Vacamuerta — Energy intelligence' : 'Vacamuerta — Inteligencia energética'
  const copy = description ?? (isEnglish ? 'A live intelligence platform for Argentina’s energy and mineral economy.' : 'Una plataforma de inteligencia viva para la economía energética y minera de Argentina.')
  const canonical = `${siteUrl}/${locale}${path === '/' ? '' : path}`
  return { metadataBase: new URL(siteUrl), title: { default: title, template: `%s · Vacamuerta` }, description: copy, alternates: { canonical }, openGraph: { type: 'website', url: canonical, siteName: 'Vacamuerta', title, description: copy, locale: isEnglish ? 'en_US' : 'es_AR', images: [{ url: '/images/logo-favicon.png', width: 512, height: 512, alt: 'Vacamuerta energy intelligence' }] }, twitter: { card: 'summary_large_image', title, description: copy, images: ['/images/logo-favicon.png'] }, robots: { index: true, follow: true } }
}
