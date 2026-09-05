'use client'

/* LA NOTA DE LA CARD DEL RANKING: cuántos votos y cuánta gente.

   Era una línea de texto plano —«1.284 votos de 377 personas · se reordena en
   8 h 10 min»— con todo del mismo peso y del mismo gris, así que no se leía ni
   la cifra ni la cuenta regresiva.

   Quedan dos piezas del sistema y ninguna nueva:

   · el punto que late (s-pixel, §7). Dice que el conteo está abierto. Es el
     único movimiento permanente de la card, y el sistema pide que haya alguno.
   · las cifras en mono y tinta plena, las palabras en ink-2 (§8.6: la mono es
     para lo que se cuenta). La jerarquía la hace el peso y el color, nunca el
     tamaño — todo sigue a 11,5.

   VA DEBAJO DEL RÓTULO (pedido de Mariano, 2026-09-02) y por eso alinea a la
   izquierda: cuelga de «El ranking» y dice de qué tamaño es lo que se está
   mirando. Los dos chips de estado —el presupuesto y el corte— se fueron a la
   nota, contra el borde derecho, en `EstadoVoto`. */
export function CabeceraVotos({ votos, personas }: { votos: number; personas: number }) {
  const n = (v: number) => v.toLocaleString('es-AR')
  return (
    <span className="flex items-center gap-1.5">
      <i
        className="s-pixel block size-1.5 shrink-0 rounded-full"
        style={{ background: 'var(--accent)' }}
        aria-hidden
      />
      <span style={{ color: 'var(--ink-2)' }}>
        <b className="s-mono font-medium" style={{ color: 'var(--ink)' }}>
          {n(votos)}
        </b>{' '}
        votos ·{' '}
        <b className="s-mono font-medium" style={{ color: 'var(--ink)' }}>
          {n(personas)}
        </b>{' '}
        personas
      </span>
    </span>
  )
}
