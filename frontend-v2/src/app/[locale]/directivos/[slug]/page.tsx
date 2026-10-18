import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { loadDirectivos } from '@/lib/data/directivos'
import { siteMetadata } from '@/lib/metadata'
import { routing } from '@/i18n/routing'
import { Ranking } from '../Ranking'

/* LA FICHA COMPARTIBLE. Es /directivos con la fila de esa persona abierta: el
   enlace que se pega en LinkedIn o WhatsApp lleva su propio título y su propia
   imagen (opengraph-image.tsx, al lado) con el puesto del día. */

type Params = Promise<{ locale: string; slug: string }>

export const revalidate = 300

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const { filas } = await loadDirectivos()
  const i = filas.findIndex((f) => f.slug === slug)
  if (i < 0) return {}
  const p = filas[i]
  const t = await getTranslations({ locale, namespace: 'v2.directivos' })
  const titulo = t('ogTitulo', { nombre: p.nombre, puesto: i + 1, total: filas.length })
  const desc = t('ogDesc', { cargo: p.cargo || '—', empresa: p.empresa.replace(/\.$/, '') })
  const base = siteMetadata(locale, `/directivos/${slug}`, desc, titulo)
  /* La imagen va explícita: con la del layout en `openGraph.images`, el
     opengraph-image.tsx de este segmento no la pisaba y el enlace salía con la
     genérica del sitio. */
  const prefijo = locale === routing.defaultLocale ? '' : `/${locale}`
  const imagen = { url: `${prefijo}/directivos/${slug}/opengraph-image`, width: 1200, height: 630, alt: titulo }
  return {
    ...base,
    title: titulo,
    openGraph: { ...base.openGraph, images: [imagen] },
    twitter: { card: 'summary_large_image', title: titulo, description: desc, images: [imagen.url] },
  }
}

export default async function FichaDirectivo({ params }: { params: Params }) {
  const { locale, slug } = await params
  const { filas } = await loadDirectivos()
  // Con la API caída `filas` viene vacía y Ranking muestra su aviso: no es un 404.
  if (filas.length && !filas.some((f) => f.slug === slug)) notFound()
  return <Ranking locale={locale} abierta={slug} />
}
