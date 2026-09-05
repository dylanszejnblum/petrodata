'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Card } from './kit'

/* ── Bloque de cifras ───────────────────────────────────────────────────
   La receta MEDIDA del único lugar donde la referencia pone números grandes.
   Busqué cifras de 15px para arriba en todo el sitio y hay exactamente dos
   —"−4.41%" y "+1.15%"—, las dos en este bloque:

     div.rounded-card.bg-surface.p-3          ← UNA card para todas
       div.flex.items-center.gap-4
         div.flex-1                           ← cada cifra, SIN card propia
           span.text-[11.5px]  (ink-2)        ← rótulo
           span.text-[17px].font-semibold     ← la cifra
           code.font-mono.text-[11.5px]       ← el apoyo

   Corrige dos cosas de lo que teníamos: la cifra iba a 21px, que es el tope
   del sistema y se usa UNA vez en toda la referencia —el título de la página,
   ninguna cifra llega ahí—; y eran tres cards, o sea tres planos separados
   para tres lecturas del mismo resumen.

   LA PILA es extensión nuestra: la referencia no tiene barras partidas, igual
   que no tiene gráficos. Sale de sus reglas, sobre todo de "el color significa
   algo": cada segmento es una cuenca con el color que esa cuenca ya tiene en
   el tag de cada fila y en la card de cuencas.

   EL TOOLTIP también es extensión, y hay que decirlo: la referencia no tiene
   ninguno. Cero role="tooltip", cero popover, cero capas flotantes; lo único
   que usa son 27 `title` nativos. Así que la superficie se construye con la
   receta que el sistema sí tiene para lo que flota, la misma de los paneles
   del mapa: --surface opaco, --shadow-card —anillo de 1px más dos sombras
   suaves— y nada de backdrop-filter. Texto a 11,5 y z-index 10, que es el
   máximo del sistema. */

export type Parte = {
  nombre: string
  valor: number
  /** valor ya formateado con su unidad y su participación. Lo arma quien tiene
      los datos: el componente no formatea. */
  detalle: string
  color?: string
}

export type Cifra = {
  rotulo: string
  valor: string
  apoyo?: string
  partes?: Parte[]
}

type Globo = { x: number; y: number; texto: string }

export function Cifras({ items }: { items: Cifra[] }) {
  const caja = useRef<HTMLDivElement>(null)
  const globo = useRef<HTMLSpanElement>(null)
  const [tip, setTip] = useState<Globo | null>(null)
  const [x, setX] = useState(0)

  /* El globo se centra en el segmento, pero cerca de los bordes se correría
     afuera de la card —que además tiene overflow:hidden y lo cortaría—. Así
     que se mide después de pintarlo y se acomoda adentro, con 8px de aire.
     En useLayoutEffect y no useEffect: si no, se ve un cuadro de posición. */
  useLayoutEffect(() => {
    if (!tip || !globo.current || !caja.current) return
    const ancho = globo.current.offsetWidth
    const disponible = caja.current.offsetWidth
    setX(Math.min(Math.max(tip.x, ancho / 2 + 8), disponible - ancho / 2 - 8))
  }, [tip])

  const mostrar = (e: React.MouseEvent<HTMLElement>, texto: string) => {
    const c = caja.current
    if (!c) return
    const r = e.currentTarget.getBoundingClientRect()
    const b = c.getBoundingClientRect()
    setTip({ x: r.left + r.width / 2 - b.left, y: r.bottom - b.top + 4, texto })
  }

  return (
    <Card>
      {/* items-start y no items-center: las columnas tienen distinto alto
          cuando alguna no lleva apoyo, y centradas quedarían las cifras a
          alturas distintas. */}
      <div ref={caja} className="relative flex items-start gap-4 p-3" onMouseLeave={() => setTip(null)}>
        {items.map((it) => (
          <Columna key={it.rotulo} it={it} activo={tip?.texto} onSobre={mostrar} />
        ))}
        {tip && (
          <span
            ref={globo}
            role="tooltip"
            className="s-globo s-mono"
            style={{ left: x, top: tip.y }}
          >
            {tip.texto}
          </span>
        )}
      </div>
    </Card>
  )
}

function Columna({
  it,
  activo,
  onSobre,
}: {
  it: Cifra
  activo?: string
  onSobre: (e: React.MouseEvent<HTMLElement>, texto: string) => void
}) {
  /* El atenuado y el apagado del apoyo son de ESTA columna, no de la card: si
     no, señalar un segmento de exportaciones despintaba también las pilas de
     pozos y de provincias, que no tienen nada que ver con lo que estás
     mirando. */
  const propio = it.partes?.some((x) => `${x.nombre} · ${x.detalle}` === activo) ?? false
  return (
    <div className="min-w-0 flex-1">
      <span className="s-micro block truncate" style={{ color: 'var(--ink-2)' }}>
        {it.rotulo}
      </span>
      <span className="s-num mt-0.5 block text-[17px] font-semibold">{it.valor}</span>

      {/* La pila va pegada a la cifra, antes del apoyo: es el reparto de ESA
          cifra. Debajo del apoyo se leería como otra cosa. */}
      {it.partes && it.partes.length > 0 && (
        <span className="s-pila mt-1.5">
          {it.partes.map((x) => {
            const texto = `${x.nombre} · ${x.detalle}`
            return (
              /* Cada segmento en su envoltorio: la barra mide 8px de alto y
                 los segmentos chicos 3px de ancho —Noroeste son 24 pozos sobre
                 14.441—, así que el blanco de destino lo pone el envoltorio,
                 que se lleva la separación como padding y ocupa los 16px de
                 alto de la caja. Sin eso, apuntarle a Noroeste sería una
                 lotería. El `title` queda de fallback. */
              <span
                key={x.nombre}
                title={texto}
                onMouseEnter={(e) => onSobre(e, texto)}
                style={{ flex: `${x.valor} 1 0` }}
              >
                <i
                  style={{
                    background: x.color ?? 'var(--line-strong)',
                    opacity: !propio || activo === texto ? 1 : 0.35,
                  }}
                />
              </span>
            )
          })}
        </span>
      )}

      {/* La línea de apoyo reserva 25px, que es lo que mide el globo. La card
          tiene overflow:hidden y a 1440 medía justo 96px de alto: el globo
          terminaba exactamente en el borde inferior, o sea al filo de que lo
          recortara. Con la reserva, el globo cae adentro de este renglón y la
          card no cambia de alto al pasar el mouse.

          El apoyo se apaga mientras hay globo: dicen lo mismo y superpuestos
          se leen los dos. */}
      {it.apoyo && (
        <span
          className="s-mono mt-0.5 block text-[11.5px]"
          style={{
            color: 'var(--ink-2)',
            minHeight: it.partes ? 25 : undefined,
            opacity: propio ? 0 : 1,
            transition: 'opacity var(--dur-fast) var(--ease-out)',
          }}
        >
          {it.apoyo}
        </span>
      )}
    </div>
  )
}
