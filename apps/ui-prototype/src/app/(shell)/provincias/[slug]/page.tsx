import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Surface } from '@/ui/surface'
import { Badge } from '@/ui/badge'
import { Stat } from '@/ui/stat'
import { SectionLabel } from '@/ui/section-label'
import { EmptyState } from '@/ui/empty-state'
import { ProportionBarList } from '@/ui/proportion-list'
import { PROVINCES } from '@/fixtures/provinces'
import { TOP_OPERATORS } from '@/fixtures/operators'
import { HEADLINE, LATEST, NATIONAL_SERIES } from '@/fixtures/production'
import { applyEstado, readMock, type SearchParams } from '@/mock/state'
import {
  formatCompact,
  formatDecimal,
  formatInteger,
  formatMonth,
  formatUSDCompact,
} from '@/lib/format'
import { ProvinceProductionChart, type ProvincePoint } from './_client/production-chart'

/* /provincias/[slug] — ficha provincial: hero photo + KPIs reales (pozos,
   exportaciones, participación exportadora) + serie ilustrativa escalada por
   pozos + operadoras destacadas del ranking real. */

/** Serie ilustrativa: escala la nacional por el peso de la provincia en pozos activos. */
function provinceSeries(wells: number): ProvincePoint[] {
  const factor = wells / HEADLINE.activeWells
  return NATIONAL_SERIES.map((p) => ({
    period: p.period,
    oil: Math.round(p.oil * factor),
    gas: Math.round(p.gas * factor * 10) / 10,
  }))
}

export default async function ProvinciaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { estado } = await readMock(searchParams)

  const province = PROVINCES.find((p) => p.slug === slug)
  if (!province) notFound()

  const series = applyEstado(estado, provinceSeries(province.wells), 6)

  const operators = (province.operators ?? [])
    .map((s) => TOP_OPERATORS.find((o) => o.slug === s))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((op) => ({
      key: op.slug,
      label: op.name,
      value: op.boeMonth,
      display: `${formatCompact(op.boeMonth)} BOE`,
      color: op.color,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="mx-auto max-w-[80rem] px-4 pb-16 md:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 pt-6 type-label md:pt-8" aria-label="Ruta">
        <Link href="/provincias" className="uppercase transition-colors hover:text-primary">
          Provincias
        </Link>
        <span aria-hidden>/</span>
        <span className="uppercase !text-primary">{province.name}</span>
      </nav>

      {/* Hero */}
      <Surface variant="photo" padding="none" className="mt-4">
        <div className="flex min-h-[19rem] flex-col justify-between gap-10 p-5 md:min-h-[22rem] md:p-9">
          <div>
            <Badge tone="on-dark">{province.basin}</Badge>
          </div>
          <div>
            <h1 className="type-display m-0 text-[clamp(2.4rem,6vw,4rem)] !text-white">
              {province.name}
            </h1>
            <p className="mt-3 max-w-[36rem] text-[13.5px] text-on-dark-2">{province.blurb}</p>
          </div>
        </div>
      </Surface>

      {/* KPIs reales */}
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
        <Stat label="Pozos" value={province.wells} animate />
        <Stat
          label="Exportaciones (US$, anual)"
          value={province.exportsMUSD * 1e6}
          format="compact"
          animate
        />
        <Stat
          label="Part. exportadora"
          value={province.expSharePct / 100}
          format="percent"
          animate
        />
      </div>

      {/* 01 · Producción histórica (ilustrativa) */}
      <section className="mt-12">
        <SectionLabel
          index="01"
          title="Producción histórica"
          note={`serie ilustrativa · ${formatMonth(NATIONAL_SERIES[0].period)} — ${formatMonth(LATEST.period)}`}
        />
        <Surface className="mt-5">
          {series === null ? (
            <EmptyState
              kind={estado === 'offline' ? 'offline' : 'error'}
              actionHref={`/provincias/${province.slug}`}
              actionLabel="Reintentar"
            />
          ) : series.length === 0 ? (
            <EmptyState
              kind="empty"
              title="Sin serie histórica"
              detail="No hay datos de producción para esta provincia."
            />
          ) : (
            <ProvinceProductionChart points={series} provinceName={province.name} />
          )}
        </Surface>
      </section>

      {/* 02 · Operadoras destacadas */}
      <section className="mt-12">
        <SectionLabel
          index="02"
          title="Operadoras destacadas"
          note={
            operators.length > 0
              ? `${formatInteger(operators.length)} compañías · BOE del mes (total país)`
              : 'sin datos'
          }
        />
        <Surface className="mt-5">
          {operators.length === 0 ? (
            <EmptyState
              kind="empty"
              title="Sin operadoras destacadas"
              detail="No registramos operadoras del ranking principal en esta provincia."
            />
          ) : (
            <ProportionBarList items={operators} />
          )}
        </Surface>
      </section>

      {/* 03 · Contexto */}
      <section className="mt-12">
        <SectionLabel index="03" title="Contexto" />
        <p className="mt-5 max-w-[46rem] text-[13.5px] text-secondary">
          {province.blurb} Con {formatInteger(province.wells)} pozos y{' '}
          {formatUSDCompact(province.exportsMUSD * 1e6)} de exportaciones anuales, {province.name}{' '}
          explica el {formatDecimal(province.expSharePct, 1)}% de las exportaciones del complejo.
          Pozos y exportaciones son datos reales de vacamuerta.io; la serie histórica es
          ilustrativa, escalada por el peso de la provincia en pozos activos.
        </p>
      </section>
    </div>
  )
}
