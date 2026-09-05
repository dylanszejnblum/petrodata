'use client'

import Link from 'next/link'
import type { Map as MLMap } from 'maplibre-gl'
import { MapShell } from '@/ui/map-shell'
import { WELLS } from '@/fixtures/wells'
import { Icono, PATH } from './iconos'
import { CEOS } from '@/fixtures/ceos'

/* Los dos paneles de la card de empresa: dónde perfora y cuánto pesa.

   Son la mini card medida en la Insight Card (§16) —barra de cabecera con
   rótulo y chip, y el contenido debajo— en la variante blanca. Ver .s-panel en
   sistema.css.

   El del mapa es cliente porque monta MapLibre; el de barras podría ser
   servidor, pero vive al lado y comparte la caja, así que se quedan juntos. */

const ALTO = 60
/* El panel del mapa NO se reparte el ancho en partes iguales con el otro: se
   lleva 116px fijos y el de barras el resto.

   Es geometría del dato. El bbox de la cuenca es casi cuadrado —190 km de
   ancho por 176 de alto— y para que la nube llene una caja apaisada hay que
   encuadrar una franja horizontal, o sea recortar arriba y abajo. Cuanto más
   apaisada la caja, más se recorta: con los 210px que le tocaban al repartir
   por igual, entraba el 28% de los pozos. Con 116 entra el 62%, que ya es la
   nube y no una línea de ella.

   Las barras, en cambio, no pierden nada por ser más anchas: ganan. */
const ANCHO_MAPA = 116

/** Mapa de los pozos de UNA empresa, enlazado al mapa entero ya filtrado. */
export function PanelPozos({
  slug,
  nombre,
  color,
  total,
  /** cuántos pozos de esta empresa hay en la muestra que se dibuja */
  muestra,
}: {
  slug: string
  nombre: string
  color: string
  total: string
  muestra: number
}) {
  const listo = (map: MLMap) => {
    const id = `pozos-${slug}`
    if (map.getSource(id)) return
    const mios = WELLS.filter((w) => w.properties.operator === slug)

    /* El encuadre es el de TODOS los pozos y no el de los de esta empresa. Con
       el suyo propio, los 21 de PAE llenarían el cuadro igual que los 80 de
       YPF y el mapa mentiría sobre su tamaño relativo: las tres miniaturas
       tienen que ser comparables entre sí. */
    let oeste = 180, este = -180, sur = 90, norte = -90
    for (const w of WELLS) {
      const [lng, lat] = w.geometry.coordinates
      if (lng < oeste) oeste = lng
      if (lng > este) este = lng
      if (lat < sur) sur = lat
      if (lat > norte) norte = lat
    }

    /* Y la latitud se COMPRIME al aspecto de la caja antes de encuadrar.

       El bbox de la cuenca es casi cuadrado —2,19° de longitud contra 1,59° de
       latitud, o sea 190 km por 176— y el panel es una franja de 3,5:1. Con
       fitBounds del bbox entero, MapLibre ajusta por el eje que aprieta —el
       vertical— y sobra tanto ancho que entra la costa de Chile a la izquierda
       y la nube de pozos queda apretada en el medio.

       Así que se encuadra una FRANJA horizontal centrada en los pozos, alta
       como para llenar la caja. Recorta arriba y abajo: con esta caja entra
       cerca del 62% de los puntos —medido—, y por eso el panel es angosto y no
       la mitad del ancho, que dejaba sólo el 28%.

       Es el intercambio correcto para una miniatura: lo que tiene que decir es
       dónde está la actividad, no cuántos pozos hay —eso lo dice el chip— y el
       mapa completo está a un clic. */
    const medioLat = (sur + norte) / 2
    /* 87 km por grado de longitud a esta latitud contra 111 por grado de
       latitud: sin la corrección, la franja saldría un 27% más alta de lo que
       corresponde. */
    const kmLon = (este - oeste) * 87
    const altoFranja = kmLon / (ANCHO_MAPA / ALTO) / 111
    map.fitBounds(
      [[oeste, medioLat - altoFranja / 2], [este, medioLat + altoFranja / 2]],
      { padding: 4, animate: false },
    )

    /* Fuera las etiquetas del basemap. En 116×60 un topónimo no entra entero
       —«NEUQUÉN» salía cortado por el borde de abajo— y compite con los puntos,
       que es lo único que la miniatura tiene que mostrar. La geografía queda:
       ríos, lagos y límites siguen dando el contexto. */
    for (const capa of map.getStyle().layers ?? []) {
      if (capa.type === 'symbol') map.setLayoutProperty(capa.id, 'visibility', 'none')
    }

    map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: mios } })
    map.addLayer({
      id: `${id}-punto`,
      type: 'circle',
      source: id,
      paint: {
        /* El color de la empresa y no el del fluido: en esta caja el punto
           dice de quién es el pozo, que es lo único que la distingue de las
           otras dos miniaturas de la sección. */
        'circle-color': color,
        'circle-radius': 2,
        'circle-opacity': 0.85,
      },
    })
  }

  return (
    <div className="s-panel" style={{ flex: `0 0 ${ANCHO_MAPA}px` }}>
      <div className="s-panel-bar">
        <span className="rot">Pozos</span>
        <span className="pin">{total}</span>
      </div>
      <div className="s-panel-cuerpo">
        <Link
          href={`/v2/mapa?operadora=${slug}`}
          className="block no-underline"
          title={`Ver los ${muestra} pozos de ${nombre} en el mapa`}
          style={{ height: ALTO }}
        >
          {/* Sin atribución: a 60px de alto el control desplegado tapa el mapa
              entero. Va una sola vez, en el pie de la sección. */}
          <MapShell
            interactive={false}
            atribucion={false}
            label={`Pozos de ${nombre}`}
            onReady={listo}
          />
        </Link>
      </div>
    </div>
  )
}

