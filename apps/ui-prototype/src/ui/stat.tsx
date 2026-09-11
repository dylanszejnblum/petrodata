'use client'

import { useCountUp, useInView } from '@/lib/motion'
import { Icon, type IconName } from '@/ui/icon'
import { formatCompact, formatDelta, formatInteger, formatPercent, type AppLocale } from '@/lib/format'

/* Stat — colapsa las 10 implementaciones de label+valor de producción.
   Semántica <dl>; contador con reduced-motion; SSR muestra el valor final. */

export type StatProps = {
  label: React.ReactNode
  value: number
  format?: 'compact' | 'integer' | 'percent'
  /** glifo delante del rótulo (dashboard). Se pasa por nombre: el Stat es
      cliente y una función no cruza el borde desde el server component. */
  icon?: IconName
  /** color del glifo. Por defecto sigue al rótulo. */
  iconColor?: string
  unit?: React.ReactNode
  delta?: number | null
  footnote?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  onDark?: boolean
  locale?: AppLocale
}

function fmt(v: number, kind: NonNullable<StatProps['format']>, locale: AppLocale) {
  if (kind === 'compact') return formatCompact(v, locale)
  if (kind === 'percent') return formatPercent(v, 1, locale)
  return formatInteger(v, locale)
}

export function Stat({
  label,
  value,
  format = 'integer',
  icon,
  iconColor,
  unit,
  delta = null,
  footnote,
  size = 'md',
  animate = false,
  onDark = false,
  locale = 'es',
}: StatProps) {
  const { ref, inView } = useInView<HTMLDListElement>()
  const shown = useCountUp(value, { enabled: animate && inView })
  const d = formatDelta(delta, locale)

  return (
    <dl ref={ref} className="flex min-w-0 flex-col gap-2">
      <dt className={`type-label flex items-center gap-2 ${onDark ? '!text-on-dark-3' : ''}`}>
        {icon && (
          <Icon
            name={icon}
            className="shrink-0"
            style={iconColor ? { color: iconColor } : undefined}
          />
        )}
        {label}
      </dt>
      <dd className="m-0 flex items-baseline gap-1.5">
        <span
          className={[
            'type-kpi',
            size === 'lg'
              ? 'text-[2.6rem] md:text-[3rem]'
              : size === 'sm'
                ? 'text-[1.35rem]'
                : 'text-[1.9rem] md:text-[2.2rem]',
            onDark ? '!text-on-dark' : '',
          ].join(' ')}
        >
          {fmt(animate ? shown : value, format, locale)}
        </span>
        {unit && (
          <span className={`text-[11px] ${onDark ? 'text-on-dark-3' : 'text-tertiary'}`}>{unit}</span>
        )}
      </dd>
      {(footnote || d) && (
        <dd className={`m-0 mt-auto flex items-center justify-between gap-2 type-label tnums ${onDark ? '!text-on-dark-3' : ''}`}>
          <span>{footnote}</span>
          {d && (
            <span className={d.dir === 'up' ? '!text-positive' : '!text-negative'}>
              {d.arrow} {d.label}
            </span>
          )}
        </dd>
      )}
    </dl>
  )
}
