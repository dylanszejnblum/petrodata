/* Producción — GET /api/v1/production/latest + /monthly (agregados).
   Devuelve las formas del fixture production.ts (HEADLINE / NATIONAL_SERIES).

   ALCANCE: el sitio es de Vaca Muerta y sus cifras publicadas son de la
   formación. /api/v1/operators y /production/latest son NACIONALES, así que
   los totales VM y el ranking de operadoras salen de
   /production/monthly?formation=vaca_muerta&group_by=operator, que trae
   oil_bbl_d / gas_mm3_d / boe (mes) / active_wells por operadora y mes.
   vm_share (oil/gas/boe, fracciones) sí viene en /production/latest. */

import { api } from '@/api/client'
import type { MonthPoint } from '@/fixtures/production'
import {
  HEADLINE as FIXTURE_HEADLINE,
  NATIONAL_SERIES as FIXTURE_SERIES,
} from '@/fixtures/production'
import { VM as FIXTURE_VM } from '@/fixtures/indicadores'
import { TOP_OPERATORS as FIXTURE_OPERATORS, OIL_PRODUCERS as FIXTURE_OIL_PRODUCERS } from '@/fixtures/operators'
import type { Operator } from '@/fixtures/operators'
import { num, withFallback } from './fallback'
import { nombreOperadora } from './clasificar'

export { nombreOperadora }

export type Headline = typeof FIXTURE_HEADLINE

