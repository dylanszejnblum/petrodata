'use client'

import { Link } from '@/i18n/navigation'
import type { Map as MLMap } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import type { WellFeature } from '@/fixtures/wells'
import { useTranslations } from 'next-intl'
import { FLUIDO } from './kit'

/* Miniatura del mapa que enlaza al mapa entero, como en vacamuerta.io.

   Es el mapa DE VERDAD, no una captura: mismo MapShell, los pozos llegan por
   props desde el server (loader API con fallback). Una imagen quedaría vieja
   apenas cambie el dato y nadie se enteraría.

   Va con interactive={false}: la miniatura no se arrastra ni se hace zoom,
   porque su único gesto es llevar al mapa completo. Si se pudiera manipular,
   el clic para navegar competiría con el clic para mover. */

const SOURCE = 'pozos-mini'

export function MiniMapa({
  href,
  pie,
  wells,
}: {
  href: string
  pie: string
  wells: WellFeature[]
}) {
  const t = useTranslations('v2.indice')
  const listo = (map: MLMap) => {
    if (map.getSource(SOURCE)) return

    let oeste = 180, este = -180, sur = 90, norte = -90
    for (const w of wells) {
      const [lng, lat] = w.geometry.coordinates
      if (lng < oeste) oeste = lng
      if (lng > este) este = lng
      if (lat < sur) sur = lat
      if (lat > norte) norte = lat
    }
    map.fitBounds([[oeste, sur], [este, norte]], { padding: 28, animate: false })

    map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: wells } })
    /* Sin agrupar y sin los círculos de conteo: a esta escala el número de cada
       grupo no se leería, y lo que la miniatura tiene que decir es dónde está
       la actividad, no cuánta hay en cada punto. */
    map.addLayer({
      id: `${SOURCE}-punto`,
      type: 'circle',
      source: SOURCE,
      paint: {
        'circle-color': FLUIDO.petroleo,
        'circle-radius': 2,
        'circle-opacity': 0.7,
      },
    })
  }

  return (
    <Link href={href} className="s-card block overflow-hidden no-underline">
      {/* Alto fijo en px y no aspect-ratio, que el sistema prohíbe: así el
          layout no salta mientras el mapa carga. */}
      <div className="relative h-[220px] w-full">
        <MapShell interactive={false} label="Mapa de pozos activos" onReady={listo} />
      </div>
      <div className="s-pie-card">
        <span className="s-micro min-w-0 flex-1" style={{ color: 'var(--ink-2)' }}>
          {pie}
        </span>
        <span className="s-micro shrink-0" style={{ color: 'var(--accent-ink)' }}>
          {t('verMapa')} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  )
}
