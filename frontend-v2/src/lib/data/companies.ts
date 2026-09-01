/* Empresas — GET /api/v2/companies + /prices + /api/v1/operators/contribution.
   Devuelve la forma del fixture Company (ranking, pctNacional, pctValor, bolsa). */

import { api } from '@/api/client'
import type { Company } from '@/fixtures/companies'
import { COMPANIES as FIXTURE_COMPANIES } from '@/fixtures/companies'
import { num, str, withFallback } from './fallback'

export async function loadCompanies(): Promise<Company[]> {
  return withFallback(
    'companies',
    async () => {
      const [companiesRes, pricesRes, contributionRes] = await Promise.all([
        api.GET('/api/v2/companies', { next: { revalidate: 300 } }),
        api.GET('/api/v2/companies/prices', { next: { revalidate: 300 } }),
        api
          .GET('/api/v1/operators/contribution', { next: { revalidate: 3600 } })
          .catch(() => null),
      ])
      const list = companiesRes.data?.data
      if (companiesRes.error || !list?.length) return null

      const priceBySlug = new Map<string, { price: number; change: number }>()
      if (!pricesRes.error && pricesRes.data?.data) {
        for (const p of pricesRes.data.data) {
          const price = num(p.price)
          const change = num(p.change_pct)
          if (price != null) priceBySlug.set(p.slug, { price, change: change ?? 0 })
        }
      }

      const totalValue = contributionRes?.data?.data?.totals?.gross_value_usd
      const valueShare = new Map<string, number>()
      if (totalValue) {
        for (const o of contributionRes.data?.data?.operators ?? []) {
          valueShare.set(o.operator_slug, o.gross_value_usd / totalValue)
        }
      }

      const fixtureBySlug = new Map(FIXTURE_COMPANIES.map((c) => [c.slug, c]))

      return list
        .filter((c) => c.type !== 'mining')
        .filter((c) => c.national_share_boe != null)
        .sort((a, b) => (b.national_share_boe ?? 0) - (a.national_share_boe ?? 0))
        .map((c, i): Company => {
          const fx = fixtureBySlug.get(c.slug)
          const price = priceBySlug.get(c.slug)
          const share = c.national_share_boe ?? 0
          const value = valueShare.get(c.slug)
          return {
            rank: i + 1,
            slug: c.slug,
            name: c.name,
            sector: c.sector,
            pctNacional: Math.round(share * 1000) / 10,
            pctValor: Math.round((value ?? share) * 1000) / 10,
            proyectos: c.project_count_oil_gas,
            isPublic: c.is_public,
            exchange: str(c.stock_exchange) ?? undefined,
            ticker: str(c.stock_ticker) ?? undefined,
            price: price?.price,
            change: price?.change,
            website: fx?.website,
            logoUrl: str(c.logo_url) ?? fx?.logoUrl,
            blurb: fx?.blurb,
          }
        })
    },
    () => FIXTURE_COMPANIES,
  )
}
