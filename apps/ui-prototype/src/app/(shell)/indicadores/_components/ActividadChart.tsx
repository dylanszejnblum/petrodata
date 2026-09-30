'use client'

/* Actividad (pozos nuevos por mes) — alineada con las cards 01/02
   (receta de Mariano, 2026-08-08): dato ancla animado + delta YoY derivado
   de la serie, barras en VERDE data-oil (la preliminar más clara), tooltip
   oscuro con fecha legible y leyenda del dato preliminar. */

import { useEffect, useRef } from 'react'
import { useTranslations } from '../_lib/messages'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMounted } from '../_lib/useMounted'
import { formatCompact } from '../_lib/formatNumber'
import { animateCounter, prefersReducedMotion, useInView } from '../_lib/anim'
import { fmtPeriod } from './format'
import { YoyChip } from './YoyChip'
import type { InvActividad } from '../_lib/types'

const OIL = 'var(--data-oil)'
const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

type Row = { period: string; nuevosPozos: number; preliminary: boolean }

export function ActividadChart({ actividad }: { actividad: InvActividad }) {
  const t = useTranslations('indicadores')
  const mounted = useMounted()
  const rows: Row[] = actividad.points.map((p) => ({
    period: p.period,
    nuevosPozos: p.nuevosPozos,
    preliminary: p.preliminary,
  }))
  const hasPrelim = rows.some((r) => r.preliminary)

  /* Dato ancla: último mes CONFIRMADO + variación vs 12 meses atrás */
  const confirmed = actividad.points.filter((p) => !p.preliminary)
  const lastConfirmed = confirmed[confirmed.length - 1]
  const yearAgo = lastConfirmed
    ? actividad.points.find((p) => {
        const [y, m] = lastConfirmed.period.split('-')
        return p.period === `${Number(y) - 1}-${m}`
      })
    : undefined
  const yoyPct =
    lastConfirmed && yearAgo && yearAgo.nuevosPozos > 0
      ? (lastConfirmed.nuevosPozos / yearAgo.nuevosPozos - 1) * 100
      : null

  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const headRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!inView || !headRef.current || !lastConfirmed) return
    if (prefersReducedMotion()) {
      headRef.current.textContent = nf0.format(lastConfirmed.nuevosPozos)
      return
    }
    const a = animateCounter(headRef.current, lastConfirmed.nuevosPozos, {
      duration: 1200,
      delay: 250,
      format: (v) => nf0.format(Math.round(v)),
    })
    return () => {
      a?.pause?.()
    }
  }, [inView, lastConfirmed])

  if (!rows.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-tertiary md:h-[240px]">
        {t('charts.noActivity')}
      </div>
    )
  }

  return (
    <div ref={ref} className="flex flex-col gap-5">
      {/* Dato ancla (paridad con las cards 01/02) */}
      {lastConfirmed && (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="type-label block">
              Pozos nuevos · {fmtPeriod(lastConfirmed.period)}
            </span>
            <span className="type-kpi mt-1 block text-3xl md:text-4xl">
              <span ref={headRef}>{nf0.format(lastConfirmed.nuevosPozos)}</span>
              <span className="ml-1 text-base font-normal text-secondary">pozos</span>
            </span>
          </div>
          {yoyPct != null && <YoyChip pct={yoyPct} />}
        </div>
      )}

      <div className="h-[200px] w-full md:h-[240px]">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border-default)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={fmtPeriod}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-default)' }}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v) => formatCompact(v as number)}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-schibsted)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={
                  <ActividadTooltip prelimLabel={t('charts.preliminary')} wellsLabel={t('charts.wells')} />
                }
                cursor={{ fill: 'var(--border-default)', fillOpacity: 0.3 }}
              />
              <Bar dataKey="nuevosPozos" isAnimationActive animationDuration={800}>
                {rows.map((r) => (
                  <Cell key={r.period} fill={OIL} fillOpacity={r.preliminary ? 0.35 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {hasPrelim && (
        <p className="type-label">
          <span
            className="mr-1.5 inline-block size-2.5 rounded-[2px] align-middle"
            style={{ background: OIL, opacity: 0.35 }}
          />
          {t('charts.preliminaryPartial')}
        </p>
      )}
    </div>
  )
}

type TooltipPayload = { value?: number; payload?: Row }

function ActividadTooltip({
  active,
  payload,
  prelimLabel,
  wellsLabel,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  prelimLabel?: string
  wellsLabel?: string
}) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  /* Tooltip oscuro Estrato: card negra radio 8, fecha legible (on-dark-2) */
  return (
    <div className="rounded-[8px] border border-white/15 bg-[#04060a] px-3 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)]">
      <div className="type-label-md mb-1.5 flex items-center justify-between gap-4 border-b border-white/10 pb-1.5 !text-on-dark-2">
        <span>{fmtPeriod(row.period)}</span>
        {row.preliminary && <span style={{ color: '#e2a33f' }}>{prelimLabel}</span>}
      </div>
      <div className="text-[12px] tnums text-white">
        {new Intl.NumberFormat('es-AR').format(row.nuevosPozos)} {wellsLabel}
      </div>
    </div>
  )
}
