'use client'

// "Argentina en el mundo" — the catapult section. Frames Vaca Muerta's potential
// against the world: where Argentina ranks today (real EIA data), where the 2030
// target would put it (the rank jump), the climb it has already made, and the
// fastest-growing peers it sits among. Closes with the policy levers that turn
// potential into realised production. Copy is Spanish-first, like the uranium
// narrative; figures come from the backend `mundo` block.

import { useEffect, useRef } from 'react'
import { animate, prefersReducedMotion, useInView } from './anim'
import { formatFigure, formatDeltaPct, tierColor, tierLabel } from './format'
import { MacroChart } from './MacroChart'
import type {
  InvMundo,
  InvMundoRanking,
  InvMundoGrowth,
  InvPolitica,
  InvPolicyLever,
  InvRigi,
} from '@/api/inversiones'

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

// Fallback copy if the backend hasn't shipped the computed `politica` block yet.
const FALLBACK_POLITICA: InvPolitica = {
  intro: {
    title: 'La política que convierte potencial en producción',
    text: 'El recurso ya existe. Lo que cambió es el marco: las medidas actuales destraban la inversión necesaria para que la proyección se realice — y con ella, el salto en el ranking mundial.',
  },
  levers: [
    { tag: 'Cambiario', title: 'Normalización del tipo de cambio y acceso a divisas para exportadores', indicator: null },
    { tag: 'Exportación', title: 'Fin de los cupos y retenciones a la exportación de crudo y gas', indicator: null },
    { tag: 'RIGI', title: 'Régimen de Incentivo a Grandes Inversiones: estabilidad fiscal a 30 años', indicator: null },
    { tag: 'Fiscal', title: 'Disciplina fiscal y desregulación que anclan la previsibilidad de inversión', indicator: null },
  ],
  charts: [],
}

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

      {/* Policy levers → GDP impact */}
      <PolicyStrip politica={mundo.politica} />
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

