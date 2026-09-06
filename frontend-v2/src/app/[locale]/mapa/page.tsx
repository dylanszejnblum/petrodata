import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { MapaV2 } from './MapaV2'
import { loadHeadline, loadOperators } from '@/lib/data/production'
import { loadWells } from '@/lib/data/wells'

/* MAPA — la única página que rompe la grilla.

   El mapa va a sangre: toma el ancho completo de la columna de contenido —no
   los 672px en que se topan las secciones— y el alto del viewport. Es la
   excepción justificada del sistema: todo lo demás del producto se puede
   reducir a filas y barras, el mapa no, y encerrarlo en una caja de 608×420
   desperdiciaba la mitad de la pantalla en una página cuyo contenido ES el
   mapa.

   No lleva cabecera de sección arriba: le comería alto al mapa y la navegación
   ya dice dónde está uno. El rótulo y los datos van abajo, al scrollear, con
   la plantilla de siempre.

   Los paneles que en Estrato flotaban SOBRE el mapa siguen abajo: el sistema
   no superpone capas ni usa desenfoque, y así los controles de zoom no se
   solapan con nada.

   DATOS: pozos del loader (API /geo/wells con fallback), headline del mes. */

export const dynamic = 'force-dynamic'

export default async function V2Mapa({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'v2.mapa' })
  const [HEADLINE, WELLS, OPERADORES] = await Promise.all([
    loadHeadline(),
    loadWells(),
    loadOperators(),
  ])

  return (
    <>
      <div className="s-map-viewport w-full">
        {/* Suspense porque MapaV2 lee la query con useSearchParams, y Next
            exige el límite para no forzar el render dinámico de toda la
            página. El fallback es el hueco del mapa y no un spinner: el
            sistema no tiene ninguno, y a esta altura un cuadro vacío del alto
            correcto evita que el contenido de abajo salte cuando el mapa
            aparece. */}
        <Suspense fallback={<div className="h-full w-full" style={{ background: 'var(--canvas)' }} />}>
          <MapaV2
            wells={WELLS}
            operadores={OPERADORES}
            cobertura={{
              catalogo: HEADLINE.catalogWells,
              muestra: WELLS.length,
              activos: HEADLINE.activeWells,
              etiquetas: {
                titulo: t('cobertura'),
                catalogo: t('catalogo'),
                muestra: t('muestreados'),
                activos: t('activosMes'),
                cerrar: locale === 'en' ? 'Close coverage' : 'Cerrar cobertura',
              },
            }}
          />
        </Suspense>
      </div>
    </>
  )
}
