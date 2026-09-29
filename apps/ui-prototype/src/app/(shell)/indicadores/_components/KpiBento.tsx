'use client'

/* "La tesis en seis datos" — versión ESTRATO en bento oscuro (pedido de
   Mariano, 2026-08-07): cards negras con marco de 4px, rombo + hairline
   como rótulo, Inter Tight para las cifras y grilla bento 4-col:
   producción (héroe, 2 col) y superávit (2 col) anclan la diagonal.
   Conserva el count-up on-scroll (reduced-motion muestra el valor
   final directo). */

import { useEffect, useRef } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { useMounted } from '../_lib/useMounted'
import { animateCounter, useInView } from '../_lib/anim'
import { formatCompact } from '../_lib/formatNumber'
import { fmtPeriod, formatDeltaPct, formatFigure } from './format'
import type { InvKpi, KpiViz, MiniTipSpec, ShareRow } from '../_lib/types'

/* La card es SIEMPRE oscura: status vivo del tema dark */
const CONFIRMED = '#2fe0a4'



/* Bento 4-col: héroe y cierre en doble ancho, el resto simple */
const SPAN: Record<string, string> = {
  produccion_vm: 'sm:col-span-2',
  superavit_energia: 'sm:col-span-2',
}

/** Proporción (share %): mini-leaderboard de 2 filas a la receta del 06 —
    nombre + valor absoluto · % en la misma línea de base, barra
    redondeada a todo el ancho. Anclado al fondo de la card (mt-auto)
    para que no quede espacio muerto cuando la fila estira. */
