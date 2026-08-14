'use client'

// Transport infrastructure block for the indicadores page. Shows the trunk
// network that evacuates production — total km split gas/oil, plus a leaderboard
// of gas transport pipeline km by licenciataria (TGS, TGN, …). Derived from the
// official Secretaría de Energía / ENARGAS datasets (geometry only — the source
// carries no throughput), via scripts/build-pipelines.py → pipelineStats.ts.

import { useEffect, useRef } from 'react'
import { useTranslations } from '../_lib/messages'
import { animate, animateCounter, prefersReducedMotion, useInView } from '../_lib/anim'
import { PIPELINE_STATS } from '../_lib/pipelineStats'

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const GAS_COLOR = 'var(--data-gas)'
const OIL_COLOR = 'var(--data-oil)'

export function TransportInfra() {
  const t = useTranslations('indicadores')
  const s = PIPELINE_STATS
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const max = Math.max(...s.operators.map((o) => o.km), 1)

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return
    const anims = barRefs.current.map((el, i) => {
      if (!el) return undefined
      const target = Number(el.dataset.pct ?? '0')
      el.style.width = '0%'
      return animate(el, { width: `${target}%`, duration: 800, delay: i * 60, ease: 'outCubic' })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <div ref={ref}>
      {/* Summary: total network split gas / oil */}
      <div className="mb-8 grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
        <Stat
          label={t('transportNetwork')}
          km={s.totalKm}
          unit={t('kmUnit')}
          sub={t('transportSegments', { count: s.gasSegments + s.oilSegments })}
          color="var(--text-primary)"
          inView={inView}
        />
        <Stat
          label={t('transportGas')}
          km={s.gasKm}
          unit={t('kmUnit')}
          sub={t('transportSegments', { count: s.gasSegments })}
          color={GAS_COLOR}
          inView={inView}
        />
        <Stat
          label={t('transportOil')}
          km={s.oilKm}
          unit={t('kmUnit')}
          sub={t('transportSegments', { count: s.oilSegments })}
          color={OIL_COLOR}
          inView={inView}
        />
      </div>

      {/* Gas transport km by operator */}
      <div>
        <span className="row-bleed type-label block border-b pb-2">{t('transportByOperator')}</span>
        {/* Receta del 06 (referencia de Mariano): ranking numerado con líder
            destacado, hover por fila, dato + % en la línea del nombre y
            barra redondeada a todo el ancho */}
        <div className="flex flex-col">
          {s.operators.map((o, i) => {
            const pct = (o.km / max) * 100
            const sharePct = (o.km / s.gasKm) * 100
            const leader = i === 0
            return (
              <div
                key={o.operator}
                className="row-bleed group grid grid-cols-[1.5rem_1fr] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
              >
                <span
                  className="text-[11px] tnums"
                  style={{ color: leader ? 'var(--data-gas)' : 'var(--text-tertiary)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="truncate text-sm text-primary"
                      style={{ fontWeight: leader ? 600 : 400 }}
                    >
                      {o.operator}
                    </span>
                    <span className="shrink-0 text-[11px] tnums text-secondary">
                      {nf.format(o.km)} {t('kmUnit')} ·{' '}
                      <span
                        className="font-semibold"
                        style={{ color: leader ? 'var(--data-gas)' : 'var(--text-primary)' }}
                      >
                        {sharePct.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      ref={(el) => {
                        barRefs.current[i] = el
                      }}
                      data-pct={pct}
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: GAS_COLOR, opacity: leader ? 1 : 0.85 }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <span className="mt-3 inline-block text-[10px] text-tertiary">
        {s.source.label} · Update {s.source.asOf}
      </span>
    </div>
  )
}

function Stat({
  label,
  km,
  unit,
  sub,
  color,
  inView,
}: {
  label: string
  km: number
  unit: string
  sub: string
  color: string
  inView: boolean
}) {
  /* contador animado (paridad con las anclas de las cards 01-04) */
  const numRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!inView || !numRef.current) return
    if (prefersReducedMotion()) {
      numRef.current.textContent = nf.format(km)
      return
    }
    const a = animateCounter(numRef.current, km, {
      duration: 1400,
      delay: 200,
      format: (v) => nf.format(Math.round(v)),
    })
    return () => {
      a?.pause?.()
    }
  }, [inView, km])

  /* Celda a escala del 06: label type-label → valor type-kpi xl/2xl con la
     unidad chica al lado (no gigante adentro del número) → nota */
  return (
    <div className="bg-surface p-4">
      <span className="type-label block">{label}</span>
      <span className="mt-2 flex items-baseline gap-1.5">
        <span className="type-kpi text-xl md:text-2xl" style={{ color }}>
          <span ref={numRef}>{nf.format(km)}</span>
        </span>
        <span className="text-sm font-normal text-secondary">{unit}</span>
      </span>
      <span className="mt-1 block text-[10px] text-tertiary">{sub}</span>
    </div>
  )
}
