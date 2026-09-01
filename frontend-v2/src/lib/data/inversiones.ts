/* Indicadores — GET /api/v2/inversiones (fetchInversiones) +
   /api/v1/operators/contribution (CONTRIBUTION) + /api/v1/prices/energy
   (Brent spot para la card del valor de un día).
   Fallback: fixture (copia del payload RSC de producción, mismas formas). */

import { api } from '@/api/client'
import { fetchInversiones, type InversionesData, type InvSerie } from '@/api/inversiones'
import type { InvKpi, InvMundo } from '@/lib/types'
import {
  ACTIVIDAD,
  ASOF,
  BREAKEVEN,
  CONTRIBUTION,
  CRUCE,
  DAY_VALUE_INPUTS,
  KPIS,
  MUNDO,
  OPERADORES,
  SERIE,
} from '@/fixtures/inversiones'
import { num, withFallback } from './fallback'

/* CONTRIBUTION y DAY_VALUE_INPUTS del fixture son tipados estructurales:
   el endpoint de contribución devuelve exactamente esas formas. */
type ContributionShape = typeof CONTRIBUTION
type DayValueInputs = typeof DAY_VALUE_INPUTS

async function loadContribution(): Promise<ContributionShape | null> {
  try {
    const { data, error } = await api.GET('/api/v1/operators/contribution', {
      next: { revalidate: 3600 },
    })
    if (error || !data?.data) return null
    return data.data as unknown as ContributionShape
  } catch {
    return null
  }
}

async function loadBrentSpot(): Promise<number | null> {
  const live = await loadBrentLive()
  return live?.value ?? null
}

/** Brent vivo con su fecha: {value, asOf} desde /api/v1/prices/energy. */
export async function loadBrentLive(): Promise<{ value: number; asOf: string } | null> {
  try {
    const { data, error } = await api.GET('/api/v1/prices/energy', {
      next: { revalidate: 300 },
    })
    if (error || !data?.data) return null
    const rows = (
      data.data as unknown as { series?: string; latest?: unknown; latest_date?: unknown }[]
    ).slice()
    const brent =
      rows.find((r) => r.series === 'brent' && num(r.latest) != null) ??
      rows.find((r) => num(r.latest) != null)
    if (!brent) return null
    const asOf = typeof brent.latest_date === 'string' ? brent.latest_date : ''
    return { value: brent.latest as number, asOf }
  } catch {
    return null
  }
}

function dayValueInputs(contribution: ContributionShape | null, brent: number | null): DayValueInputs {
  if (!contribution) return DAY_VALUE_INPUTS
  const t = contribution.totals
  const a = contribution.assumptions
  return {
    oilBbl: t.oil_bbl,
    grossValueUsd: t.gross_value_usd,
    brentAvgUsd: a?.brent_avg_usd_bbl ?? DAY_VALUE_INPUTS.brentAvgUsd,
    oilDiscountUsd: a?.oil_discount_usd_bbl ?? 5,
    months: contribution.window?.months ?? 12,
    gdpUsd: t.gdp_usd ?? DAY_VALUE_INPUTS.gdpUsd,
    gdpYear: t.gdp_year ?? DAY_VALUE_INPUTS.gdpYear,
    brentSpotUsd: brent ?? DAY_VALUE_INPUTS.brentSpotUsd,
    breakevenUsd: BREAKEVEN.referenceUsd ?? DAY_VALUE_INPUTS.breakevenUsd,
  }
}

export type InversionesPayload = {
  kpis: InvKpi[]
  asof: string
  breakeven: NonNullable<InversionesData['breakeven']> | typeof BREAKEVEN
  contribution: ContributionShape
  cruce: NonNullable<InversionesData['cruce']> | typeof CRUCE
  dayValueInputs: DayValueInputs
  brentLive: { value: number; asOf: string } | null
  mundo: NonNullable<InversionesData['mundo']> | InvMundo
  operadores: InversionesData['operadores'] | typeof OPERADORES
  serie: InvSerie
  actividad: NonNullable<InversionesData['actividad']> | typeof ACTIVIDAD
}

export async function loadInversiones(lang: string): Promise<InversionesPayload> {
  const [inv, contribution, brent] = await Promise.all([
    fetchInversiones(lang === 'en' ? 'en' : 'es').catch(() => null),
    loadContribution(),
    loadBrentLive(),
  ])

  return {
    kpis: inv?.kpis?.length ? inv.kpis : KPIS,
    asof: inv?.asOf ?? ASOF,
    breakeven: inv?.breakeven ?? BREAKEVEN,
    contribution: contribution ?? CONTRIBUTION,
    cruce: inv?.cruce ?? CRUCE,
    dayValueInputs: dayValueInputs(contribution, brent?.value ?? null),
    brentLive: brent,
    mundo: inv?.mundo ?? MUNDO,
    operadores: inv?.operadores?.length ? inv.operadores : OPERADORES,
    serie: inv?.serie ?? ({ id: 'rampa_produccion', ...SERIE } satisfies InvSerie),
    actividad: inv?.actividad ?? ACTIVIDAD,
  }
}

/** Sólo la serie mensual VM (petróleo/gas) para el dashboard. */
export async function loadVmSerie(lang: string): Promise<InvSerie> {
  const inv = await fetchInversiones(lang === 'en' ? 'en' : 'es').catch(() => null)
  return inv?.serie ?? ({ id: 'rampa_produccion', ...SERIE } satisfies InvSerie)
}

export { withFallback }
