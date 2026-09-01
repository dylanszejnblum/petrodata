/* Provincias — GET /api/v2/provinces + /provinces/export-summary.
   Los números vienen de la API; el contenido editorial (basin, blurb,
   operators destacadas) del fixture scrapeado, mergeado por slug. */

import { api } from '@/api/client'
import type { Province } from '@/fixtures/provinces'
import { PROVINCES as FIXTURE_PROVINCES } from '@/fixtures/provinces'
import { withFallback } from './fallback'

export async function loadProvinces(): Promise<Province[]> {
  return withFallback(
    'provinces',
    async () => {
      const [listRes, exportsRes] = await Promise.all([
        api.GET('/api/v2/provinces', { next: { revalidate: 3600 } }),
        api.GET('/api/v2/provinces/export-summary', { next: { revalidate: 3600 } }),
      ])
      const list = listRes.data?.data
      if (listRes.error || !list?.length) return null

      const summary = exportsRes.error ? null : exportsRes.data?.data
      const fixtureBySlug = new Map(FIXTURE_PROVINCES.map((p) => [p.slug, p]))
      const national = summary?.national_total_usd ?? 0

      return list.map((p): Province => {
        const fx = fixtureBySlug.get(p.slug)
        const row = summary?.provinces.find((r) => r.slug === p.slug)
        const exportsMUSD = row ? Math.round(row.total_export_usd / 1e6) : (fx?.exportsMUSD ?? 0)
        return {
          slug: p.slug,
          name: p.name,
          basin: fx?.basin ?? '—',
          wells: p.oil_gas_wells,
          exportsMUSD,
          expSharePct:
            national > 0 && row
              ? Math.round((row.total_export_usd / national) * 1000) / 10
              : (fx?.expSharePct ?? 0),
          featured: fx?.featured,
          operators: fx?.operators,
          blurb: fx?.blurb ?? '',
        }
      })
    },
    () => FIXTURE_PROVINCES,
  )
}

export type ExportsSummary = {
  totalBUSD: number
  sectors: { name: string; busd: number; sharePct: number }[]
}

/** Exportaciones nacionales por sector (para /exportaciones). */
export async function loadExportsSummary(): Promise<ExportsSummary> {
  return withFallback(
    'exportsSummary',
    async () => {
      const { data, error } = await api.GET('/api/v2/provinces/export-summary', {
        next: { revalidate: 3600 },
      })
      if (error || !data?.data) return null
      const total = data.data.national_total_usd
      if (!total) return null
      const sectors = Object.entries(data.data.national_by_sector)
        .sort((a, b) => b[1] - a[1])
        .map(([name, usd]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          busd: Math.round((usd / 1e9) * 100) / 100,
          sharePct: Math.round((usd / total) * 1000) / 10,
        }))
      if (!sectors.length) return null
      return { totalBUSD: Math.round((total / 1e9) * 100) / 100, sectors }
    },
    () => ({
      totalBUSD: 17.1,
      sectors: [
        { name: 'Petróleo', busd: 8.5, sharePct: 49.9 },
        { name: 'Gas', busd: 3.2, sharePct: 18.8 },
        { name: 'Minería', busd: 5.35, sharePct: 31.4 },
      ],
    }),
  )
}

export type ProvinceDetailLive = {
  oilBblD: number
  gasMmcfD: number
  activeWells: number
  vmPct: number
  topOperators: { slug: string; name: string; boe: number }[]
  production: { period: string; oil: number; gas: number }[]
}

/** Ficha de provincia en vivo (chart + stats). Null → usar la serie ilustrativa. */
export async function loadProvinceDetail(slug: string): Promise<ProvinceDetailLive | null> {
  try {
    const [detailRes, prodRes] = await Promise.all([
      api.GET('/api/v2/provinces/{slug}', {
        params: { path: { slug } },
        next: { revalidate: 3600 },
      }),
      api.GET('/api/v2/provinces/{slug}/production', {
        params: { path: { slug } },
        next: { revalidate: 3600 },
      }),
    ])
    if (detailRes.error || !detailRes.data?.data) return null
    const d = detailRes.data.data
    const points = prodRes.error ? [] : (prodRes.data?.data ?? [])
    return {
      oilBblD: d.oil_gas?.production_oil_bbl_d ?? 0,
      gasMmcfD: d.oil_gas?.production_gas_mmcf_d ?? 0,
      activeWells: d.oil_gas?.active_wells ?? 0,
      vmPct: d.oil_gas?.vm_pct ?? 0,
      topOperators: (d.oil_gas?.top_operators ?? []).map((o) => ({
        slug: o.operator_slug,
        name: o.operator_name,
        boe: o.boe,
      })),
      production: points.map((p) => ({
        period: p.date_month.slice(0, 7),
        oil: p.oil_bbl_d,
        gas: p.gas_mmcf_d * 0.0283168466,
      })),
    }
  } catch {
    return null
  }
}
