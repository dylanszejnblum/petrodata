import type { MetadataRoute } from 'next'
import { loadDirectivos } from '@/lib/data/directivos'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacamuerta.io'
const SECCIONES = [
  '',
  '/mapa',
  '/empresas',
  '/provincias',
  '/indicadores',
  '/noticias',
  '/directivos',
]

export const revalidate = 3600

// ponytail: sin notas sueltas; entran por /noticias. Sumarlas si importa el SEO de cada nota.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { filas } = await loadDirectivos()
  const paths = [...SECCIONES, ...filas.map((f) => `/directivos/${f.slug}`)]
  return paths.map((p) => ({
    url: `${siteUrl}${p}`,
    alternates: {
      languages: { es: `${siteUrl}${p}`, en: `${siteUrl}/en${p}` },
    },
  }))
}
