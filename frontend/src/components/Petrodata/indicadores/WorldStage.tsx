'use client'

// "Argentina en el mundo" — the catapult section. Frames Vaca Muerta's potential
// against the world: where Argentina ranks today (real EIA data), where the 2030
// target would put it (the rank jump), the climb it has already made, and the
// fastest-growing peers it sits among. Closes with the policy levers that turn
// potential into realised production. Copy is Spanish-first, like the uranium
// narrative; figures come from the backend `mundo` block.

import { useEffect, useRef } from 'react'
import { animate, prefersReducedMotion, useInView } from './anim'
import type { InvMundo, InvMundoRanking, InvMundoGrowth } from '@/api/inversiones'

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

// Friendly unit labels for the marketing surface (raw EIA units are terse).
function unitLabel(unit: string): string {
  switch (unit) {
    case 'TBPD':
      return 'mil bbl/d'
    case 'BCF':
      return 'BCF/año'
    default:
      return unit
  }
}

// Policy levers — the "monetary policy as enabler" thread. Curated narrative.
const POLICY_LEVERS = [
  { tag: 'Cambiario', text: 'Normalización del tipo de cambio y acceso a divisas para exportadores' },
  { tag: 'Exportación', text: 'Fin de los cupos y retenciones a la exportación de crudo y gas' },
  { tag: 'RIGI', text: 'Régimen de Incentivo a Grandes Inversiones: estabilidad fiscal a 30 años' },
  { tag: 'Fiscal', text: 'Disciplina fiscal y desregulación que anclan la previsibilidad de inversión' },
]

export function WorldStage({ mundo }: { mundo: InvMundo }) {
  return (
    <div className="flex flex-col gap-14">
      {/* Shale headline — the resource claim */}
      <ShaleBanner shale={mundo.shale} />

      {/* Per-product: rank jump + world leaderboard */}
      {mundo.rankings.map((r) => (
        <RankingBlock key={r.product} ranking={r} />
      ))}

      {/* Fastest-growing producers — where Argentina shines */}
      {mundo.fastestGrowing.map((g) => (
        <GrowthBlock key={g.product} growth={g} />
      ))}

      {/* Policy levers */}
      <PolicyStrip />
    </div>
  )
}

function ShaleBanner({ shale }: { shale: InvMundo['shale'] }) {
  return (
    <div className="border border-nd-border bg-nd-surface-raised/40 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <RankBadge n={shale.gasRank} label="shale gas" />
        <RankBadge n={shale.oilRank} label="shale oil" />
        <p className="max-w-md flex-1 text-pretty text-base leading-snug text-nd-text-display font-display">
          {shale.note}
        </p>
      </div>
      <span className="mt-5 inline-block font-mono text-[10px] text-nd-text-disabled">
        Referencia · {shale.source.label}
      </span>
    </div>
  )
}

function RankBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[11px] text-nd-text-disabled">#</span>
      <span className="text-5xl leading-none tabular-nums text-nd-accent font-display md:text-6xl">{n}</span>
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-nd-text-secondary">{label}</span>
    </div>
  )
}

function RankingBlock({ ranking }: { ranking: InvMundoRanking }) {
  const arg = ranking.argentina
  const jump = arg ? arg.rank - ranking.projected.rank : null
  const u = unitLabel(ranking.unit)

  return (
    <div className="border-t border-nd-border pt-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg text-nd-text-display md:text-xl font-display">
          {ranking.label} · producción mundial
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {ranking.countries} países · {ranking.year}
        </span>
      </div>

      {/* The rank jump */}
      {arg ? (
        <div className="mb-8 grid grid-cols-1 gap-px overflow-hidden border border-nd-border bg-nd-border sm:grid-cols-[1fr_auto_1fr]">
          <RankStat
            kicker="Hoy"
            rank={arg.rank}
            value={`${nf.format(arg.value)} ${u}`}
            color="var(--nd-text-display)"
          />
          <div className="flex items-center justify-center bg-nd-surface px-6 py-4">
            <span className="text-2xl text-nd-accent" aria-hidden>
              →
            </span>
            {jump != null && jump > 0 ? (
              <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.06em] text-nd-accent">
                +{jump} puestos
              </span>
            ) : null}
          </div>
          <RankStat
            kicker={`Proyectado ${ranking.projected.year}`}
            rank={ranking.projected.rank}
            value={`${nf.format(ranking.projected.value)} ${u}`}
            color="#f59e0b"
          />
        </div>
      ) : null}

      {/* World leaderboard with Argentina highlighted + projected marker */}
      <WorldLeaderboard ranking={ranking} />

      <span className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled">
        Computado · {ranking.source.label} · {ranking.source.asOf}
      </span>
    </div>
  )
}