function PolicyStrip({ politica }: { politica?: InvPolitica }) {
  const p = politica ?? FALLBACK_POLITICA
  const chartById = new Map(p.charts.map((c) => [c.id, c]))
  return (
    <div className="border-t border-nd-border pt-8">
      <h3 className="mb-2 text-lg text-nd-text-display md:text-xl font-display">{p.intro.title}</h3>
      <p className="mb-8 max-w-2xl text-pretty text-sm leading-relaxed text-nd-text-secondary font-sans">
        {p.intro.text}
      </p>

      {/* Sourced economic charts — the data behind the policy story */}
      {p.charts.length ? (
        <div className="mb-10 grid grid-cols-1 gap-px overflow-hidden border border-nd-border bg-nd-border lg:grid-cols-2">
          {p.charts.map((c) => (
            <div key={c.id} className="bg-nd-surface p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm text-nd-text-display font-display">{c.title}</h4>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">{c.unit}</span>
              </div>
              <MacroChart chart={c} />
              <span className="mt-2 inline-block font-mono text-[10px] text-nd-text-disabled">
                {c.source.label} · {c.source.asOf}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* RIGI oil & gas projects — committed investment */}
      {p.rigi && p.rigi.projects.length ? <RigiBlock rigi={p.rigi} /> : null}

      {/* Levers, each with its measurable indicator */}
      <div className="grid grid-cols-1 gap-px overflow-hidden border border-nd-border bg-nd-border sm:grid-cols-2">
        {p.levers.map((lever) => (
          <LeverCard key={lever.tag} lever={lever} hasChart={lever.chartId ? chartById.has(lever.chartId) : false} />
        ))}
      </div>

      {/* The GDP payoff */}
      {p.impacto ? (
        <div className="mt-8 border border-nd-accent/30 bg-nd-surface-raised/40 p-6 md:p-8">
          <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-accent">
            Impacto · si la proyección se realiza
          </span>
          <p className="mt-3 max-w-2xl text-pretty text-xl leading-snug text-nd-text-display md:text-2xl font-display">
            {p.impacto.headline}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
            {p.impacto.items.map((it) => (
              <div key={it.label}>
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
                  {it.label}
                </span>
                <span
                  className="mt-1 block text-3xl leading-none tabular-nums md:text-4xl font-display"
                  style={{ color: tierColor(it.tier) }}
                >
                  {formatFigure(it.value, it.format)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl font-mono text-[10px] leading-relaxed text-nd-text-disabled">
            Supuestos:
            {p.impacto.assumptions.priceUsd != null
              ? ` precio de exportación US$${p.impacto.assumptions.priceUsd}/bbl (${p.impacto.assumptions.priceBasis});`
              : ''}
            {p.impacto.assumptions.todayBblD != null && p.impacto.assumptions.targetBblD != null
              ? ` producción ${nf.format(p.impacto.assumptions.todayBblD)} → ${nf.format(p.impacto.assumptions.targetBblD)} bbl/d;`
              : ''}
            {p.impacto.assumptions.gdpUsd != null && p.impacto.assumptions.gdpYear != null
              ? ` PBI US$${nf.format(p.impacto.assumptions.gdpUsd / 1e9)} B (${p.impacto.assumptions.gdpYear}).`
              : ''}{' '}
            Proyección ilustrativa, no es un pronóstico. {p.impacto.source.label} · {p.impacto.source.asOf}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function RigiBlock({ rigi }: { rigi: InvRigi }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const projects = rigi.projects
  const max = Math.max(...projects.map((p) => p.investmentMusd ?? 0), 1)
  const totalB = rigi.totalMusd / 1000
  const isOil = (s: string) => s === 'petroleo'
  const color = (s: string) => (isOil(s) ? 'var(--nd-accent)' : 'var(--nd-interactive)')

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return
    const anims = barRefs.current.map((el, i) => {
      if (!el) return undefined
      const target = Number(el.dataset.pct ?? '0')
      el.style.width = '0%'
      return animate(el, { width: `${target}%`, duration: 800, delay: i * 70, ease: 'outCubic' })
    })
    return () => anims.forEach((a) => a?.pause?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <div ref={ref} className="mb-10 border border-nd-border bg-nd-surface p-5 md:p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-base text-nd-text-display font-display">{rigi.title}</h4>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled">
          {rigi.count} proyectos · US${totalB.toLocaleString('es-AR', { maximumFractionDigits: 1 })} B
        </span>
      </div>
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.06em] text-nd-text-disabled">{rigi.subtitle}</p>

      <div className="flex flex-col">
        {projects.map((pr, i) => {
          const usd = pr.investmentMusd ?? 0
          const pct = (usd / max) * 100
          return (
            <div key={pr.name} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-nd-border py-2.5">
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-sans text-sm text-nd-text-display">{pr.name}</span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-nd-text-secondary">
                    US${(usd / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} B
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-nd-border">
                  <div
                    ref={(el) => {
                      barRefs.current[i] = el
                    }}
                    data-pct={pct}
                    className="h-full"
                    style={{ width: `${pct}%`, background: color(pr.sector) }}
                  />
                </div>
                {pr.operator || pr.province ? (
                  <span className="mt-1 block font-mono text-[10px] text-nd-text-disabled">
                    {[pr.operator, pr.province].filter(Boolean).join(' · ')}
                  </span>
                ) : null}
              </div>
              <span
                className="font-mono text-[9px] uppercase tracking-[0.06em]"
                style={{ color: color(pr.sector) }}
              >
                {isOil(pr.sector) ? 'petróleo' : 'gas'}
              </span>
            </div>
          )
        })}
      </div>
      <span className="mt-3 inline-block font-mono text-[10px] text-nd-text-disabled">
        {rigi.source.label} · {rigi.source.asOf}
      </span>
    </div>
  )
}

function LeverCard({ lever, hasChart }: { lever: InvPolicyLever; hasChart: boolean }) {
  const ind = lever.indicator
  return (
    <div className="bg-nd-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-nd-accent">{lever.tag}</span>
        {hasChart ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-nd-text-disabled">↑ ver gráfico</span>
        ) : null}
      </div>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-nd-text-display font-sans">{lever.title}</p>
      {ind ? (
        <div className="mt-4 border-t border-nd-border pt-3">
          <span className="block font-mono text-[10px] uppercase tracking-[0.06em] text-nd-text-disabled">
            {ind.label}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl leading-none tabular-nums text-nd-text-display font-display">
              {formatFigure(ind.value, ind.format)}
            </span>
            {ind.delta ? (
              <span
                className="font-mono text-[11px] tabular-nums"
                style={{ color: ind.delta.pct >= 0 ? 'var(--nd-success)' : 'var(--nd-accent)' }}
              >
                {formatDeltaPct(ind.delta.pct)}
              </span>
            ) : null}
          </div>
          <span className="mt-2 inline-block font-mono text-[9px] uppercase tracking-[0.06em]" style={{ color: tierColor(ind.tier) }}>
            {tierLabel(ind.tier)}
          </span>
        </div>
      ) : lever.milestone ? (
        <div className="mt-4 border-t border-nd-border pt-3">
          <p className="text-pretty text-[13px] leading-relaxed text-nd-text-secondary font-sans">{lever.milestone}</p>
          {lever.source?.url ? (
            <a
              href={lever.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-mono text-[10px] text-nd-interactive underline-offset-2 hover:underline"
            >
              {lever.source.label} ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
