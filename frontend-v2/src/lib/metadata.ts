import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacamuerta.io'

export function siteMetadata(
  locale: string,
  path = '/',
  description?: string,
  pageTitle?: string,
): Metadata {
  const isEnglish = locale === 'en'
  const title =
    pageTitle ??
    (isEnglish ? 'Vacamuerta — Energy intelligence' : 'Vacamuerta — Inteligencia energética')
  const copy =
    description ??
    (isEnglish
      ? 'Live data on Argentina’s oil and gas: Vaca Muerta production, operators, exports and infrastructure.'
      : 'Datos vivos del petróleo y el gas de Argentina: producción de Vaca Muerta, operadoras, exportaciones e infraestructura.')
  // El español va sin prefijo (localePrefix 'as-needed'): /es redirige a /.
  const url = (l: string) => `${siteUrl}${l === 'es' ? '' : `/${l}`}${path === '/' ? '' : path}`
  const canonical = url(locale)
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s · Vacamuerta` },
    description: copy,
    icons: {
      icon: [{ url: '/favicon.png', type: 'image/png', sizes: '512x512' }],
      shortcut: '/favicon.png',
      apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
    },
    alternates: { canonical, languages: { es: url('es'), en: url('en') } },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: 'Vacamuerta',
      title,
      description: copy,
      locale: isEnglish ? 'en_US' : 'es_AR',
      images: [
        {
          url: '/opengraph-image.jpg',
          width: 1200,
          height: 630,
          alt: isEnglish
            ? 'Vacamuerta energy intelligence'
            : 'Vacamuerta, inteligencia energética de Argentina',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: copy,
      images: ['/opengraph-image.jpg'],
    },
    robots: { index: true, follow: true },
  }
}

const PAGES: Record<string, { es: [string, string]; en: [string, string] }> = {
  '/mapa': {
    es: ['Mapa de pozos', 'Los pozos de Vaca Muerta en el mapa, por operadora y producción.'],
    en: ['Well map', 'Vaca Muerta wells on the map, by operator and production.'],
  },
  '/empresas': {
    es: ['Empresas', 'Las operadoras de Vaca Muerta: producción, pozos y participación.'],
    en: ['Companies', 'Vaca Muerta operators: production, wells and share.'],
  },
  '/provincias': {
    es: ['Provincias', 'Producción de petróleo y gas por provincia en Argentina.'],
    en: ['Provinces', 'Oil and gas production by province in Argentina.'],
  },
  '/noticias': {
    es: ['Noticias', 'Las noticias del petróleo y el gas de Argentina, de las fuentes del sector.'],
    en: ['News', 'Argentina oil and gas news from industry sources.'],
  },
  '/directivos': {
    es: ['Directivos', 'Quién dirige la cuenca: el ranking de directivos de Vaca Muerta.'],
    en: ['Executives', 'Who runs the basin: the Vaca Muerta executive ranking.'],
  },
}

/** generateMetadata de una sección: título, descripción y canonical propios. */
export function pageMetadata(path: keyof typeof PAGES) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params
    const [title, desc] = PAGES[path][locale === 'en' ? 'en' : 'es']
    return { ...siteMetadata(locale, path, desc), title }
  }
}
