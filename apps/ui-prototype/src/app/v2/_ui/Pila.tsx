'use client'

import { useLayoutEffect, useRef, useState } from 'react'

/* PILA — una barra partida en segmentos, cada uno con su color categórico.

   Es EXTENSIÓN, no una pieza medida: la referencia no tiene ninguna. Sale de
   sus reglas, que es distinto de inventar:
   · el color SIGNIFICA algo. Cada segmento lleva el color que su categoría ya
     tiene en el resto de la web, no una paleta nueva.
   · lo que no es una categoría va en --line-strong, igual que su tag va neutro,
     así la pila suma exacto en vez de dejar un resto mudo.
   · 8px de alto sobre una caja de 16. Nada de superficies de color grandes.

   La separación de 1,5px va como padding del envoltorio y no como gap: así los
   segmentos son contiguos y no hay huecos muertos entre uno y otro, que con 31
   segmentos —algunos de menos de 3px— haría del hover una lotería.

   Ya existía inline adentro de Cifras.tsx. Acá vive suelta porque la card de
   concentración la necesita a ancho completo y con 31 segmentos, no tres. */

export type Segmento = {
  clave: string
  /** peso relativo; el ancho sale de la proporción sobre el total */
  valor: number
  /** lo que muestra el globo, YA formateado */
  texto: string
  color?: string
}

export function Pila({ segmentos }: { segmentos: Segmento[] }) {
  const caja = useRef<HTMLDivElement>(null)
  const globo = useRef<HTMLSpanElement>(null)
  const [tip, setTip] = useState<{ x: number; texto: string } | null>(null)
  const [x, setX] = useState(0)

  /* El globo se centra en el segmento, pero cerca de los bordes se saldría de
     la card —que tiene overflow:hidden y lo cortaría—, así que se mide después
     de pintarlo y se acomoda adentro con 8px de aire. En useLayoutEffect y no
     useEffect: si no, se ve un cuadro en la posición vieja durante un frame. */
  useLayoutEffect(() => {
    if (!tip || !globo.current || !caja.current) return
    const ancho = globo.current.offsetWidth
    const disponible = caja.current.offsetWidth
    setX(Math.min(Math.max(tip.x, ancho / 2 + 8), disponible - ancho / 2 - 8))
  }, [tip])

  return (
    /* El globo sale hacia ARRIBA y el contenedor reserva su alto: la card tiene
       overflow oculto y hacia abajo lo cortaría el borde. */
    <div ref={caja} className="relative" onMouseLeave={() => setTip(null)}>
      <span className="s-pila">
        {segmentos.map((s) => (
          <span
            key={s.clave}
            title={s.texto}
            style={{ flex: `${s.valor} 1 0` }}
            onMouseEnter={(e) => {
              const c = caja.current
              if (!c) return
              const r = e.currentTarget.getBoundingClientRect()
              setTip({ x: r.left + r.width / 2 - c.getBoundingClientRect().left, texto: s.texto })
            }}
          >
            <i
              style={{
                background: s.color ?? 'var(--line-strong)',
                opacity: !tip || tip.texto === s.texto ? 1 : 0.35,
              }}
            />
          </span>
        ))}
      </span>
      {tip && (
        <span
          ref={globo}
          role="tooltip"
          className="s-globo"
          style={{ left: x, bottom: 'calc(100% + 4px)' }}
        >
          {tip.texto}
        </span>
      )}
    </div>
  )
}
