/**
 * Refresca las series de mercado desde sus fuentes públicas, sin la carpeta
 * petroldata.ar/market-data que usaban seed-prices / seed-macro-ar /
 * seed-energy-trade / seed-fuel-prices (ya no existe).
 *
 *   DATABASE_URL=<coolify> pnpm db:refresh:market
 *   DRY_RUN=1 pnpm db:refresh:market
 *
 * Mismas source/series que ya tiene fact_price, así la API no cambia:
 *   eia/brent|wti|henry_hub  ← FRED (republica la serie mensual de la EIA, sin API key)
 *   fx/fx_{oficial,blue}_{buy,sell} ← argentinadatos.com (diario)
 *   bcra/fx_a3500, indec/ipc_mensual, mecon/fiscal_primario ← apis.datos.gob.ar
 *   fact_energy_trade mensual ← INDEC ICA vía apis.datos.gob.ar
 *   fact_fuel_price ← "Precios vigentes en surtidor" (Res. 314/2016), foto completa
 *
 * Cada punto que llega reemplaza al de la misma fecha; los que faltan en la
 * fuente (datos.gob.ar tiene huecos) no borran lo que ya había.
 * Gas PIST y PBI ya tenían seeds que bajan de la fuente: el script de pnpm los
 * corre después de este.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === '1';
const FROM = '2019-01-01';
const SERIES_API = 'https://apis.datos.gob.ar/series/api/series/';
const FUEL_CSV =
  'http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv';

type Point = { date: Date; value: number };

const day = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00Z`);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const positive = (v: number) => Number.isFinite(v) && v > 0;

async function get(url: string): Promise<Response> {
  const r = await fetch(url, { headers: { 'user-agent': 'vacamuerta.io data refresh' } });
  if (!r.ok) throw new Error(`${new URL(url).host} HTTP ${r.status}`);
  return r;
}

async function replacePoints(source: string, series: string, name: string, unit: string, points: Point[]) {
  const last = points.at(-1);
  console.log(`  ${source}/${series}: ${points.length} puntos, último ${last ? last.date.toISOString().slice(0, 10) : '—'}`);
  if (DRY_RUN || !points.length) return;
  await prisma.$transaction([
    prisma.factPrice.deleteMany({ where: { source, series, date: { in: points.map((p) => p.date) } } }),
    prisma.factPrice.createMany({ data: points.map((p) => ({ source, series, name, unit, ...p })) }),
  ]);
}

/** Serie mensual de apis.datos.gob.ar, salteando los nulls. Va en CSV: el JSON
    de esa API devuelve vacío sin error según la combinación de parámetros
    (limit>1000, start, ciertas series), y su paginación saltea meses. La
    historia ya está en la base; alcanza con los últimos dos años. */
async function datosGobAr(id: string, extra = ''): Promise<Point[]> {
  const desde = `${new Date().getUTCFullYear() - 2}-01-01`;
  const csv = await (await get(`${SERIES_API}?ids=${id}&start_date=${desde}&limit=1000&format=csv${extra}`)).text();
  const rows = parse(csv, { columns: false, from_line: 2, skip_empty_lines: true }) as string[][];
  if (!rows.length) throw new Error(`${id}: datos.gob.ar no devolvió datos`);
  return rows
    .filter(([, v]) => v !== '' && Number.isFinite(Number(v)))
    .map(([d, v]) => ({ date: day(d), value: Number(v) }));
}

async function energyPrices() {
  const SERIES = [
    { series: 'brent', fred: 'MCOILBRENTEU', name: 'Brent Crude (Europe spot)', unit: 'USD/bbl' },
    { series: 'wti', fred: 'MCOILWTICO', name: 'WTI Crude (Cushing spot)', unit: 'USD/bbl' },
    { series: 'henry_hub', fred: 'MHHNGSP', name: 'Henry Hub Natural Gas', unit: 'USD/MMBtu' },
  ];
  for (const s of SERIES) {
    // De a una serie: con varias juntas FRED ignora cosd y manda todo desde 1986.
    const csv = await (await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${s.fred}&cosd=${FROM}`)).text();
    const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
    const points = rows
      .map((r) => ({ date: day(r.observation_date), value: Number(r[s.fred]) }))
      .filter((p) => positive(p.value));
    await replacePoints('eia', s.series, s.name, s.unit, points);
  }
}


async function fx() {
  for (const casa of ['oficial', 'blue'] as const) {
    const rows = (await (await get(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}`)).json()) as {
      fecha: string;
      compra: number | null;
      venta: number | null;
    }[];
    const recent = rows.filter((r) => r.fecha >= '2024-01-01');
    const nombre = casa === 'oficial' ? 'Oficial' : 'Blue';
    for (const [lado, key, label] of [
      ['sell', 'venta', 'Venta'],
      ['buy', 'compra', 'Compra'],
    ] as const) {
      const points = recent.filter((r) => positive(Number(r[key]))).map((r) => ({ date: day(r.fecha), value: Number(r[key]) }));
      await replacePoints('fx', `fx_${casa}_${lado}`, `ARS ${nombre} ${label}`, 'ARS/USD', points);
    }
  }
}