function ShareBlock({ rows, color }: { rows: ShareRow[]; color: string }) {
  return (
    <div className="mt-auto flex flex-col gap-3.5">
      {rows.map((r, i) => {
        const vm = i === 0
        const pctLabel = r.pct.toLocaleString('es-AR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
        return (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={`type-label flex items-center gap-1.5 ${vm ? '!text-on-dark-2' : '!text-on-dark-3'}`}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: vm ? color : 'rgba(255,255,255,0.4)' }}
                />
                {r.label}
              </span>
              <span className="type-label tnums !text-on-dark-3">
                {r.value} ·{' '}
                <span className="font-semibold" style={{ color: vm ? color : '#fff' }}>
                  {pctLabel}%
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${r.pct}%`, background: vm ? color : 'rgba(255,255,255,0.35)' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Valor de la serie según su spec (entero es-AR o USD compacto) */
function fmtTipValue(y: number, tip: MiniTipSpec): string {
  if (tip.kind === 'usd') {
    const scaled = y * (tip.scale ?? 1)
    return `${scaled < 0 ? '-' : ''}US$${formatCompact(Math.abs(scaled))}`
  }
  return `${new Intl.NumberFormat('es-AR').format(Math.round(y))}${tip.suffix ?? ''}`
}

type MiniTipPayload = { value?: number | string }

/** Tooltip oscuro Estrato (receta única): card negra radio 8, período
    legible en on-dark-2, valor blanco tnums — negativo en rojo vivo */
function MiniTipCard({
  active,
  payload,
  label,
  tip,
  signed,
}: {
  active?: boolean
  payload?: MiniTipPayload[]
  label?: string | number
  tip: MiniTipSpec
  signed?: boolean
}) {
  if (!active || !payload || !payload.length) return null
  const y = Number(payload[0]?.value)
  if (!Number.isFinite(y)) return null
  return (
    <div className="rounded-[8px] border border-white/15 bg-[#04060a] px-3 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)]">
      <div className="type-label-md mb-1.5 border-b border-white/10 pb-1.5 !text-on-dark-2">
        {fmtPeriod(String(label))}
      </div>
      <div className="text-[12px] tnums" style={{ color: signed && y < 0 ? '#ff6d5f' : '#fff' }}>
        {fmtTipValue(y, tip)}
      </div>
    </div>
  )
}

/** Sparkline/mini-barras con recharts (sin ejes visibles: puro gesto,
    con el valor en hover — pedido de Mariano) */
function MiniChart({ viz, height }: { viz: Extract<KpiViz, { kind: 'area' | 'line' | 'bars' | 'signed-bars' }>; height: number }) {
  const mounted = useMounted()
  if (!mounted) return <div style={{ height }} aria-hidden />
  const margin = { top: 2, right: 0, bottom: 0, left: 0 }
  /* punto activo como el mock: centro blanco con aro oscuro */
  const activeDot = { r: 3.5, fill: '#fff', stroke: '#04060a', strokeWidth: 2 }
  const tooltip = (
    <Tooltip
      content={<MiniTipCard tip={viz.tip} signed={viz.kind === 'signed-bars'} />}
      cursor={
        viz.kind === 'bars' || viz.kind === 'signed-bars'
          ? { fill: 'rgba(255,255,255,0.06)' }
          : { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1 }
      }
      allowEscapeViewBox={{ x: false, y: true }}
      wrapperStyle={{ zIndex: 20, outline: 'none' }}
      isAnimationActive={false}
    />
  )
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {viz.kind === 'area' ? (
          <AreaChart data={viz.data} margin={margin}>
            <defs>
              <linearGradient id={`kb-${viz.color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={viz.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={viz.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="x" hide />
            {tooltip}
            <Area
              type="monotone"
              dataKey="y"
              stroke={viz.color}
              strokeWidth={1.5}
              fill={`url(#kb-${viz.color.replace(/[^a-z]/gi, '')})`}
              isAnimationActive={false}
              activeDot={activeDot}
            />
          </AreaChart>
        ) : viz.kind === 'line' ? (
          <LineChart data={viz.data} margin={margin}>
            <XAxis dataKey="x" hide />
            {tooltip}
            <Line
              type="monotone"
              dataKey="y"
              stroke={viz.color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              activeDot={activeDot}
            />
          </LineChart>
        ) : (
          <BarChart data={viz.data} margin={margin} barCategoryGap={viz.kind === 'signed-bars' ? '25%' : '35%'}>
            {viz.kind === 'signed-bars' && <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />}
            <XAxis dataKey="x" hide />
            {tooltip}
            <Bar dataKey="y" isAnimationActive={false}>
              {viz.data.map((p) => (
                <Cell
                  key={p.x}
                  fill={viz.kind === 'signed-bars' && p.y < 0 ? '#ff6d5f' : viz.color}
                  fillOpacity={viz.kind === 'signed-bars' ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function KpiTile({
  kpi,
  hero,
  viz,
  figureRef,
}: {
  kpi: InvKpi
  hero: boolean
  viz?: KpiViz
  figureRef: (el: HTMLSpanElement | null) => void
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[10px] border-4 border-black bg-inverse p-5 ${
        SPAN[kpi.id] ?? ''
      }`}
    >
      {/* Rótulo: rombo + label SIEMPRE en 1 línea (pedido de Mariano) —
          los textos viven en la fixture ya acortados para no desbordar */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rotate-45"
          style={{ background: CONFIRMED }}
        />
        <span className="type-label-md whitespace-nowrap !leading-none !tracking-[0.12em] !text-on-dark-2">
          {kpi.label}
        </span>
      </div>

      <span
        ref={figureRef}
        className={`type-kpi !text-white ${
          hero
            ? 'text-[2.6rem] sm:text-[3.1rem]'
            : viz?.kind === 'share'
              ? 'text-3xl md:text-4xl'
              : 'text-3xl'
        }`}
      >
        {formatFigure(kpi.figure.value, kpi.format)}
      </span>
      {kpi.delta && (
        <span
          className="tnums inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
          style={{ color: CONFIRMED, background: 'color-mix(in srgb, #2fe0a4 12%, transparent)' }}
        >
          {formatDeltaPct(kpi.delta.pct)} {kpi.delta.base}
        </span>
      )}

      {/* Tendencia/proporción real, PEGADA a la cifra (nada flotando) */}
      {viz &&
        (viz.kind === 'share' ? (
          <ShareBlock rows={viz.rows} color={viz.color} />
        ) : (
          <MiniChart viz={viz} height={hero ? 64 : 40} />
        ))}
    </div>
  )
}

export function KpiBento({ kpis, viz }: { kpis: InvKpi[]; viz?: Record<string, KpiViz> }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 })
  const figureRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (!inView || !kpis.length) return
    const anims = kpis.map((kpi, i) => {
      const el = figureRefs.current[i]
      if (!el) return undefined
      return animateCounter(el, kpi.figure.value, {
        duration: 1700,
        delay: i * 110,
        format: (v) => formatFigure(v, kpi.format),
      })
    })
    return () => anims.forEach((a) => a?.pause?.())
  }, [inView, kpis])

  if (!kpis.length) return null
  return (
    <div ref={ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <KpiTile
          key={kpi.id}
          kpi={kpi}
          hero={kpi.id === 'produccion_vm'}
          viz={viz?.[kpi.id]}
          figureRef={(el) => {
            figureRefs.current[i] = el
          }}
        />
      ))}
    </div>
  )
}
