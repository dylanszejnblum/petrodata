'use client'

import { useLayoutEffect, useRef, useState } from 'react'

/* Serie compacta con lectura al pasar el mouse.

   La serie es extensión nuestra: la referencia no tiene ningún gráfico. Las
   barras se comparan DENTRO del rango del período y no desde cero —doce meses
   entre 557k y 650k desde cero se verían todos iguales—, y el mes de corte
   lleva el acento.

   El globo también es extensión, y con la misma advertencia de siempre: la
   referencia no tiene ningún tooltip. Cero role="tooltip", cero popover, cero
   capas flotantes; lo único que usa son 27 `title` nativos, que quedan de
   fallback. La superficie sale de lo que el sistema sí tiene para lo que
   flota, que son los paneles del mapa: --surface opaco, --shadow-card y cero
   backdrop-filter, con z-index 10 que es el máximo del sistema. */

export function Serie({
  valores,
  textos,
  className = '',
}: {
  valores: number[]
  /** lectura completa de cada punto, YA formateada: "may 2026 · 650.190 bbl/d".
      Formateada, y no una función de formato, porque una función no cruza de
      un server component a uno cliente —Next tira 500— y porque los helpers de
      locale viven del lado del servidor. */
  textos?: string[]
  className?: string
}) {
  const caja = useRef<HTMLSpanElement>(null)
  const globo = useRef<HTMLSpanElement>(null)
  const [sobre, setSobre] = useState<number | null>(null)
  const [x, setX] = useState(0)

  const min = Math.min(...valores)
  const max = Math.max(...valores)

  /* El globo se centra en la barra, pero cerca de los bordes se saldría de la
     card —que además tiene overflow:hidden y lo cortaría—. Se mide después de
     pintarlo y se acomoda adentro de la tabla, con 8px de aire. En
     useLayoutEffect: con useEffect se ve un cuadro de posición. */
  useLayoutEffect(() => {
    if (sobre === null || !globo.current || !caja.current) return
    const cont = caja.current.closest('table, .s-card') as HTMLElement | null
    if (!cont) return
    const r = cont.getBoundingClientRect()
    const b = caja.current.getBoundingClientRect()
    const barra = caja.current.children[sobre] as HTMLElement
    const centro = barra.getBoundingClientRect()
    const w = globo.current.offsetWidth
    const centroAbs = centro.left + centro.width / 2
    const clamped = Math.min(Math.max(centroAbs, r.left + w / 2 + 8), r.right - w / 2 - 8)
    setX(clamped - b.left)
  }, [sobre])

  return (
    <span className={`s-serie ${className}`} ref={caja} onMouseLeave={() => setSobre(null)}>
      {valores.map((v, i) => {
        return (
          <span key={i} title={textos?.[i]} onMouseEnter={() => setSobre(i)}>
            {/* el último es el mes de corte y lleva el acento, que en el
                sistema es para detalles: nunca para llenar */}
            <i
              className={i === valores.length - 1 || i === sobre ? 'on' : undefined}
              style={{ height: `${15 + ((v - min) / (max - min || 1)) * 85}%` }}
            />
          </span>
        )
      })}
      {sobre !== null && textos?.[sobre] && (
        <span ref={globo} role="tooltip" className="s-globo s-mono" style={{ left: x }}>
          {textos[sobre]}
        </span>
      )}
    </span>
  )
}
