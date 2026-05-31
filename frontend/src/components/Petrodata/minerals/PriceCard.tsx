import type { ApiSchemas } from '@/api/client'
import { commodityColor } from './commodityColors'

type Quote = ApiSchemas['CommodityPriceDto']

function formatPrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return '—'
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 100) return price.toFixed(1)
  return price.toFixed(2)
}

function formatChangePct(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

export function PriceCard({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  const { color } = commodityColor(quote.commodity)
  const price = quote.price as number | null
  const change = quote.change as number | null
  const changePct = quote.change_pct as number | null
  const isUp = (change ?? 0) > 0
  const isDown = (change ?? 0) < 0
  const trendColor = isUp
    ? 'var(--nd-success)'
    : isDown
      ? 'var(--nd-warning)'
      : 'var(--nd-text-disabled)'

  return (
    <div className={`flex flex-col bg-nd-surface ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block size-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span
            className="text-nd-text-secondary text-[10px] uppercase tracking-[0.08em] truncate"
            style={{ fontFamily: 'var(--font-space-mono)' }}
            title={quote.display}
          >
            {quote.commodity}
          </span>
        </div>
        {quote.proxy && (
          <span
            className="text-[9px] uppercase text-nd-text-disabled border border-nd-border rounded-full px-1.5 py-0.5"
            style={{ fontFamily: 'var(--font-space-mono)' }}
            title="Sector ETF proxy — not a direct commodity feed"
          >
            ETF
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-nd-text-display ${compact ? 'text-xl' : 'text-2xl'} tabular-nums leading-none`}
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {formatPrice(price)}
        </span>
        <span
          className="text-nd-text-disabled text-[10px] uppercase"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {quote.unit}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <TrendArrow direction={isUp ? 'up' : isDown ? 'down' : 'flat'} color={trendColor} />
        <span
          className="text-[11px] tabular-nums"
          style={{ fontFamily: 'var(--font-space-mono)', color: trendColor }}
        >
          {formatChangePct(changePct)}
        </span>
      </div>
    </div>
  )
}

function TrendArrow({
  direction,
  color,
}: {
  direction: 'up' | 'down' | 'flat'
  color: string
}) {
  if (direction === 'flat') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color} strokeWidth="1.5">
        <line x1="1" y1="5" x2="9" y2="5" />
      </svg>
    )
  }
  if (direction === 'up') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color} strokeWidth="1.5">
        <polyline points="2,7 5,3 8,7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={color} strokeWidth="1.5">
      <polyline points="2,3 5,7 8,3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LivePrices({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null
  return (
    <section className="container pb-8">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          LIVE PRICES
        </span>
        <span
          className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
          style={{ fontFamily: 'var(--font-space-mono)' }}
          title="Sourced from Yahoo Finance · cached 5 min server-side"
        >
          Yahoo Finance · 5-min cache
        </span>
      </div>
      <div
        className={`grid gap-px bg-nd-border ${
          quotes.length >= 5 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {quotes.map((q) => (
          <PriceCard key={q.ticker + q.commodity} quote={q} />
        ))}
      </div>
    </section>
  )
}

/* ---------- Larger detail card used on per-commodity / project pages ---------- */

export function PriceDetailCard({ quote }: { quote: Quote }) {
  const { color } = commodityColor(quote.commodity)
  const price = quote.price as number | null
  const change = quote.change as number | null
  const changePct = quote.change_pct as number | null
  const low52 = quote.fifty_two_week_low as number | null
  const high52 = quote.fifty_two_week_high as number | null
  const isUp = (change ?? 0) > 0
  const isDown = (change ?? 0) < 0
  const trendColor = isUp
    ? 'var(--nd-success)'
    : isDown
      ? 'var(--nd-warning)'
      : 'var(--nd-text-disabled)'

  const rangePosition =
    price != null && low52 != null && high52 != null && high52 > low52
      ? Math.min(1, Math.max(0, (price - low52) / (high52 - low52)))
      : null

  return (
    <div className="bg-nd-surface p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span
            className="text-nd-text-secondary text-[11px] tracking-[0.08em] uppercase truncate"
            style={{ fontFamily: 'var(--font-space-mono)' }}
            title={quote.display}
          >
            {quote.display}
          </span>
        </div>
        {quote.proxy && (
          <span
            className="text-[9px] uppercase text-nd-text-disabled border border-nd-border rounded-full px-1.5 py-0.5"
            style={{ fontFamily: 'var(--font-space-mono)' }}
            title="Sector ETF proxy — not a direct commodity feed"
          >
            ETF PROXY
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-nd-text-display text-4xl tabular-nums leading-none"
          style={{ fontFamily: 'Doto, var(--font-space-grotesk)' }}
        >
          {formatPrice(price)}
        </span>
        <span
          className="text-nd-text-disabled text-[11px] uppercase"
          style={{ fontFamily: 'var(--font-space-mono)' }}
        >
          {quote.unit}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TrendArrow direction={isUp ? 'up' : isDown ? 'down' : 'flat'} color={trendColor} />
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: 'var(--font-space-mono)', color: trendColor }}
        >
          {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '—'} ·{' '}
          {formatChangePct(changePct)}
        </span>
      </div>

      {rangePosition !== null && low52 !== null && high52 !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.08em] text-nd-text-disabled"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            <span>52w low · {formatPrice(low52)}</span>
            <span>52w high · {formatPrice(high52)}</span>
          </div>
          <div className="relative h-1 bg-nd-surface-raised">
            <div
              className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full ring-2 ring-nd-surface"
              style={{
                left: `${rangePosition * 100}%`,
                marginLeft: -5,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      )}

      <div className="border-t border-nd-border pt-3 grid grid-cols-2 gap-3 text-[11px]">
        <Meta label="Ticker" value={quote.ticker} />
        <Meta label="Exchange" value={(quote.exchange as string | null) ?? '—'} />
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-nd-text-disabled text-[10px] uppercase tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="text-nd-text-secondary tabular-nums"
        style={{ fontFamily: 'var(--font-space-mono)' }}
      >
        {value}
      </span>
    </div>
  )
}
