import type { Metadata } from 'next'
import { Inter, Inter_Tight, JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { routing } from '@/i18n/routing'
import { loadHeadline } from '@/lib/data/production'
import { Indice } from './_ui/Indice'
import '../globals.css'
import './sistema.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-schibsted',
  display: 'swap',
})

/* Fuentes del sistema V2: Inter para el cuerpo y JetBrains Mono para las
   cifras y etiquetas monoespaciadas (sistema.css las toma por variable). */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: { default: 'Vacamuerta.io', template: '%s · Vacamuerta.io' },
  description:
    'Inteligencia de datos sobre petróleo y gas en Argentina: producción, empresas, provincias, indicadores y noticias.',
}

/* Setea data-theme antes del primer paint. Sin el hack opacity:0 del sitio
   actual: si este script no corre, la página se ve igual (en claro). */
const themeInit = `try{var t=localStorage.getItem('estrato-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}`

/* El layout monta html/body, fuentes, tema y el esqueleto del sistema V2:
   índice fijo de 288px + columna de contenido, con el contenido topeado en
   672 y alineado a la izquierda (documentado en sistema.css).

   La columna de contenido ocupa TODO el ancho sobrante (1fr) aunque su
   contenido se tope en 672: así la trama de puntos llega hasta el borde en
   monitores anchos. El índice cumple el papel de tabla de contenidos e
   indexa las secciones del sitio, que son páginas. */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  /* El chip del índice marca el mes de corte de los datos: loader con fallback
     (fetch cacheado a 300s, se deduplica con el que hace cada página). */
  const HEADLINE = await loadHeadline()
  const t = await getTranslations({ locale, namespace: 'v2.footer' })

  return (
    <html
      lang={locale}
      className={`${interTight.variable} ${schibsted.variable} ${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="estrato-theme" strategy="beforeInteractive">
          {themeInit}
        </Script>
        <NextIntlClientProvider>
          <div className="sistema">
            <div className="grid lg:grid-cols-[288px_1fr]">
              <Indice periodo={`${HEADLINE.period}-01`} />
              <main className="s-contenido min-w-0">
                {children}
                {/* La referencia cierra con un filete punteado y una línea de
                    atribución, no al aire. Es el mismo separador de siempre. */}
                <footer className="s-pie">
                  <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
                    {t('nota')}
                  </span>
                  <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
                    sistema v2
                  </span>
                </footer>
              </main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
