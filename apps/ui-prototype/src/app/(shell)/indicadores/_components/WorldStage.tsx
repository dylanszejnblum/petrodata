'use client'

// "Argentina en el mundo" — the catapult section. Frames Vaca Muerta's potential
// against the world: where Argentina ranks today (real EIA data), where the 2030
// target would put it (the rank jump), the climb it has already made, and the
// fastest-growing peers it sits among. All UI copy is localised via the
// `indicadores` namespace (`world.*`); only data values (country names, source
// labels, backend-provided narrative) stay in their source language.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations, type T } from '../_lib/messages'
import { animate, animateCounter, prefersReducedMotion, useInView } from '../_lib/anim'
import { fmtUpdate, formatFigure } from './format'

import { MacroChart } from './MacroChart'
import type {
  InvMundo,
  InvMundoRanking,
  InvMundoGrowth,
  InvPolitica,
  InvRigi,
} from '../_lib/types'

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

// Friendly unit labels for the marketing surface (raw EIA units are terse).
function unitLabel(unit: string, t: T): string {
  switch (unit) {
    case 'TBPD':
      return t('world.unitTbpd')
    case 'BCF':
      return t('world.unitBcf')
    default:
      return unit
  }
}

/** Bandera argentina plana (franjas + sol sin rayos — sobria, sin emoji).
    La ALTURA se fija por MEDICIÓN del bloque de texto que acompaña
    (ResizeObserver en el consumidor) y el ancho sale de la proporción
    oficial 9:14 — igualdad garantizada, no un truco de layout. */
function ArgFlag({ height }: { height: number | null }) {
  return (
    <span
      aria-hidden
      className="block shrink-0 overflow-hidden rounded-[4px]"
      /* fallback SSR ~2 líneas de ancla; el observer lo exactifica al montar */
      style={
        height
          ? { height, width: Math.round(height * (14 / 9)) }
          : { height: '3.1rem', width: '4.8rem' }
      }
    >
      <svg viewBox="0 0 14 9" className="block h-full w-full" preserveAspectRatio="none">
        <rect width="14" height="3" fill="#74ACDF" />
        <rect y="3" width="14" height="3" fill="#ffffff" />
        <rect y="6" width="14" height="3" fill="#74ACDF" />
        <circle cx="7" cy="4.5" r="1.05" fill="#F6B40E" />
      </svg>
    </span>
  )
}

/* El viejo mega-bloque "Argentina en el mundo" se partió en secciones
   numeradas propias (pedido de Mariano, 2026-08-08): 08 rankings EIA ·
   09 crecimiento comparado · 10 política económica · 11 RIGI · 12 impacto.
   Cada export es una sección; la página les pone SectionLabel y número. */

/** 08 · Argentina en el mundo — rankings mundiales EIA (hoy vs proyectado) */
export function WorldRankings({ mundo }: { mundo: InvMundo }) {
  if (!mundo.rankings.length) {
    return <p className="text-sm text-tertiary">Sin datos de rankings.</p>
  }
  return (
    <div className="flex flex-col gap-6">
      {mundo.rankings.map((r) => (
        <RankingBlock key={r.product} ranking={r} />
      ))}
    </div>
  )
}

/** 09 · Productores de mayor crecimiento (petróleo y gas) */
export function WorldGrowth({ mundo }: { mundo: InvMundo }) {
  if (!mundo.fastestGrowing.length) {
    return <p className="text-sm text-tertiary">Sin datos de crecimiento.</p>
  }
  return (
    <div className="flex flex-col gap-6">
      {mundo.fastestGrowing.map((g) => (
        <GrowthBlock key={g.product} growth={g} />
      ))}
    </div>
  )
}