async function macro() {
  // A3500 (variable 5 del BCRA): el último día hábil de cada mes, como estaba cargado.
  const desde = `${new Date().getUTCFullYear() - 2}-01-01`;
  const hasta = new Date().toISOString().slice(0, 10);
  const bcra = await (await get(`https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/5?desde=${desde}&hasta=${hasta}&limit=3000`)).json();
  const byMonth = new Map<string, number>();
  for (const { fecha, valor } of [...bcra.results[0].detalle].reverse() as { fecha: string; valor: number }[]) {
    byMonth.set(fecha.slice(0, 7), valor);
  }
  const a3500 = [...byMonth].map(([m, value]) => ({ date: day(`${m}-01`), value }));
  await replacePoints('bcra', 'fx_a3500', 'Tipo de cambio mayorista (Com. A 3500)', 'ARS/USD', a3500);

  const ipc = (await datosGobAr('145.3_INGNACNAL_DICI_M_15', '&representation_mode=percent_change')).map((p) => ({
    date: p.date,
    value: Math.round(p.value * 1e6) / 1e4, // fracción → %, 4 decimales
  }));
  await replacePoints('indec', 'ipc_mensual', 'Inflación mensual (IPC Nivel General Nacional)', '%/mes', ipc);

  const fiscal = (await datosGobAr('452.3_RESULTADO_RIO_0_M_18_54')).map((p) => ({ ...p, value: Math.round(p.value * 10) / 10 }));
  await replacePoints('mecon', 'fiscal_primario', 'Resultado primario SPN (IMIG)', 'ARS millones', fiscal);
}

async function energyTrade() {
  // Las dos series en un mismo pedido: 74.3_IECE sola devuelve un CSV vacío
  // (reproducible en oct-2026), junto con IICL viene completa.
  const desde = `${new Date().getUTCFullYear() - 2}-01-01`;
  const csv = await (
    await get(`${SERIES_API}?ids=74.3_IECE_0_M_35,74.3_IICL_0_M_42&start_date=${desde}&limit=1000&format=csv`)
  ).text();
  const exp = new Map<string, number>();
  const imp = new Map<string, number>();
  for (const [d, e, i] of parse(csv, { from_line: 2, skip_empty_lines: true }) as string[][]) {
    // Sólo meses con los dos lados: un superávit con un lado viejo y otro nuevo no vale.
    if (e !== '' && i !== '') {
      exp.set(d.slice(0, 7), Number(e));
      imp.set(d.slice(0, 7), Number(i));
    }
  }
  const months = [...exp.keys()].sort();
  const asOf = months.at(-1) ?? null;
  console.log(`  fact_energy_trade mensual: ${months.length} meses, último ${asOf ?? '—'}`);
  if (DRY_RUN) return;
  for (const m of months) {
    const e = Math.round(exp.get(m)! * 1e6 * 100) / 100;
    const i = Math.round(imp.get(m)! * 1e6 * 100) / 100;
    const data = {
      energyExportsUsd: e,
      energyImportsUsd: i,
      energySurplusUsd: Math.round((e - i) * 100) / 100,
      sourceLabel: 'INDEC — Intercambio Comercial Argentino (ICA)',
      sourceUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-40',
      sourceAsOf: asOf,
    };
    const period = day(`${m}-01`);
    await prisma.factEnergyTrade.upsert({
      where: { period_granularity: { period, granularity: 'monthly' } },
      create: { period, granularity: 'monthly', ...data },
      update: data,
    });
  }
}

async function fuelPrices() {
  const rows = parse(await (await get(FUEL_CSV)).text(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
  const str = (v?: string) => (v && v.trim() ? v.trim() : null);
  const numOrNull = (v?: string) => (v && Number.isFinite(Number(v)) ? Number(v) : null);
  const data: Prisma.FactFuelPriceCreateManyInput[] = [];
  for (const r of rows) {
    const precio = Number(r.precio);
    const fecha = new Date(r.fecha_vigencia);
    if (!positive(precio) || Number.isNaN(fecha.getTime()) || !str(r.provincia) || !str(r.producto)) continue;
    data.push({
      fechaVigencia: fecha,
      provincia: r.provincia,
      localidad: str(r.localidad),
      empresa: str(r.empresa),
      empresaBandera: str(r.empresabandera),
      producto: r.producto,
      precio,
      tipoHorario: str(r.tipohorario),
      latitude: numOrNull(r.latitud),
      longitude: numOrNull(r.longitud),
    });
  }
  const last = data.reduce((m, d) => (d.fechaVigencia > m ? (d.fechaVigencia as Date) : m), new Date(0));
  console.log(`  fact_fuel_price: ${data.length} precios vigentes, último ${last.toISOString().slice(0, 10)}`);
  // Una foto de lo vigente: si la descarga vino rota, mejor no pisar la anterior.
  if (DRY_RUN || data.length < 10_000) return;
  await prisma.$transaction(
    async (tx) => {
      await tx.factFuelPrice.deleteMany();
      for (let i = 0; i < data.length; i += 5000) await tx.factFuelPrice.createMany({ data: data.slice(i, i + 5000) });
    },
    { timeout: 10 * 60_000 },
  );
}

async function main() {
  const t0 = Date.now();
  // Cada bloque es independiente: si una fuente se cae, las demás se cargan igual.
  let failed = 0;
  for (const [name, fn] of [
    ['precios energía (FRED/EIA)', energyPrices],
    ['dólar (argentinadatos)', fx],
    ['macro (datos.gob.ar)', macro],
    ['intercambio energético (INDEC)', energyTrade],
    ['combustibles en surtidor', fuelPrices],
  ] as const) {
    console.log(name);
    try {
      await fn();
    } catch (e) {
      failed++;
      console.error(`  ✕ ${name}: ${(e as Error).message}`);
    }
  }
  console.log(`${DRY_RUN ? 'DRY_RUN: no escribí nada. ' : ''}Listo en ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
