/* KeyPoints — "Puntos clave" del artículo. Componente del pipeline de
   noticias: recibe los bullets ya extraídos (en producción los generará el
   pipeline editorial/IA; acá vienen del mock).
   Composición Estrato: card plana con rótulo técnico y viñetas de rombo
   (la marca) en el color de acento de la categoría si se pasa. */

export function KeyPoints({
  points,
  accent = 'var(--text-primary)',
}: {
  points: string[]
  /** color del rombo de cada bullet (ej: el color del bucket de la categoría) */
  accent?: string
}) {
  if (points.length === 0) return null
  return (
    /* Sin card: solo líneas divisorias arriba (junto al rótulo) y abajo
       (decisión de Mariano) */
    <aside aria-label="Puntos clave" className="my-8">
      <h2 className="type-label-md m-0 flex items-center gap-2 !tracking-[0.14em] !text-primary">
        Puntos clave
        <span aria-hidden className="h-px flex-1 bg-line" />
      </h2>
      <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-body">
            <span
              aria-hidden
              className="mt-[7px] size-1.5 shrink-0 rotate-45"
              style={{ background: accent }}
            />
            {point}
          </li>
        ))}
      </ul>
      <span aria-hidden className="mt-5 block h-px bg-line" />
    </aside>
  )
}
