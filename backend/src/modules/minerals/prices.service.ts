import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  COMMODITY_TICKERS,
  CommodityTicker,
  findOperatorTicker,
  OperatorTicker,
} from './prices.config';

export interface PriceQuote {
  ticker: string;
  price: number | null;
  currency: string | null;
  previous_close: number | null;
  change: number | null;
  change_pct: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  market_time: string | null;
  exchange: string | null;
  instrument_type: string | null;
  short_name: string | null;
}

export interface CommodityPrice extends PriceQuote {
  commodity: string;
  display: string;
  unit: string;
  proxy: boolean;
}

export interface StockPrice extends PriceQuote {
  operator_match: string;
  exchange_label: string;
}

interface YahooChartMeta {
  symbol?: string;
  currency?: string | null;
  exchangeName?: string | null;
  instrumentType?: string | null;
  regularMarketPrice?: number | null;
  chartPreviousClose?: number | null;
  previousClose?: number | null;
  regularMarketTime?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  shortName?: string | null;
}

interface CacheEntry {
  ts: number;
  data: PriceQuote;
}

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly fetchTimeoutMs = 5_000;
  private readonly endpoint = 'https://query1.finance.yahoo.com/v8/finance/chart';

  async commodities(): Promise<CommodityPrice[]> {
    const entries = Object.entries(COMMODITY_TICKERS);
    const quotes = await Promise.all(entries.map(([, t]) => this.quote(t.ticker)));
    return entries.map(([commodity, t], idx) => this.shapeCommodity(commodity, t, quotes[idx]));
  }

  async commodity(name: string): Promise<CommodityPrice> {
    const key = Object.keys(COMMODITY_TICKERS).find((k) => k.toLowerCase() === name.toLowerCase());
    if (!key) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Commodity not tracked: ${name}. Supported: ${Object.keys(COMMODITY_TICKERS).join(', ')}`,
      });
    }
    const t = COMMODITY_TICKERS[key];
    const quote = await this.quote(t.ticker);
    return this.shapeCommodity(key, t, quote);
  }

  /** Look up the stock for a project's operator, returning null when unmapped or private. */
  async stockForOperator(operator: string | null, ownerController: string | null): Promise<StockPrice | null> {
    const match = findOperatorTicker(operator, ownerController);
    if (!match) return null;
    const quote = await this.quote(match.ticker);
    return this.shapeStock(match, quote);
  }

  /** Best-effort: returns prices for the primary commodity and any by-products we have a ticker for. */
  async commoditiesForProject(primary: string, byProducts: string | null): Promise<CommodityPrice[]> {
    const wanted = new Set<string>();
    if (primary) wanted.add(primary);
    if (byProducts) {
      for (const part of byProducts.split(/[,/]/).map((s) => s.trim()).filter(Boolean)) {
        wanted.add(part);
      }
    }
    const out: CommodityPrice[] = [];
    for (const w of wanted) {
      const key = Object.keys(COMMODITY_TICKERS).find((k) => k.toLowerCase() === w.toLowerCase());
      if (!key) continue;
      const t = COMMODITY_TICKERS[key];
      const quote = await this.quote(t.ticker);
      out.push(this.shapeCommodity(key, t, quote));
    }
    return out;
  }

  private shapeCommodity(commodity: string, t: CommodityTicker, q: PriceQuote): CommodityPrice {
    return { commodity, display: t.display, unit: t.unit, proxy: t.proxy, ...q };
  }

  private shapeStock(match: OperatorTicker, q: PriceQuote): StockPrice {
    return {
      ...q,
      operator_match: match.name,
      exchange_label: match.exchange,
    };
  }

  private async quote(ticker: string): Promise<PriceQuote> {
    const cached = this.cache.get(ticker);
    const now = Date.now();
    if (cached && now - cached.ts < this.ttlMs) return cached.data;

    const data = await this.fetchQuote(ticker);
    this.cache.set(ticker, { ts: now, data });
    return data;
  }

  private async fetchQuote(ticker: string): Promise<PriceQuote> {
    const url = `${this.endpoint}/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.fetchTimeoutMs);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (minerals-api)' },
        signal: ac.signal,
      });
      if (!res.ok) {
        this.logger.warn(`Yahoo ${ticker} → HTTP ${res.status}`);
        return this.emptyQuote(ticker);
      }
      const json = (await res.json()) as {
        chart: { result: Array<{ meta: YahooChartMeta }> | null; error: { code: string } | null };
      };
      if (json.chart.error) {
        this.logger.warn(`Yahoo ${ticker} → ${json.chart.error.code}`);
        return this.emptyQuote(ticker);
      }
      const meta = json.chart.result?.[0]?.meta;
      if (!meta) return this.emptyQuote(ticker);
      return this.fromMeta(ticker, meta);
    } catch (err) {
      this.logger.warn(`Yahoo ${ticker} fetch failed: ${(err as Error).message}`);
      return this.emptyQuote(ticker);
    } finally {
      clearTimeout(timer);
    }
  }

  private fromMeta(ticker: string, meta: YahooChartMeta): PriceQuote {
    const price = numOrNull(meta.regularMarketPrice);
    const prev = numOrNull(meta.chartPreviousClose ?? meta.previousClose);
    const change = price !== null && prev !== null ? round(price - prev, 4) : null;
    const changePct = price !== null && prev !== null && prev !== 0 ? round(((price - prev) / prev) * 100, 4) : null;
    return {
      ticker,
      price,
      currency: meta.currency ?? null,
      previous_close: prev,
      change,
      change_pct: changePct,
      fifty_two_week_high: numOrNull(meta.fiftyTwoWeekHigh),
      fifty_two_week_low: numOrNull(meta.fiftyTwoWeekLow),
      market_time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
      exchange: meta.exchangeName ?? null,
      instrument_type: meta.instrumentType ?? null,
      short_name: meta.shortName ?? null,
    };
  }

  private emptyQuote(ticker: string): PriceQuote {
    return {
      ticker,
      price: null,
      currency: null,
      previous_close: null,
      change: null,
      change_pct: null,
      fifty_two_week_high: null,
      fifty_two_week_low: null,
      market_time: null,
      exchange: null,
      instrument_type: null,
      short_name: null,
    };
  }
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
