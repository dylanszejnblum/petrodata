/**
 * Real-time Brent quote. The breakeven figure used to read the latest *monthly*
 * EIA spot row from FactPrice (weeks stale); this fetches the live front-month
 * Brent futures price (ICE, symbol BZ=F) from Yahoo Finance at request time.
 *
 * Kept honest: a failed/timed-out fetch returns null so the caller falls back to
 * the last measured DB value — we never fabricate or serve a stale-as-live price.
 * Cached in-memory (TTL) so a burst of requests hits Yahoo at most once.
 */

const BRENT_SYMBOL = 'BZ=F'; // ICE Brent crude front-month future
const CACHE_TTL_MS = 3 * 60_000; // 3 minutes — fresh enough; spares the upstream
const FETCH_TIMEOUT_MS = 5_000;

export interface LiveBrent {
  value: number; // USD/bbl
  asOf: string; // "YYYY-MM-DD HH:mm UTC" — the quote's market time
  date: string; // "YYYY-MM-DD" — for the trend series tip
}

interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; regularMarketTime?: number };
    }>;
  };
}

let cache: { quote: LiveBrent; at: number } | null = null;

function stampUtc(d: Date): string {
  const iso = d.toISOString(); // 2026-06-24T14:32:07.000Z
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export async function fetchLiveBrent(): Promise<LiveBrent | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.quote;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    BRENT_SYMBOL,
  )}?interval=1d&range=1d`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Yahoo ${BRENT_SYMBOL} → HTTP ${res.status}`);
    const json = (await res.json()) as YahooChart;
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (typeof price !== 'number' || !Number.isFinite(price)) {
      throw new Error(`Yahoo ${BRENT_SYMBOL} → no price`);
    }
    const ts = meta?.regularMarketTime;
    const when = typeof ts === 'number' && Number.isFinite(ts) ? new Date(ts * 1000) : new Date();
    const quote: LiveBrent = {
      value: price,
      asOf: stampUtc(when),
      date: when.toISOString().slice(0, 10),
    };
    cache = { quote, at: Date.now() };
    return quote;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