function RankStat({
  kicker,
  rank,
  value,
  color,
}: {
  kicker: string
  rank: number
  value: string
  color: string
}) {
  return (
    <div className="bg-nd-surface px-6 py-5">
      <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
        {kicker}
      </span>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-sm text-nd-text-disabled">#</span>
        <span className="text-4xl leading-none tabular-nums md:text-5xl font-display" style={{ color }}>
          {rank}
        </span>
      </div>
      <span className="mt-2 block font-mono text-[11px] tabular-nums text-nd-text-secondary">{value}</span>
    </div>
  )
}

function WorldLeaderboard({ ranking }: { ranking: InvMundoRanking }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const rows = ranking.top
  const max = Math.max(...rows.map((r) => r.value), 1)
  const u = unitLabel(ranking.unit)

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return
    const anims = barRefs.current.map((el, i) => {
      if (!el) return undefined
      const target = Number(el.dataset.pct ?? '0')
      el.style.width = '0%'
      return animate(el, { width: `${target}%`, duration: 800, delay: i * 50, ease: 'outCubic' })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <div ref={ref} className="flex flex-col">
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100
        const arg = r.isArgentina
        return (
          <div
            key={r.iso3}
            className="group grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 border-b border-nd-border py-2.5 transition-colors duration-200 hover:bg-nd-surface-raised/60"
            style={arg ? { background: 'color-mix(in srgb, var(--nd-accent) 8%, transparent)' } : undefined}
          >
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: arg ? 'var(--nd-accent)' : 'var(--nd-text-disabled)' }}
            >
              {String(r.rank).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="truncate font-sans text-sm"
                  style={{ color: arg ? 'var(--nd-accent)' : 'var(--nd-text-display)', fontWeight: arg ? 600 : 400 }}
                >
                  {r.country}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-nd-text-secondary">
                  {nf.format(r.value)} {u}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-nd-border">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  data-pct={pct}
                  className="h-full"
                  style={{ width: `${pct}%`, background: arg ? 'var(--nd-accent)' : 'var(--nd-text-disabled)', opacity: arg ? 1 : 0.55 }}
                />
              </div>
            </div>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.06em]"
              style={{ color: arg ? 'var(--nd-accent)' : 'transparent' }}
            >
              {arg ? 'ARG' : '·'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function GrowthBlock({ growth }: { growth: InvMundoGrowth }) {
  const rows = growth.leaders
  const max = Math.max(...rows.map((r) => Math.abs(r.growthPct)), 1)
  return (
    <div className="border-t border-nd-border pt-8">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg text-nd-text-display md:text-xl font-display">
          {growth.label} · productores de mayor crecimiento
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {growth.sinceYear}–{growth.toYear}
        </span>
      </div>
      <p className="mb-5 max-w-2xl text-pretty text-sm leading-relaxed text-nd-text-secondary font-sans">
        Entre los grandes productores, Argentina es de los que más rápido crece
        {growth.argentinaRank ? ` (puesto ${growth.argentinaRank})` : ''} — el ritmo que la proyección extiende.
      </p>
      <div className="flex flex-col">
        {rows.map((r) => {
          const arg = r.isArgentina
          const pct = (Math.abs(r.growthPct) / max) * 100
          return (
            <div
              key={r.iso3}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-nd-border py-2.5"
              style={arg ? { background: 'color-mix(in srgb, var(--nd-accent) 8%, transparent)' } : undefined}
            >
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="truncate font-sans text-sm"
                    style={{ color: arg ? 'var(--nd-accent)' : 'var(--nd-text-display)', fontWeight: arg ? 600 : 400 }}
                  >
                    {r.country}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-nd-border">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: arg ? 'var(--nd-accent)' : 'var(--nd-text-disabled)', opacity: arg ? 1 : 0.55 }}
                  />
                </div>
              </div>
              <span
                className="font-mono text-[12px] tabular-nums"
                style={{ color: arg ? 'var(--nd-accent)' : 'var(--nd-text-secondary)' }}
              >
                {r.growthPct >= 0 ? '+' : ''}
                {nf.format(r.growthPct)}%
              </span>
            </div>
          )
        })}
      </div>
      <span className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled">
        Computado · {growth.source.label} · {growth.source.asOf}
      </span>
    </div>
  )
}

function PolicyStrip() {
  return (
    <div className="border-t border-nd-border pt-8">
      <h3 className="mb-2 text-lg text-nd-text-display md:text-xl font-display">
        La política que convierte potencial en producción
      </h3>
      <p className="mb-6 max-w-2xl text-pretty text-sm leading-relaxed text-nd-text-secondary font-sans">
        El recurso ya existe. Lo que cambió es el marco: las medidas actuales destraban la inversión
        necesaria para que la proyección se realice — y con ella, el salto en el ranking mundial.
      </p>
      <div className="grid grid-cols-1 gap-px overflow-hidden border border-nd-border bg-nd-border sm:grid-cols-2">
        {POLICY_LEVERS.map((p) => (
          <div key={p.tag} className="bg-nd-surface p-5">
            <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-accent">{p.tag}</span>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-nd-text-display font-sans">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
