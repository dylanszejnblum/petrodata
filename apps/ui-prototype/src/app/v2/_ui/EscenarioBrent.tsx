'use client'

import { useCallback, useRef, useState } from 'react'
import { formatDecimal } from '@/lib/format'

/* ESCENARIO BRENT — el control que el sitio tiene y el prototipo no tenía.

   El sitio real trae un deslizador de US$ 30 a 130 que recalcula el valor de la
   producción y el margen. Acá el control es OTRO, y por una razón medida: la
   referencia NO tiene un deslizador de riel. Lo que tiene, en su Fine-tune Card
   (§19), son cuatro `role="slider"` que no son rieles sino RÓTULOS
   ARRASTRABLES: un span con `cursor: ew-resize` que al arrastrarse cambia el
   número de al lado, dentro de una píldora de 26 sobre --field con un campo
   numérico editable. Es el idioma de las herramientas de diseño, y resuelve lo
   mismo que un riel sin ocupar el ancho de uno.

   Medido en esa card: píldora de 26 con radio de chip y padding 4px 4px 4px
   2px, gap 4; el rótulo de 16×18 con radio 4, padding 0 2, 12px en ink-3 que
   sube a ink-2 en hover y a accent-ink con foco; el campo en 12px, tinta plena,
   tabular, transparente y sin contorno.

   Tres formas de moverlo, porque arrastrar no es accesible por sí solo:
   arrastrar el rótulo, escribir el número, o las flechas del teclado con el
   rótulo enfocado.

   La cuenta es la del sitio y sale entera de DAY_VALUE_INPUTS: el volumen de
   doce meses por el precio menos el descuento de calidad. No hay nada
   estimado. */

const MIN = 30
const MAX = 130

export function EscenarioBrent({
  inicial,
  hoy,
  promedio,
  breakeven,
  descuento,
  barriles,
}: {
  inicial: number
  /** el Brent del día, para poder volver */
  hoy: number
  promedio: number
  breakeven: number
  descuento: number
  /** barriles de los últimos doce meses */
  barriles: number
}) {
  const [precio, setPrecio] = useState(inicial)
  const [texto, setTexto] = useState<string | null>(null)
  const arrastre = useRef<{ x: number; base: number } | null>(null)

  const fijar = useCallback((v: number) => {
    setPrecio(Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10)))
  }, [])

  /* El realizado es lo que efectivamente entra por barril: Brent menos el
     descuento por calidad. Es el número que multiplica al volumen, no Brent. */
  const realizado = precio - descuento
  const anual = (barriles * realizado) / 1e9
  const porDia = (barriles * realizado) / 365 / 1e6
  const margen = precio - breakeven

  return (
    <>
      <div className="s-fila" style={{ alignItems: 'center' }}>
        <span className="s-etq min-w-0 flex-1">Brent del escenario</span>
        <label className="s-escenario">
          <span
            role="slider"
            tabIndex={0}
            aria-label="Arrastrar para cambiar el precio del Brent"
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuenow={precio}
            className="tirador"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              arrastre.current = { x: e.clientX, base: precio }
            }}
            onPointerMove={(e) => {
              const a = arrastre.current
              if (!a) return
              /* Dos píxeles por décimo: el recorrido entero —cien dólares— son
                 dos mil píxeles, más que cualquier pantalla, así que el gesto
                 es de ajuste fino y no de barrido. Con Shift, diez veces más
                 lento, que es lo que hacen las herramientas de diseño. */
              const paso = e.shiftKey ? 0.005 : 0.05
              fijar(a.base + (e.clientX - a.x) * paso)
            }}
            onPointerUp={() => {
              arrastre.current = null
            }}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
              if (!d) return
              e.preventDefault()
              fijar(precio + d * (e.shiftKey ? 10 : 1))
            }}
          >
            US$
          </span>
          <input
            inputMode="decimal"
            aria-label="Precio del Brent"
            value={texto ?? formatDecimal(precio, 1)}
            onChange={(e) => {
              setTexto(e.target.value)
              const n = parseFloat(e.target.value.replace(',', '.'))
              if (Number.isFinite(n)) fijar(n)
            }}
            onBlur={() => setTexto(null)}
          />
        </label>
      </div>

      {/* Los tres puntos de referencia, para volver de un clic. Sin ellos el
          escenario no tiene contra qué compararse: un 94,1 suelto no dice si
          es alto o bajo. */}
      {/* A 375 las tres píldoras suman 230px y le dejaban al rótulo lo justo
          para «Volver…». En el ancho chico el rótulo se lleva su renglón y las
          píldoras bajan al siguiente. */}
      <div className="s-fila flex-wrap gap-y-1.5" style={{ alignItems: 'center' }}>
        <span className="s-etq min-w-0 flex-1 basis-full sm:basis-auto">Volver a</span>
        <span className="flex flex-wrap gap-1.5 sm:ml-auto sm:justify-end">
          {[
            { rot: 'hoy', v: hoy },
            { rot: 'promedio 12m', v: promedio },
            { rot: 'equilibrio', v: breakeven },
          ].map((r) => (
            <button
              key={r.rot}
              type="button"
              className="s-fpill"
              aria-pressed={Math.abs(precio - r.v) < 0.05}
              onClick={() => fijar(r.v)}
            >
              {r.rot}
              {/* Sin decimal forzado: el equilibrio es 45 y «45,0» sugiere una
                  precisión que el dato no tiene — es una cifra redonda de
                  referencia, no una medición. */}
              <b>{formatDecimal(r.v, Number.isInteger(r.v) ? 0 : 1)}</b>
            </button>
          ))}
        </span>
      </div>

      <Fila etq="Precio realizado" nota={`Brent menos ${formatDecimal(descuento, 0)} de calidad`}>
        {formatDecimal(realizado, 1)}
      </Fila>
      <Fila etq="Margen sobre el equilibrio" nota={`equilibrio en ${formatDecimal(breakeven, 0)}`}>
        {formatDecimal(margen, 1)}
      </Fila>
      <Fila etq="Sólo el petróleo, por año" nota="BUSD">
        {formatDecimal(anual, 1)}
      </Fila>
      <Fila etq="Sólo el petróleo, por día" nota="MUSD">
        {formatDecimal(porDia, 1)}
      </Fila>
    </>
  )
}

/** Fila de resultado: la cifra a la derecha y su aclaración al lado. Las cuatro
    se recalculan con el precio, así que el número va tabular para que no salte
    de ancho mientras se arrastra. */
function Fila({
  etq,
  nota,
  children,
}: {
  etq: string
  nota: string
  children: React.ReactNode
}) {
  return (
    <div className="s-fila">
      <span className="s-etq min-w-0 flex-1">{etq}</span>
      <span className="s-micro shrink-0" style={{ color: 'var(--ink-2)' }}>
        {nota}
      </span>
      <span className="s-num w-14 shrink-0 text-right text-[13px] font-medium">{children}</span>
    </div>
  )
}
