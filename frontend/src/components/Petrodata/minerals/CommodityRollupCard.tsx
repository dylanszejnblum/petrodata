import { Link } from '@/i18n/navigation'
import type { ApiSchemas } from '@/api/client'
import { formatCompact } from '@/utilities/formatNumber'
import { commodityColor, commoditySlug } from './commodityColors'

type Rollup = ApiSchemas['CommodityRollupDto']

export function CommodityRollupCard({ rollup }: { rollup: Rollup }) {
  const { color } = commodityColor(rollup.commodity)
  const slug = commoditySlug(rollup.commodity)

  // Pick the headline resource entry — biased to the primary commodity's
  // chemistry token so e.g. uranium surfaces U3O8 instead of V2O5.
  const topResource = pickHeadlineResource(rollup.resource_totals, rollup.commodity)

  return (
    <Link
      href={`/minerals/${slug}`}
      className="group flex flex-col gap-4 border border-nd-border bg-nd-surface p-5 transition-colors hover:bg-nd-surface-raised"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span
            className="text-nd-text-display text-base"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {rollup.commodity}
          </span>
        </div>
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] group-hover:text-nd-text-display transition-colors"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          View →
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Projects" value={rollup.projects.toString()} />
        <Stat label="Producing" value={rollup.producing_projects.toString()} accent={color} />
      </div>

      {topResource && (
        <div className="border-t border-nd-border pt-3">
          <span
            className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {topResource.label}
          </span>
          <span
            className="mt-1 text-nd-text-display text-2xl tabular-nums leading-none block"
            style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
          >
            {formatCompact(topResource.value)}{' '}
            <span
              className="text-nd-text-disabled text-[10px] uppercase"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              {topResource.unit}
            </span>
          </span>
        </div>
      )}
    </Link>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em] block"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="mt-1 block text-xl tabular-nums leading-none"
        style={{
          fontFamily: 'var(--font-space-mono)',
          color: accent ?? 'var(--nd-text-display)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// Chemistry tokens used in resource keys, biased per primary commodity. Uranium
// projects often co-report Vanadium (V₂O₅) — we MUST surface the U₃O₈ row, not
// the V₂O₅ row. Tokens are matched case-insensitively as substrings.
const COMMODITY_KEY_TOKENS: Record<string, string[]> = {
  uranium: ['u3o8', 'rar', 'pct_u'],
  copper: ['cu'],
  gold: ['au'],
  silver: ['ag'],
  lithium: ['lce', 'li2co3', 'li'],
  lead: ['pb'],
  zinc: ['zn'],
}

// Surface the single largest resource entry so the card has a headline number.
// resource_totals keys look like "measured_kOz" / "indicated_Tn" / "rar_Tn".
function pickHeadlineResource(
  totals: Record<string, number> | undefined | null,
  commodity: string,
): { label: string; value: number; unit: string } | null {
  if (!totals) return null
  const all = Object.entries(totals).filter(([, v]) => Number.isFinite(v) && v > 0)
  if (all.length === 0) return null

  // Filter to entries whose key carries this commodity's chemistry token.
  const tokens = COMMODITY_KEY_TOKENS[commodity.toLowerCase()] ?? []
  const biased = tokens.length
    ? all.filter(([k]) => tokens.some((t) => k.toLowerCase().includes(t)))
    : []
  const entries = biased.length > 0 ? biased : all

  // Sort: category priority (measured → indicated → reserves → inferred), then
  // descending value as tiebreaker.
  entries.sort(([ak, av], [bk, bv]) => {
    const ap = priority(ak)
    const bp = priority(bk)
    if (ap !== bp) return ap - bp
    return bv - av
  })
  const [key, value] = entries[0]
  const parts = key.split('_')
  const category = parts[0]
  const unit = parts.slice(1).join('_') || ''
  return {
    label: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
    value,
    unit: prettyUnit(unit),
  }
}

function priority(key: string): number {
  const k = key.toLowerCase()
  if (k.startsWith('measured')) return 0
  if (k.startsWith('indicated')) return 1
  if (k.startsWith('proven')) return 2
  if (k.startsWith('probable')) return 3
  if (k.startsWith('inferred')) return 4
  return 9
}

function prettyUnit(unit: string): string {
  if (!unit) return ''
  // "kOz" → "kOz", "Tn" → "Tn", "g_t" → "g/t"
  return unit.replace(/_/g, '/')
}
