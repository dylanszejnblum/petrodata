import { getTranslations } from 'next-intl/server'
import type { ApiSchemas } from '@/api/client'
import { commodityColor } from './commodityColors'
import { pickGrade, pickResource } from './projectMetrics'

type Project = ApiSchemas['ProjectListItemDto']

/**
 * Uranium-specific panels: Vanadium co-occurrence stat + a side-by-side
 * comparison table across all uranium projects.
 *
 * Vanadium signal is derived from the by_products field on each project. We
 * fall back to commodity_highlights keys containing "v2o5" for projects that
 * report V₂O₅ data even if they didn't tag it explicitly in by_products.
 */
export async function UraniumSection({ projects }: { projects: Project[] }) {
  const t = await getTranslations('uraniumPage')
  if (projects.length === 0) return null

  const { color } = commodityColor('uranium')
  const vanadiumProjects = projects.filter((p) => hasVanadiumSignal(p))
  const vanadiumCount = vanadiumProjects.length

  return (
    <>
      {/* Vanadium co-occurrence stat */}
      <section className="container pb-10">
        <div className="border border-nd-border bg-nd-surface p-6 md:p-8 flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 flex flex-col gap-2">
            <span
              className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {t('vanadium.eyebrow')}
            </span>
            <span
              className="text-nd-text-display text-5xl leading-none tabular-nums"
              style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
            >
              {vanadiumCount}/{projects.length}
            </span>
            <span
              className="mt-1 text-nd-text-display text-sm"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {t('vanadium.headline', { count: vanadiumCount, total: projects.length })}
            </span>
          </div>
          <div className="md:w-2/3 md:border-l md:border-nd-border md:pl-6 flex flex-col gap-3">
            <p
              className="text-nd-text-secondary text-sm leading-7"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {t('vanadium.blurb')}
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {vanadiumProjects.map((p) => (
                <li
                  key={p.project_name}
                  className="inline-flex items-center gap-2 rounded-full border border-nd-border px-3 py-1 text-[11px] text-nd-text-secondary"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  {p.project_name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="container pb-12">
        <div className="mb-4 flex flex-col gap-1">
          <span
            className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {t('comparison.eyebrow')}
          </span>
          <h2
            className="text-balance text-2xl md:text-3xl leading-none text-nd-text-display"
            style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
          >
            {t('comparison.title')}
          </h2>
        </div>
        <div className="border border-nd-border bg-nd-surface overflow-x-auto">
          <table
            className="w-full text-[12px]"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            <thead>
              <tr className="bg-nd-surface-raised text-nd-text-secondary text-[10px] uppercase tracking-[0.08em]">
                <th className="px-5 py-3 text-left">{t('comparison.columns.project')}</th>
                <th className="px-5 py-3 text-left">{t('comparison.columns.status')}</th>
                <th className="px-5 py-3 text-left">{t('comparison.columns.province')}</th>
                <th className="px-5 py-3 text-right">{t('comparison.columns.u3o8Grade')}</th>
                <th className="px-5 py-3 text-right">{t('comparison.columns.u3o8Tonnage')}</th>
                <th className="px-5 py-3 text-right">{t('comparison.columns.v2o5Grade')}</th>
                <th className="px-5 py-3 text-right">{t('comparison.columns.v2o5Tonnage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nd-border">
              {projects.map((p) => {
                const highlights = p.commodity_highlights as
                  | Record<string, unknown>
                  | null
                  | undefined
                const u3o8Grade = pickGrade(highlights, 'Uranium')
                const u3o8Tonnage = pickResource(highlights, 'Uranium')
                const v2o5Grade = pickV2O5Grade(highlights)
                const v2o5Tonnage = pickV2O5Resource(highlights)
                return (
                  <tr key={p.project_name}>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-2 text-nd-text-display"
                        style={{ fontFamily: 'var(--font-space-grotesk)' }}
                      >
                        <span
                          className="inline-block size-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                        {p.project_name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-nd-text-secondary">
                      {strOrDash(p.status)}
                    </td>
                    <td className="px-5 py-3 text-nd-text-secondary">
                      {strOrDash(p.province)}
                    </td>
                    <td className="px-5 py-3 text-right text-nd-text-secondary tabular-nums">
                      {fmt(u3o8Grade)}
                    </td>
                    <td className="px-5 py-3 text-right text-nd-text-secondary tabular-nums">
                      {fmt(u3o8Tonnage)}
                    </td>
                    <td className="px-5 py-3 text-right text-nd-text-secondary tabular-nums">
                      {fmt(v2o5Grade)}
                    </td>
                    <td className="px-5 py-3 text-right text-nd-text-secondary tabular-nums">
                      {fmt(v2o5Tonnage)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function hasVanadiumSignal(p: Project): boolean {
  const by = p.by_products as unknown
  if (typeof by === 'string' && by.toLowerCase().includes('vanad')) return true
  if (Array.isArray(by) && by.some((x) => typeof x === 'string' && x.toLowerCase().includes('vanad')))
    return true
  const highlights = p.commodity_highlights as Record<string, unknown> | null | undefined
  if (!highlights) return false
  for (const block of Object.values(highlights)) {
    if (typeof block !== 'object' || block === null) continue
    for (const k of Object.keys(block as Record<string, unknown>)) {
      if (k.toLowerCase().includes('v2o5')) return true
    }
  }
  return false
}

function pickV2O5Grade(
  highlights: Record<string, unknown> | null | undefined,
): { value: number; unit: string } | null {
  if (!highlights) return null
  for (const block of Object.values(highlights)) {
    if (typeof block !== 'object' || block === null) continue
    for (const [k, v] of Object.entries(block as Record<string, unknown>)) {
      const lk = k.toLowerCase()
      if (typeof v !== 'number' || !Number.isFinite(v)) continue
      if (!lk.includes('v2o5')) continue
      if (lk.includes('grade') || lk.startsWith('pct_') || lk.endsWith('_pct') || lk.includes('ppm')) {
        return {
          value: v,
          unit: lk.startsWith('pct_') || lk.endsWith('_pct') ? '%' : lk.includes('ppm') ? 'ppm' : '%',
        }
      }
    }
  }
  return null
}

function pickV2O5Resource(
  highlights: Record<string, unknown> | null | undefined,
): { value: number; unit: string } | null {
  if (!highlights) return null
  const candidates: { value: number; unit: string; category: number }[] = []
  const priority = ['measured', 'indicated', 'proven', 'probable', 'inferred', 'rar']
  for (const block of Object.values(highlights)) {
    if (typeof block !== 'object' || block === null) continue
    for (const [k, v] of Object.entries(block as Record<string, unknown>)) {
      const lk = k.toLowerCase()
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue
      if (!lk.includes('v2o5')) continue
      // skip grade-like
      if (lk.includes('grade') || lk.startsWith('pct_') || lk.endsWith('_pct') || lk.includes('ppm')) continue
      const cat = priority.findIndex((p) => lk.startsWith(p))
      if (cat === -1) continue
      // unit = tail after first underscore
      const idx = k.indexOf('_')
      const unit = idx >= 0 ? k.slice(idx + 1).replace(/_/g, ' ') : ''
      candidates.push({ value: v, unit, category: cat })
    }
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) =>
    a.category !== b.category ? a.category - b.category : b.value - a.value,
  )
  return { value: candidates[0].value, unit: candidates[0].unit }
}

function fmt(v: { value: number; unit: string } | null): string {
  if (!v) return '—'
  const num = v.unit === '%' ? v.value.toFixed(2) : compact(v.value)
  return `${num} ${v.unit}`.trim()
}

function compact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  if (n >= 100) return n.toFixed(0)
  return n.toFixed(1)
}

function strOrDash(v: unknown): string {
  return v == null || v === '' ? '—' : String(v)
}
