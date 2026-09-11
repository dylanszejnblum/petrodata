'use client'

import { useState } from 'react'

/* Serie de columnas — la contraparte discreta de SerieLinea.

   Por qué columnas y no una línea: los pozos nuevos por mes son un CONTEO, no
   una señal continua. Una línea entre 44 y 49 pozos dibuja una pendiente que
   sugiere que en el medio hubo 46, y no hubo nada en el medio: hubo un mes y
   después otro. La columna no interpola.

   Por qué no alcanzaba `Serie`, la que ya existía: mide 16px de alto con barras
   de 3px y vive DENTRO de una celda de tabla —es una chispa al lado de una
   cifra, no un gráfico—. Acá el gráfico es el contenido de la sección.

   Todo lo demás es prestado y a propósito: el bloque hundido, la barra con el
   chip a la derecha y el recorrido con el mouse son los mismos de SerieLinea,
   así las dos series de la página se leen como el mismo objeto en dos formas.

   Las columnas van en --line-strong y NO en el color del fluido. Pintadas de
   azul petróleo llenaban media card de color saturado, que es exactamente lo
   que el sistema no hace: el acento marca UN detalle —acá, la columna que se
   está señalando— y nunca una superficie. Es la misma regla que ya aplica
   .s-serie, que también es una serie de barras.

   Sin punto de color ni leyenda arriba: hay una sola serie, y un punto que no
   distingue nada de nada es decoración.

   El mes parcial NO llega hasta acá: lo filtra quien llama. Dibujarlo —aunque
   fuera calado— lo dejaba igual como último punto, y el último punto es el que
   la card muestra como cifra en reposo. Un mes al que le faltan días se leía
   como una caída.

   Las columnas se comparan DESDE CERO y no dentro del rango. En una serie de
   conteos el cero existe de verdad —se puede perforar cero pozos en un mes— y
   recortar la base convertiría una variación del 20% en una del 100%. Es lo
   contrario de lo que hace `Serie`, que compara dentro del rango porque doce
   meses de producción entre 557k y 650k desde cero se verían todos iguales. */

export function SerieBarras({
  valores,
  /** rótulo de cada punto, ya formateado */
  rotulos,
  /** lectura de cada punto, ya formateada: «may 2026 · 54 pozos» */
  textos,
  /** rótulo del período completo, para el chip en reposo */
  rango,
  /** qué se cuenta, para la línea de cifra: «pozos» */
  unidad,
}: {
  valores: number[]
  rotulos: string[]
  textos: string[]
  rango: string
  unidad: string
}) {
  const [sobre, setSobre] = useState<number | null>(null)
  const n = valores.length
  const i = sobre ?? n - 1
  const max = Math.max(...valores)

  return (
    <>
      {/* La cifra arriba del gráfico, como en SerieLinea: en la referencia los
          valores nunca viven sobre el trazo. */}
      <div className="min-w-0">
        <span className="s-micro block" style={{ color: 'var(--ink-2)' }}>
          {rotulos[i]}
        </span>
        <p className="m-0 mt-0.5 flex items-baseline gap-1.5">
          <span className="s-titulo s-num">{textos[i]}</span>
          <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
            {unidad}
          </span>
        </p>
      </div>

      <div className="s-hundido mt-2.5">
        <div className="s-hundido-bar">
          <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
            Pozos nuevos por mes
          </span>
          <span className="s-chip s-chip--neutro s-chip--mini shrink-0">
            {sobre === null ? rango : rotulos[sobre]}
          </span>
        </div>

        <div className="px-2.5 pt-3 pb-2">
          <span
            className="s-cols"
            onMouseLeave={() => setSobre(null)}
            role="img"
            aria-label={`Serie de ${n} meses, máximo ${max}`}
          >
            {valores.map((v, k) => (
              <span key={k} title={textos[k]} onMouseEnter={() => setSobre(k)}>
                <i
                  /* Piso de 2px: un mes de 3 pozos contra un máximo de 80 da
                     menos de un píxel y desaparece, y un hueco en la serie se
                     lee como «no hay dato» cuando lo que hay es un dato bajo. */
                  className={k === sobre ? 'on' : undefined}
                  style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
                />
              </span>
            ))}
          </span>
          <div className="mt-0.5 flex justify-between">
            <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
              {rotulos[0]}
            </span>
            <span className="s-mono text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
              {rotulos[n - 1]}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