function daysInMonth(period: string): number {
  const [y, m] = period.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function prevPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** slug → nombre, del listado nacional de operadoras (una consulta, cacheada). */
export async function operatorNames(): Promise<Map<string, string>> {
  try {
    const { data, error } = await api.GET('/api/v1/operators', {
      params: { query: { sort: 'boe' } },
      next: { revalidate: 3600 },
    })
    const m = new Map<string, string>()
    if (error || !data?.data) return m
    for (const o of data.data) m.set(o.operator_slug, nombreOperadora(o.operator_slug, o.operator_name))
    return m
  } catch {
    return new Map()
  }
}

export type OpRow = {
  operator: string
  oil: number // bbl/d
  gas: number // mm3/d
  boe: number // mes
  wells: number
}

/** Mensual por operadora (formation=vaca_muerta → sólo la formación). */
export async function monthlyByOperator(
  from: string,
  to: string,
  opts: { vm?: boolean } = {},
): Promise<Map<string, Map<string, OpRow>>> {
  /* limit=500 es el máximo del endpoint, y la paginación viene en
     `pagination: {page, limit, total}` — NO en `meta`. Leerla del lado
     equivocado devolvía una sola página en silencio: la serie nacional de 24
     meses (1.365 filas) se quedaba con un mes y caía al fixture. */
  const query: Record<string, string> = {
    group_by: 'operator',
    from,
    to,
    limit: '500',
  }
  if (opts.vm) query.formation = 'vaca_muerta'
  const pedir = (page?: number) =>
    api.GET('/api/v1/production/monthly', {
      params: { query: (page ? { ...query, page } : query) as never },
      next: { revalidate: 300 },
    })

  const out = new Map<string, Map<string, OpRow>>()
  const { data, error } = await pedir()
  if (error || !data?.data) return out
  const rows = (data.data as Record<string, unknown>[]).slice()
  const pag = (data as { pagination?: { limit?: number; total?: number } }).pagination
  const totalPages =
    pag?.total && pag.limit ? Math.ceil(pag.total / pag.limit) : 1
  for (let p = 2; p <= Math.min(totalPages, 20); p++) {
    const next = await pedir(p)
    if (next.error || !next.data?.data) break
    rows.push(...(next.data.data as Record<string, unknown>[]))
  }
  for (const r of rows) {
    const period = String(r.date_month ?? r.period ?? '').slice(0, 7)
    if (!period) continue
    const slug = String(r.operator ?? r.operator_slug ?? '')
    if (!slug) continue
    const mes = out.get(period) ?? new Map<string, OpRow>()
    const previo = mes.get(slug)
    const row: OpRow = {
      operator: slug,
      oil: (previo?.oil ?? 0) + (num(r.oil_bbl_d) ?? 0),
      gas: (previo?.gas ?? 0) + (num(r.gas_mm3_d) ?? 0),
      boe: (previo?.boe ?? 0) + (num(r.boe) ?? 0),
      wells: (previo?.wells ?? 0) + (num(r.active_wells) ?? 0),
    }
    mes.set(slug, row)
    out.set(period, mes)
  }
  return out
}

function sumMes(mes: Map<string, OpRow> | undefined) {
  let oil = 0, gas = 0, boe = 0, wells = 0
  for (const r of mes?.values() ?? []) {
    oil += r.oil
    gas += r.gas
    boe += r.boe
    wells += r.wells
  }
  return { oil, gas, boe, wells }
}

/** /production/latest: período, vm_share y pozos activos NACIONALES. */
async function latestMeta(): Promise<{
  period: string
  vmShare: { oil: number; gas: number; boe: number }
  nationalWells: number
} | null> {
  try {
    const { data, error } = await api.GET('/api/v1/production/latest', {
      next: { revalidate: 300 },
    })
    if (error || !data?.data) return null
    const d = data.data
    const period = String(d.date_month ?? '').slice(0, 7)
    const share = d.vm_share
    if (!period || !share?.boe) return null
    return {
      period,
      vmShare: { oil: share.oil, gas: share.gas, boe: share.boe },
      nationalWells: num(d.active_wells) ?? 0,
    }
  } catch {
    return null
  }
}

async function catalogWells(): Promise<number | null> {
  try {
    const { data, error } = await api.GET('/api/v1/data-freshness', {
      next: { revalidate: 300 },
    })
    if (error || !data?.data) return null
    return num(data.data.tables?.dim_well?.rows)
  } catch {
    return null
  }
}

/** HEADLINE del dashboard: totales VM del último mes + MoM + catálogo. */
export async function loadHeadline(): Promise<Headline> {
  return withFallback(
    'headline',
    async () => {
      const meta = await latestMeta()
      if (!meta) return null
      const { period, vmShare, nationalWells } = meta

      const [mensual, catalogo] = await Promise.all([
        monthlyByOperator(prevPeriod(period), period, { vm: true }),
        catalogWells(),
      ])

      const cur = sumMes(mensual.get(period))
      const prev = sumMes(mensual.get(prevPeriod(period)))
      if (cur.boe <= 0) return null

      const pct = (a: number, b: number) => (b > 0 ? a / b - 1 : 0)

      return {
        period,
        boeMonth: Math.round(cur.boe),
        oil: Math.round(cur.oil),
        gas: Math.round(cur.gas * 10) / 10,
        vmShare: vmShare.boe,
        activeWells: nationalWells,
        momOil: prev.oil > 0 ? pct(cur.oil, prev.oil) : FIXTURE_HEADLINE.momOil,
        momGas: prev.gas > 0 ? pct(cur.gas, prev.gas) : FIXTURE_HEADLINE.momGas,
        momWells: prev.wells > 0 ? pct(cur.wells, prev.wells) : FIXTURE_HEADLINE.momWells,
        catalogWells: catalogo ?? FIXTURE_HEADLINE.catalogWells,
      }
    },
    () => FIXTURE_HEADLINE,
  )
}

/** Serie nacional mensual (24 meses) como NATIONAL_SERIES del fixture. */
export async function loadNationalSeries(): Promise<MonthPoint[]> {
  return withFallback(
    'nationalSeries',
    async () => {
      /* La ventana sale del ÚLTIMO MES REAL del backend, no del fixture: si
         entra un mes nuevo la serie lo muestra sola. 24 meses, como el fixture. */
      const meta = await latestMeta()
      const to = meta?.period ?? FIXTURE_SERIES[FIXTURE_SERIES.length - 1].period
      const from = (() => {
        const [y, m] = to.split('-').map(Number)
        const d = new Date(y, m - 24, 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })()
      const monthly = await monthlyByOperator(from, to)
      if (monthly.size < 6) return null
      return [...monthly.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([period, mes]) => {
          const t = sumMes(mes)
          return {
            period,
            oil: Math.round(t.oil),
            gas: Math.round(t.gas * 10) / 10,
            vmShare: FIXTURE_HEADLINE.vmShare,
          }
        })
    },
    () => FIXTURE_SERIES,
  )
}

/* Colores de marca por slug (los del ranking real del fixture). Los slugs
   nuevos ciclan la paleta de datos de Estrato. */
const BRAND: Record<string, string> = Object.fromEntries(
  FIXTURE_OPERATORS.map((o) => [o.slug, o.color]),
)
const PALETTE = ['#2382cf', '#3fb883', '#9a7420', '#dd4136', '#7c7977']

export function operatorColor(slug: string, index: number): string {
  return BRAND[slug] ?? PALETTE[index % PALETTE.length]
}

/** Top operadoras VM del último mes (ranking por BOE mensual, como el sitio). */
export async function loadTopOperators(limit = 5): Promise<Operator[]> {
  return withFallback(
    'operators',
    async () => {
      const meta = await latestMeta()
      if (!meta) return null
      const [mensual, nombres] = await Promise.all([
        monthlyByOperator(meta.period, meta.period, { vm: true }),
        operatorNames(),
      ])
      const filas = [...(mensual.get(meta.period)?.values() ?? [])]
        .filter((r) => r.boe > 0)
        .sort((a, b) => b.boe - a.boe)
        .slice(0, limit)
      if (!filas.length) return null
      const days = daysInMonth(meta.period)
      return filas.map((r, i) => ({
        slug: r.operator,
        name:
          nombres.get(r.operator) ??
          FIXTURE_OPERATORS.find((f) => f.slug === r.operator)?.name ??
          nombreOperadora(r.operator),
        boeMonth: Math.round(r.boe),
        boeDay: Math.round(r.boe / days),
        color: operatorColor(r.operator, i),
        ticker: FIXTURE_OPERATORS.find((f) => f.slug === r.operator)?.ticker,
      }))
    },
    () => FIXTURE_OPERATORS.slice(0, limit),
  )
}

/** Productores de petróleo NACIONALES del último mes (sección indicadores). */
export async function loadOilProducers(
  limit = 5,
): Promise<{ name: string; bbld: number; sharePct: number }[]> {
  return withFallback(
    'oilProducers',
    async () => {
      const meta = await latestMeta()
      if (!meta) return null
      const [mensual, nombres] = await Promise.all([
        monthlyByOperator(meta.period, meta.period),
        operatorNames(),
      ])
      const filas = [...(mensual.get(meta.period)?.values() ?? [])]
        .filter((r) => r.oil > 0)
        .sort((a, b) => b.oil - a.oil)
        .slice(0, limit)
      if (!filas.length) return null
      const total = filas.reduce((s, r) => s + r.oil, 0)
      return filas.map((r) => ({
        name: nombres.get(r.operator) ?? nombreOperadora(r.operator),
        bbld: Math.round(r.oil),
        sharePct: Math.round((r.oil / total) * 1000) / 10,
      }))
    },
    () => FIXTURE_OIL_PRODUCERS.slice(0, limit),
  )
}

/* ── VM (la formación dentro del total nacional) ──
   Shares, pozos y YoY en vivo desde /latest + /monthly VM. El YoY sale del
   MISMO mes del año anterior, que llega en la misma consulta: pedir la
   ventana de trece meses cuesta lo mismo que pedir uno. */
export type VmStats = {
  oilSharePct: number
  gasSharePct: number
  wells: number
  oilBbld: number
  oilYoY: number
  wellsYoY: number
  dataDate: string
}

export async function loadVM(): Promise<VmStats> {
  return withFallback(
    'vm',
    async () => {
      const meta = await latestMeta()
      if (!meta) return null
      const [y, m] = meta.period.split('-').map(Number)
      const anioAtras = `${y - 1}-${String(m).padStart(2, '0')}`
      const mensual = await monthlyByOperator(anioAtras, meta.period, { vm: true })
      const vm = sumMes(mensual.get(meta.period))
      if (vm.oil <= 0) return null
      const previo = sumMes(mensual.get(anioAtras))
      return {
        oilSharePct: Math.round(meta.vmShare.oil * 1000) / 10,
        gasSharePct: Math.round(meta.vmShare.gas * 1000) / 10,
        wells: vm.wells,
        oilBbld: Math.round(vm.oil),
        oilYoY: previo.oil > 0 ? vm.oil / previo.oil - 1 : FIXTURE_VM.oilYoY,
        wellsYoY: previo.wells > 0 ? vm.wells / previo.wells - 1 : FIXTURE_VM.wellsYoY,
        dataDate: meta.period,
      }
    },
    () => FIXTURE_VM,
  )
}

export { FIXTURE_HEADLINE, FIXTURE_SERIES }

/* ── Operadoras del país ──────────────────────────────────────────────────
   GET /api/v1/operators?sort=boe — el mismo listado que usa el mapa de la v1:
   ranking nacional por BOE del último mes, con pozos activos. El panel del
   mapa de v2 ordenaba por los pozos de la muestra (1.000), que es una foto
   parcial: con este ranking el orden y el número grande son los del país. */

export type OperadorPais = {
  slug: string
  nombre: string
  /** BOE del último mes (nacional, no sólo VM) */
  boe: number
  /** BOE/d del último mes */
  boeDia: number
  pozos: number
  mes: string
}

export async function loadOperators(limit = 20): Promise<OperadorPais[]> {
  return withFallback(
    'operators',
    async () => {
      const { data, error } = await api.GET('/api/v1/operators', {
        params: { query: { sort: 'boe', order: 'desc' } },
        next: { revalidate: 3600 },
      })
      const rows = data?.data
      if (error || !rows?.length) return null
      const dias = (m: string) => {
        const [y, mm] = m.split('-').map(Number)
        return new Date(y, mm, 0).getDate()
      }
      return rows.slice(0, limit).map((o) => {
        const mes = String(o.latest_month ?? '').slice(0, 7)
        return {
          slug: o.operator_slug,
          nombre: nombreOperadora(o.operator_slug, o.operator_name),
          boe: o.boe,
          boeDia: Math.round(o.boe / (dias(mes) || 30)),
          pozos: o.active_wells,
          mes,
        }
      })
    },
    () =>
      FIXTURE_OPERATORS.map((o) => ({
        slug: o.slug,
        nombre: o.name,
        boe: o.boeMonth,
        boeDia: o.boeDay,
        pozos: 0,
        mes: '',
      })),
  )
}