/** El ícono de ayuda con su globo. Es la MISMA pieza en los dos paneles que la
    usan: dos formas distintas de ofrecer lo mismo en la misma fila serían dos
    vocabularios. El globo reusa .s-globo —extensión ya documentada, porque la
    referencia no tiene ningún tooltip— y se ancla por la derecha, que es donde
    hay lugar dentro de la card. */
function Ayuda({ resumen, children }: { resumen: string; children: React.ReactNode }) {
  return (
    <span className="s-ayuda-caja">
      {/* button y no span: tiene que poder recibir el foco de teclado, que es
          la otra forma de abrir el globo. */}
      <button type="button" className="s-ayuda" aria-label={resumen}>
        <Icono d={PATH.info} size={13} grosor={2} />
      </button>
      <span className="s-globo s-globo--ayuda" role="tooltip">
        {children}
      </span>
    </span>
  )
}

/** Quién dirige la empresa: la foto a sangre y el resto en el globo. */
export function PanelCeo({ slug }: { slug: string }) {
  const c = CEOS[slug]
  if (!c) return null
  const resumen = `${c.nombre}. ${c.cargo}${c.desde ? `, desde ${c.desde}` : ''}.${c.credito ? ` Foto: ${c.credito}.` : ''}`
  return (
    <div className="s-panel" style={{ flex: `0 0 ${ANCHO_MAPA}px` }}>
      <div className="s-panel-bar">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="rot">CEO</span>
          <Ayuda resumen={resumen}>
            <b className="block font-medium" style={{ color: 'var(--ink)' }}>
              {c.nombre}
            </b>
            {c.cargo}
            {c.desde && ` · desde ${c.desde}`}
            {c.credito && (
              /* El crédito va SIEMPRE y en ink-2, no en ink-3: para la foto con
                 licencia CC es una obligación, y un crédito que no se lee no
                 cumple. */
              <span className="mt-0.5 block text-[10.5px]">Foto: {c.credito}</span>
            )}
          </Ayuda>
        </span>
      </div>
      <div className="s-panel-cuerpo">
        {c.foto ? (
          /* A sangre, como el mapa del otro panel. `cover` recorta —las tres
             fotos tienen proporciones distintas contra esta caja— y el encuadre
             de cada una vive en el fixture, elegido a mano. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.foto}
            alt={c.nombre}
            loading="lazy"
            decoding="async"
            style={{
              display: 'block',
              width: '100%',
              height: ALTO,
              objectFit: 'cover',
              objectPosition: c.pos ?? 'center',
            }}
          />
        ) : (
          /* Sin foto, las iniciales llenan la misma caja. No es un hueco: es la
             marca por defecto, el mismo criterio que el logo de la empresa. */
          <span
            className="flex items-center justify-center"
            style={{
              height: ALTO,
              background: 'var(--field)',
              color: 'var(--ink-2)',
              fontSize: 20,
              fontWeight: 650,
            }}
          >
            {c.nombre
              .split(/\s+/)
              .slice(0, 2)
              .map((x) => x[0])
              .join('')
              .toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

/** Las dos participaciones, a la misma escala, con su ayuda. */
export function PanelPeso({
  produccion,
  valor,
  produccionPct,
  valorPct,
  color,
}: {
  /** ya formateado, p. ej. "34,2%" */
  produccion: string
  valor: string
  /** ancho de cada barra en %, ya escalado contra el máximo de la sección */
  produccionPct: number
  valorPct: number
  color: string
}) {
  return (
    <div className="s-panel">
      <div className="s-panel-bar">
        <span className="flex min-w-0 items-center gap-1.5">
          {/* «Share» y no «Volumen y valor» (pedido de Mariano, 2026-08-17): es
              como se nombra la participación en el sector, y en 116px de barra
              entra sin recortarse. Lo que significa cada barra lo dice el globo
              del ícono de al lado. */}
          <span className="rot">Share</span>
          <Ayuda resumen="La primera barra es cuánto pesa en la producción del país; la segunda, cuánto pesa en el valor en dólares. Las dos a la misma escala.">
            La primera barra es cuánto pesa en la producción del país; la segunda, cuánto pesa en
            el valor en dólares. Las dos a la misma escala, para que la diferencia se vea.
          </Ayuda>
        </span>
      </div>
      <div
        className="s-panel-cuerpo flex flex-col justify-center gap-2 px-2.5"
        style={{ minHeight: ALTO }}
      >
        <span className="flex items-center gap-2">
          <span className="s-barra flex-1" style={{ ['--barra-color' as string]: color }}>
            <i style={{ width: `${Math.max(3, produccionPct)}%` }} />
          </span>
          <span className="s-num w-10 shrink-0 text-right text-[11.5px] font-medium">
            {produccion}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="s-barra flex-1">
            <i style={{ width: `${Math.max(3, valorPct)}%` }} />
          </span>
          <span className="s-num w-10 shrink-0 text-right text-[11.5px] font-medium">{valor}</span>
        </span>
      </div>
    </div>
  )
}
