'use client'

/* Pulso — el indicador de "datos en vivo" del sistema.

   El sistema medido tiene movimiento permanente: en reposo la referencia
   corre ~29 animaciones a la vez. Una página quieta con estos tokens queda
   prolija y muerta, así que la identidad pide al menos una pieza latiendo.
   Esta es la nuestra: tres barras de ecualizador y una grilla de píxeles,
   los dos recursos que la referencia usa para decir "esto está corriendo".

   Va en CSS puro y el corte global de reduced-motion lo detiene. */

export function Pulso() {
  return (
    <span className="flex shrink-0 items-center gap-2" aria-hidden>
      {/* h-2.5 y gap 2: la caja del MEDIDOR de la referencia, 4×10 por
          barra. Estaba en h-3 con 2px de ancho, medidas inventadas. */}
      <span className="s-eq flex h-2.5 items-end gap-[2px]">
        <i />
        <i />
        <i />
      </span>
      <span className="s-micro" style={{ color: 'var(--ink-3)' }}>
        en vivo
      </span>
    </span>
  )
}

/* Grilla de píxeles: el cargador de la referencia. Se usa donde algo todavía
   no llegó, en vez de un spinner. */
export function Pixeles({ label = 'Cargando' }: { label?: string }) {
  return (
    <span className="flex items-center gap-2" aria-label={label}>
      <span className="grid grid-cols-3 gap-[2px]" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <i
            key={i}
            className="s-pixel block size-[3px] rounded-[1px]"
            style={{ background: 'var(--ink-3)', animationDelay: `${i * 90}ms` }}
          />
        ))}
      </span>
      <span className="s-micro" style={{ color: 'var(--ink-3)' }}>
        {label}
      </span>
    </span>
  )
}
