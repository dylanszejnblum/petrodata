import { Suspense } from 'react'
import { Seccion, Card, CardHead, FilaDato, Pie } from '../_ui/kit'
import { MapaV2 } from './MapaV2'
import { HEADLINE } from '@/fixtures/production'
import { WELLS } from '@/fixtures/wells'
import { formatInteger } from '@/lib/format'

/* MAPA — la única página que rompe la grilla.

   El mapa va a sangre: toma el ancho completo de la columna de contenido —no
   los 672px en que se topan las secciones— y el alto del viewport. Es la
   excepción justificada del sistema: todo lo demás del producto se puede
   reducir a filas y barras, el mapa no, y encerrarlo en una caja de 608×420
   desperdiciaba la mitad de la pantalla en una página cuyo contenido ES el
   mapa.

   No lleva cabecera de sección arriba: le comería alto al mapa y la
   navegación ya dice dónde está uno. El rótulo y los datos van abajo, al
   scrollear, con la plantilla de siempre.

   Los paneles que en Estrato flotaban SOBRE el mapa siguen abajo: el sistema
   no superpone capas ni usa desenfoque, y así los controles de zoom no se
   solapan con nada. */

export default function V2Mapa() {
  return (
    <>
      <div className="h-dvh w-full">
        {/* Suspense porque MapaV2 lee la query con useSearchParams, y Next
            exige el límite para no forzar el render dinámico de toda la
            página. El fallback es el hueco del mapa y no un spinner: el
            sistema no tiene ninguno, y a esta altura un cuadro vacío del alto
            correcto evita que el contenido de abajo salte cuando el mapa
            aparece. */}
        <Suspense fallback={<div className="h-full w-full" style={{ background: 'var(--canvas)' }} />}>
          <MapaV2 />
        </Suspense>
      </div>

      <Seccion
        n="01"
        titulo="Pozos en el catálogo"
        desc="Tamaño del catálogo completo y de la muestra que se dibuja."
      >
        <Card>
          <CardHead titulo="Cobertura" />
          <FilaDato etiqueta="Pozos en el catálogo" valor={formatInteger(HEADLINE.catalogWells)} />
          <FilaDato etiqueta="Muestreados en el mapa" valor={formatInteger(WELLS.length)} />
          <FilaDato etiqueta="Pozos activos del mes" valor={formatInteger(HEADLINE.activeWells)} />
        </Card>
        <Pie>
          La muestra es una fracción del catálogo: dibujar {formatInteger(HEADLINE.catalogWells)}{' '}
          puntos no agrega información y sí cuesta cuadros por segundo.
        </Pie>
      </Seccion>
    </>
  )
}
