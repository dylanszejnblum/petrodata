import { ButtonLink } from './button'

/* EmptyState — distingue "vacío" (no hay datos) de "error" (algo falló).
   Fix del anti-patrón return-null-silencioso de producción. */

export function EmptyState({
  kind = 'empty',
  title,
  detail,
  actionHref,
  actionLabel,
}: {
  kind?: 'empty' | 'error' | 'offline'
  title?: string
  detail?: string
  actionHref?: string
  actionLabel?: string
}) {
  const defaults = {
    empty: { title: 'Sin resultados', detail: 'No hay datos para los filtros elegidos.' },
    error: { title: 'No pudimos cargar los datos', detail: 'Algo falló de nuestro lado. Probá de nuevo en unos minutos.' },
    offline: { title: 'Datos no disponibles', detail: 'La fuente de datos no responde en este momento.' },
  }[kind]

  return (
    <div
      role={kind === 'empty' ? undefined : 'alert'}
      className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-6 py-12 text-center"
    >
      <span aria-hidden className={`size-1.5 rounded-full ${kind === 'empty' ? 'bg-line-strong' : 'bg-negative'}`} />
      <p className="type-h2 !text-[1.05rem]">{title ?? defaults.title}</p>
      <p className="max-w-[26rem] text-[13px] text-secondary">{detail ?? defaults.detail}</p>
      {actionHref && (
        <ButtonLink href={actionHref} variant="outline" size="sm" className="mt-3">
          {actionLabel ?? 'Volver'}
        </ButtonLink>
      )}
    </div>
  )
}
