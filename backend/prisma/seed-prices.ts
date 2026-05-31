import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

const MARKET_DATA_DIR = resolve(
  process.cwd(),
  process.env.MARKET_DATA_DIR || '/Users/dylanszejnblum/Documents/petroldata.ar/market-data/out',
);

interface CommodityRow {
  commodity: string;
  name: string;
  unit: string;
  date: string;
  value: string;
}

interface FxLatestJson {
  fetched_at?: string;
  source?: string;
  oficial?: { value_sell?: number; value_buy?: number };
  blue?: { value_sell?: number; value_buy?: number };
}

interface EiaLatestJson {
  fetched_at?: string;
  source?: string;
  prices?: Record<string, { value?: number; date?: string; unit?: string; name?: string }>;
}

function parseMonth(v: string): Date {
  // "2025-06" → 2025-06-01 UTC
  const [y, m] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

function parseDay(v: string): Date {
  // "2026-05-29" → that date UTC
  const [y, m, d] = v.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function seedCommodityPrices(): Promise<number> {
  const path = resolve(MARKET_DATA_DIR, 'prices_commodities.csv');
  if (!existsSync(path)) {
    console.log(`  prices_commodities.csv not found at ${path}, skipping`);
    return 0;
  }
  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CommodityRow[];

  const data: Prisma.FactPriceCreateManyInput[] = [];
  for (const r of rows) {
    const value = Number(r.value);
    if (!Number.isFinite(value)) continue;
    data.push({
      source: 'yahoo',
      series: r.commodity,
      name: r.name,
      unit: r.unit,
      date: parseMonth(r.date),
      value,
    });
  }
  if (!data.length) return 0;
  await prisma.factPrice.createMany({ data, skipDuplicates: true });
  return data.length;
}

async function seedFxLatest(): Promise<number> {
  const path = resolve(MARKET_DATA_DIR, 'fx_rates_latest.json');
  if (!existsSync(path)) {
    console.log(`  fx_rates_latest.json not found, skipping`);
    return 0;
  }
  const j = JSON.parse(readFileSync(path, 'utf-8')) as FxLatestJson;
  const fetchedAt = j.fetched_at ? new Date(j.fetched_at) : new Date();
  const date = new Date(Date.UTC(fetchedAt.getUTCFullYear(), fetchedAt.getUTCMonth(), fetchedAt.getUTCDate()));

  const entries: Array<{ series: string; value: number | undefined; name: string }> = [
    { series: 'fx_oficial_sell', value: j.oficial?.value_sell, name: 'ARS Oficial Venta' },
    { series: 'fx_oficial_buy', value: j.oficial?.value_buy, name: 'ARS Oficial Compra' },
    { series: 'fx_blue_sell', value: j.blue?.value_sell, name: 'ARS Blue Venta' },
    { series: 'fx_blue_buy', value: j.blue?.value_buy, name: 'ARS Blue Compra' },
  ];

  const data: Prisma.FactPriceCreateManyInput[] = entries
    .filter((e): e is { series: string; value: number; name: string } => typeof e.value === 'number' && Number.isFinite(e.value))
    .map((e) => ({
      source: 'fx',
      series: e.series,
      name: e.name,
      unit: 'ARS/USD',
      date,
      value: e.value,
    }));

  if (!data.length) return 0;
  await prisma.factPrice.createMany({ data, skipDuplicates: true });
  return data.length;
}

async function seedFxHistory(): Promise<number> {
  const path = resolve(MARKET_DATA_DIR, 'fx_rates.csv');
  if (!existsSync(path)) return 0;
  const rows = parse(readFileSync(path, 'utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    date: string;
    oficial_value_sell?: string;
    oficial_value_buy?: string;
    blue_value_sell?: string;
    blue_value_buy?: string;
  }>;

  const data: Prisma.FactPriceCreateManyInput[] = [];
  for (const r of rows) {
    if (!r.date) continue;
    const d = parseDay(r.date);
    const push = (series: string, name: string, raw: string | undefined) => {
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isFinite(n)) return;
      data.push({ source: 'fx', series, name, unit: 'ARS/USD', date: d, value: n });
    };
    push('fx_oficial_sell', 'ARS Oficial Venta', r.oficial_value_sell);
    push('fx_oficial_buy', 'ARS Oficial Compra', r.oficial_value_buy);
    push('fx_blue_sell', 'ARS Blue Venta', r.blue_value_sell);
    push('fx_blue_buy', 'ARS Blue Compra', r.blue_value_buy);
  }
  if (!data.length) return 0;
  // Chunk to avoid oversized inserts
  let inserted = 0;
  for (let i = 0; i < data.length; i += 5000) {
    const slice = data.slice(i, i + 5000);
    await prisma.factPrice.createMany({ data: slice, skipDuplicates: true });
    inserted += slice.length;
  }
  return inserted;
}

const EIA_SERIES: Array<{ series: string; eiaId: string; name: string; unit: string }> = [
  { series: 'wti', eiaId: 'PET.RWTC.M', name: 'WTI Crude (Cushing spot)', unit: 'USD/bbl' },
  { series: 'brent', eiaId: 'PET.RBRTE.M', name: 'Brent Crude (Europe spot)', unit: 'USD/bbl' },
  { series: 'henry_hub', eiaId: 'NG.RNGWHHD.M', name: 'Henry Hub Natural Gas', unit: 'USD/MMBtu' },
];

interface EiaApiResponse {
  response?: {
    data?: Array<{ period?: string; value?: number | string }>;
  };
}

async function fetchEiaSeries(eiaId: string, apiKey: string): Promise<Array<{ date: Date; value: number }>> {
  const url = `https://api.eia.gov/v2/seriesid/${eiaId}?api_key=${apiKey}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new Error(`EIA ${eiaId} → HTTP ${res.status}`);
    const json = (await res.json()) as EiaApiResponse;
    const rows = json.response?.data ?? [];
    const out: Array<{ date: Date; value: number }> = [];
    for (const r of rows) {
      if (!r.period) continue;
      const n = Number(r.value);
      if (!Number.isFinite(n)) continue;
      out.push({ date: parseMonth(r.period), value: n });
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

async function seedEiaFromApi(apiKey: string): Promise<number> {
  let total = 0;
  for (const s of EIA_SERIES) {
    try {
      const points = await fetchEiaSeries(s.eiaId, apiKey);
      if (!points.length) {
        console.log(`    ${s.eiaId}: no data`);
        continue;
      }
      const data: Prisma.FactPriceCreateManyInput[] = points.map((p) => ({
        source: 'eia',
        series: s.series,
        name: s.name,
        unit: s.unit,
        date: p.date,
        value: p.value,
      }));
      await prisma.factPrice.createMany({ data, skipDuplicates: true });
      total += data.length;
      console.log(`    ${s.eiaId} → ${s.series}: ${data.length} rows`);
    } catch (e) {
      console.log(`    ${s.eiaId}: failed — ${(e as Error).message}`);
    }
  }
  return total;
}

async function seedEiaFromFile(): Promise<number> {
  const path = resolve(MARKET_DATA_DIR, 'prices_eia_latest.json');
  if (!existsSync(path)) return 0;
  const j = JSON.parse(readFileSync(path, 'utf-8')) as EiaLatestJson;
  const prices = j.prices ?? {};
  const data: Prisma.FactPriceCreateManyInput[] = [];
  for (const [series, info] of Object.entries(prices)) {
    if (!info || typeof info.value !== 'number' || !info.date) continue;
    data.push({
      source: 'eia',
      series,
      name: info.name ?? series,
      unit: info.unit ?? '',
      date: parseMonth(info.date),
      value: info.value,
    });
  }
  if (!data.length) return 0;
  await prisma.factPrice.createMany({ data, skipDuplicates: true });
  return data.length;
}

async function seedEiaLatest(): Promise<number> {
  const apiKey = process.env.EIA_API_KEY?.trim();
  if (apiKey) {
    console.log('  EIA: fetching from api.eia.gov...');
    return seedEiaFromApi(apiKey);
  }
  console.log('  EIA: no EIA_API_KEY, falling back to prices_eia_latest.json');
  return seedEiaFromFile();
}

async function main() {
  const t0 = Date.now();
  console.log(`Seeding prices from: ${MARKET_DATA_DIR}`);
  if (!existsSync(MARKET_DATA_DIR)) {
    throw new Error(`Market data dir not found: ${MARKET_DATA_DIR}`);
  }

  console.log('Clearing fact_price...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "fact_price" RESTART IDENTITY');

  const commodities = await seedCommodityPrices();
  console.log(`  commodities: ${commodities} rows`);

  const fxHistory = await seedFxHistory();
  console.log(`  fx history:  ${fxHistory} rows`);

  const fxLatest = await seedFxLatest();
  console.log(`  fx latest:   ${fxLatest} rows`);

  const eia = await seedEiaLatest();
  console.log(`  eia energy:  ${eia} rows`);

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