function RankingBlock({ ranking }: { ranking: InvMundoRanking }) {
  const t = useTranslations('indicadores')
  const arg = ranking.argentina

  /* La bandera copia la altura EXACTA del bloque label+cifra, medida con
     ResizeObserver (corrección de Mariano, 2026-08-08: nada de trucos de
     stretch sin verificar) */
  const anchorTextRef = useRef<HTMLDivElement>(null)
  const [flagH, setFlagH] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = anchorTextRef.current
    if (!el) return
    const measure = () => setFlagH(Math.round(el.getBoundingClientRect().height))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Ancla con contador (patrón de las cards 01-04): el destino #15 anima */
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const destRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!inView || !destRef.current || !arg) return
    if (prefersReducedMotion()) {
      destRef.current.textContent = String(ranking.projected.rank)
      return
    }
    const a = animateCounter(destRef.current, ranking.projected.rank, {
      duration: 900,
      delay: 250,
      format: (v) => String(Math.round(v)),
    })
    return () => {
      a?.pause?.()
    }
  }, [inView, arg, ranking.projected.rank])

  return (
    <div ref={ref} className="rounded-[10px] border bg-surface p-5 md:p-6">
      {/* Header de card (composición de Mariano, 2026-08-08): título con el
          contexto de países/año como segunda línea a la izquierda; el ancla
          del salto en el ángulo superior derecho, alineada a la derecha */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div>
          <h3 className="type-h2 !text-[1.15rem] md:!text-[1.25rem]">
            {t('world.worldProduction', { label: ranking.label })}
          </h3>
          <span className="type-label mt-1 block">
            {t('world.countriesCount', { countries: String(ranking.countries) })}
          </span>
          <span className="type-label mt-0.5 block tnums">{ranking.year}</span>
        </div>
        {arg ? (
          /* bandera a la izquierda, con la altura medida de label + cifra */
          <div className="flex items-start gap-3">
            <ArgFlag height={flagH} />
            <div ref={anchorTextRef} className="sm:text-right">
              {/* leading-none: sin el aire extra del line-height heredado, el
                  borde superior de la bandera queda al ras del texto */}
              <span className="type-label block !leading-none">
                {t('world.jumpLabel', { year: String(ranking.projected.year) })}
              </span>
              <span className="type-kpi mt-1 flex flex-wrap items-baseline gap-x-2.5 text-3xl sm:justify-end md:text-4xl">
                <span>
                  <span className="text-xl font-normal text-tertiary">#</span>
                  {arg.rank}
                </span>
                <span aria-hidden className="text-2xl font-normal text-oil">
                  →
                </span>
                <span>
                  <span className="text-xl font-normal text-tertiary">#</span>
                  <span ref={destRef}>{ranking.projected.rank}</span>
                </span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* World leaderboard con Argentina destacada (color + bold + tag ARG) */}
      <WorldLeaderboard ranking={ranking} />

      <span className="mt-3 inline-block text-[10px] text-tertiary">
        {ranking.source.label} · Update {fmtUpdate(ranking.source.asOf)}
      </span>
    </div>
  )
}

function WorldLeaderboard({ ranking }: { ranking: InvMundoRanking }) {
  const t = useTranslations('indicadores')
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const rows = ranking.top
  const max = Math.max(...rows.map((r) => r.value), 1)
  const u = unitLabel(ranking.unit, t)

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
        /* Receta 06: rank 1.5rem · py-3 · destaque solo con color+bold
           (sin tinte de fondo ni emoji); el tag ARG va INLINE en la línea
           de base del nombre — nada de columnas con placeholders invisibles */
        return (
          <div
            key={r.iso3}
            className="row-bleed group grid grid-cols-[1.5rem_1fr] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
          >
            <span
              className="text-[11px] tnums"
              style={{ color: arg ? 'var(--data-oil)' : 'var(--text-tertiary)' }}
            >
              {String(r.rank).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span
                    className="truncate text-sm"
                    style={{ color: arg ? 'var(--data-oil)' : 'var(--text-primary)', fontWeight: arg ? 600 : 400 }}
                  >
                    {r.country}
                  </span>
                  {arg && <span className="type-label shrink-0 !text-oil">ARG</span>}
                </span>
                <span className="shrink-0 text-[11px] tnums text-secondary">
                  {nf.format(r.value)} {u}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  data-pct={pct}
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: arg ? 'var(--data-oil)' : 'var(--text-tertiary)', opacity: arg ? 1 : 0.55 }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GrowthBlock({ growth }: { growth: InvMundoGrowth }) {
  const t = useTranslations('indicadores')
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
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
  const rows = growth.leaders
  const max = Math.max(...rows.map((r) => Math.abs(r.growthPct)), 1)
  const rankSuffix = growth.argentinaRank
    ? t('world.growthRank', { rank: String(growth.argentinaRank) })
    : ''
  return (
    <div className="rounded-[10px] border bg-surface p-5 md:p-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="type-h2 !text-[1.15rem] md:!text-[1.25rem]">
          {t('world.fastestGrowing', { label: growth.label })}
        </h3>
        <span className="type-label">
          {growth.sinceYear}–{growth.toYear}
        </span>
      </div>
      <p className="mb-5 max-w-2xl text-pretty text-sm leading-relaxed text-secondary">
        {t('world.growthBlurb', { rank: rankSuffix })}
      </p>
      {/* Receta 06 completa: rank 01.., destaque solo color+bold+tag inline,
          % de crecimiento EN LA LÍNEA DE BASE del nombre (no en columna
          aparte centrada — el error del 05 que marcó Mariano) */}
      <div ref={ref} className="flex flex-col">
        {rows.map((r, i) => {
          const arg = r.isArgentina
          const pct = (Math.abs(r.growthPct) / max) * 100
          return (
            <div
              key={r.iso3}
              className="row-bleed group grid grid-cols-[1.5rem_1fr] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
            >
              <span
                className="text-[11px] tnums"
                style={{ color: arg ? 'var(--data-oil)' : 'var(--text-tertiary)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className="truncate text-sm"
                      style={{ color: arg ? 'var(--data-oil)' : 'var(--text-primary)', fontWeight: arg ? 600 : 400 }}
                    >
                      {r.country}
                    </span>
                    {arg && <span className="type-label shrink-0 !text-oil">ARG</span>}
                  </span>
                  <span
                    className="shrink-0 text-[11px] tnums font-semibold"
                    style={{ color: arg ? 'var(--data-oil)' : 'var(--text-primary)' }}
                  >
                    {r.growthPct >= 0 ? '+' : ''}
                    {nf.format(r.growthPct)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    ref={(el) => {
                      barRefs.current[i] = el
                    }}
                    data-pct={pct}
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: arg ? 'var(--data-oil)' : 'var(--text-tertiary)', opacity: arg ? 1 : 0.55 }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <span className="mt-3 inline-block text-[10px] text-tertiary">
        {growth.source.label} · Update {fmtUpdate(growth.source.asOf)}
      </span>
    </div>
  )
}


// Fallback si el backend aún no envió el bloque `politica` computado.
function fallbackPolitica(t: T): InvPolitica {
  return {
    intro: {
      title: t('world.policyFallbackTitle'),
      text: t('world.policyFallbackText'),
    },
    charts: [],
  }
}

/** 10 · Política económica — narrativa + charts macro */
export function PoliticaMacro({ politica }: { politica?: InvPolitica }) {
  const t = useTranslations('indicadores')
  const p = politica ?? fallbackPolitica(t)
  return (
    <div className="rounded-[10px] border bg-surface p-5 md:p-6">
      <h3 className="type-h2 mb-2 !text-[1.15rem] md:!text-[1.25rem]">{p.intro.title}</h3>
      <p className="mb-8 max-w-2xl text-pretty text-sm leading-relaxed text-secondary">
        {p.intro.text}
      </p>

      {/* Sourced economic charts — the data behind the policy story */}
      {p.charts.length ? (
        <div className="mb-10 grid grid-cols-1 gap-px bg-line lg:grid-cols-2">
          {p.charts.map((c) => (
            <div key={c.id} className="bg-surface p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="type-h2 !text-[1rem]">{c.title}</h4>
                <span className="type-label">{c.unit}</span>
              </div>
              <MacroChart chart={c} />
              <span className="mt-2 inline-block text-[10px] text-tertiary">
                {c.source.label} · Update {fmtUpdate(c.source.asOf)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

    </div>
  )
}

/** 12 · Impacto proyectado — el payoff si la proyección se realiza */
export function ImpactoPanel({ impacto }: { impacto: NonNullable<InvPolitica['impacto']> }) {
  const t = useTranslations('indicadores')
  return (
    <div className="rounded-[10px] border-4 border-black bg-inverse p-5 md:p-6">
      <span className="type-label block !text-oil">{t('world.impactKicker')}</span>
      <p className="type-display mt-3 max-w-2xl text-pretty !text-[1.5rem] !leading-[1.25] !text-white md:!text-[1.75rem]">
        {impacto.headline}
      </p>
      <div className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
        {impacto.items.map((it) => (
          <div key={it.label}>
            <span className="type-label block !text-on-dark-2">{it.label}</span>
            <span className="type-kpi mt-1 block text-3xl !text-white md:text-4xl">
              {formatFigure(it.value, it.format)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-[10px] leading-relaxed text-on-dark-3">
        {t('world.assumptions')}
        {impacto.assumptions.priceUsd != null
          ? t('world.assumptionPrice', {
              price: String(impacto.assumptions.priceUsd),
              basis: impacto.assumptions.priceBasis ?? '',
            })
          : ''}
        {impacto.assumptions.todayBblD != null && impacto.assumptions.targetBblD != null
          ? t('world.assumptionProd', {
              from: nf.format(impacto.assumptions.todayBblD),
              to: nf.format(impacto.assumptions.targetBblD),
            })
          : ''}
        {impacto.assumptions.gdpUsd != null && impacto.assumptions.gdpYear != null
          ? t('world.assumptionGdp', {
              gdp: nf.format(impacto.assumptions.gdpUsd / 1e9),
              year: String(impacto.assumptions.gdpYear),
            })
          : ''}{' '}
        {t('world.illustrative')} {impacto.source.label} · Update {fmtUpdate(impacto.source.asOf)}
      </p>
    </div>
  )
}

/** 11 · RIGI — inversión comprometida en petróleo y gas (card propia) */
export function RigiSection({ rigi }: { rigi: InvRigi }) {
  const t = useTranslations('indicadores')
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const projects = rigi.projects
  const max = Math.max(...projects.map((p) => p.investmentMusd ?? 0), 1)
  const totalB = rigi.totalMusd / 1000
  const isOil = (s: string) => s === 'petroleo'
  const color = (s: string) => (isOil(s) ? 'var(--data-oil)' : 'var(--data-gas)')

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
    <div ref={ref} className="rounded-[10px] border bg-surface p-5 md:p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="type-h2 !text-[1rem]">{rigi.title}</h4>
      </div>
      <p className="type-label mb-5 block">{rigi.subtitle}</p>

      {/* Receta 06: rank 01.., líder (mayor inversión) en color+bold, hover,
          monto + % del total en la línea del nombre, y el tag de sector
          INLINE (no en columna centrada aparte) */}
      <div className="flex flex-col">
        {projects.map((pr, i) => {
          const usd = pr.investmentMusd ?? 0
          const pct = (usd / max) * 100
          const sharePct = (usd / (rigi.totalMusd || 1)) * 100
          const leader = i === 0
          return (
            <div
              key={pr.name}
              className="row-bleed group grid grid-cols-[1.5rem_1fr] items-center gap-x-4 border-b py-3 transition-colors duration-200 hover:bg-raised/60"
            >
              <span
                className="text-[11px] tnums"
                style={{ color: leader ? color(pr.sector) : 'var(--text-tertiary)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className="truncate text-sm text-primary"
                      style={{ fontWeight: leader ? 600 : 400 }}
                    >
                      {pr.name}
                    </span>
                    <span className="type-label shrink-0" style={{ color: color(pr.sector) }}>
                      {isOil(pr.sector) ? t('world.sectorOil') : t('world.sectorGas')}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] tnums text-secondary">
                    US${(usd / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} B ·{' '}
                    <span
                      className="font-semibold"
                      style={{ color: leader ? color(pr.sector) : 'var(--text-primary)' }}
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
                    style={{ width: `${pct}%`, background: color(pr.sector), opacity: leader ? 1 : 0.85 }}
                  />
                </div>
                {pr.operator || pr.province ? (
                  <span className="mt-1 block text-[10px] text-tertiary">
                    {[pr.operator, pr.province].filter(Boolean).join(' · ')}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <span className="mt-3 inline-block text-[10px] text-tertiary">
        {rigi.source.label} · Update {fmtUpdate(rigi.source.asOf)}
      </span>
    </div>
  )
}

