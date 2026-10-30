import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacamuerta.io'
// ponytail: /directivos oculto por ahora (ver directivos/layout.tsx); volver a sumarlo con sus fichas.
const SECCIONES = [
  '',
  '/mapa',
  '/empresas',
  '/provincias',
  '/indicadores',
  '/noticias',
]

export const revalidate = 3600

// ponytail: sin notas sueltas; entran por /noticias. Sumarlas si importa el SEO de cada nota.
export default function sitemap(): MetadataRoute.Sitemap {
  return SECCIONES.map((p) => ({
    url: `${siteUrl}${p}`,
    alternates: {
      languages: { es: `${siteUrl}${p}`, en: `${siteUrl}/en${p}` },
    },
  }))
}
