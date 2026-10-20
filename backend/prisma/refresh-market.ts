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
 *   fact_wells_drilling ← «Pozos en perforación» (datos.energia.gob.ar), por mes y provincia
 *   se/medanito|medanito_mi|escalante|brent ← Informe de Regalías de CRUDO (Secretaría de Energía)
 *   eia_steo/<cuenca>_{oil,gas,rigs} ← EIA STEO (Permian, Eagle Ford, Bakken, Haynesville, Appalachia); pide EIA_API_KEY
 *   fact_province_export ← INDEC OPEX mensual (comex.indec.gob.ar), provincia × rubro
 *   rigi_project ← planilla pública que alimenta argentina.gob.ar/economia/rigi
 *     + la página de cada resolución (número y fecha de publicación en el BO)
 *
 * Cada punto que llega reemplaza al de la misma fecha; los que faltan en la
 * fuente (datos.gob.ar tiene huecos) no borran lo que ya había.
 * Gas PIST y PBI ya tenían seeds que bajan de la fuente: el script de pnpm los
 * corre después de este.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { strFromU8, unzipSync } from 'fflate';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === '1';
const FROM = '2019-01-01';
const SERIES_API = 'https://apis.datos.gob.ar/series/api/series/';
const FUEL_CSV =
  'http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv';

const ICA_CSV =
  'https://infra.datos.gob.ar/catalog/sspm/dataset/74/distribution/74.3/download/intercambio-comercial-argentino-mensual.csv';
const EXPORT_PRODUCTOS_CSV =
  'https://infra.datos.gob.ar/catalog/sspm/dataset/75/distribution/75.3/download/exportaciones-mensual.csv';
const PERFORACION_CSV =
  'http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21/resource/af6838ef-f675-4409-ac6a-e7c391a5dbab/download/pozos-en-perforacin.csv';
const REGALIAS_CRUDO_ZIP =
  'http://www.energia.gob.ar/contenidos/archivos/Reorganizacion/informacion_del_mercado/mercado_hidrocarburos/informacion_estadistica/regalias/Regalias_CRUDO.zip';
const RIGI_SHEET =
  'https://docs.google.com/spreadsheets/d/1eytHJrzUjIFOXI-P1Hx_wbmZiSqPxVle059Djdos6u8/gviz/tq?tqx=out:csv&sheet=dataset';

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
  console.log(`  ${source}/${series}: ${points.length} puntos, último ${last ? `${last.date.toISOString().slice(0, 10)} = ${last.value}` : '—'}`);
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
  // El CSV de distribución del dataset 74.3 y no la API de series: desde oct-2026
  // la API devuelve vacío para 74.3_IECE / 74.3_IICL, solas o juntas, en CSV y JSON.
  const rows = parse(await (await get(ICA_CSV)).text(), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const desde = `${new Date().getUTCFullYear() - 2}-01`;
  const exp = new Map<string, number>();
  const imp = new Map<string, number>();
  for (const r of rows) {
    const [d, e, i] = [r.indice_tiempo, r.ica_exportacion_combustible_energia, r.ica_importaciones_combustibles_lubricantes];
    if (!d || d.slice(0, 7) < desde) continue;
    // Sólo meses con los dos lados: un superávit con un lado viejo y otro nuevo no vale.
    if (e !== '' && i !== '') {
      exp.set(d.slice(0, 7), Number(e));
      imp.set(d.slice(0, 7), Number(i));
    }
  }
  // El reparto petróleo crudo / gas de las exportaciones de energía (INDEC, MUSD).
  const prod = parse(await (await get(EXPORT_PRODUCTOS_CSV)).text(), { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  for (const [col, series, name] of [
    ['ica_petroleo_crudo', 'expo_petroleo_crudo', 'Exportaciones de petróleo crudo'],
    ['gas_petroleo_otros_hidrocarburos', 'expo_gas', 'Exportaciones de gas de petróleo y otros hidrocarburos gaseosos'],
  ]) {
    const points = prod
      .filter((r) => r.indice_tiempo?.slice(0, 7) >= desde && r[col] !== '' && Number.isFinite(Number(r[col])))
      .map((r) => ({ date: day(r.indice_tiempo), value: Number(r[col]) }));
    await replacePoints('indec', series, name, 'MUSD', points);
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

/* PRECIO DEL CRUDO LOCAL. La única serie pública mensual de Medanito y
   Escalante vive dentro del Excel de regalías de la Secretaría: un ZIP con un
   xlsx cuya hoja visible está filtrada por provincia. El dato por TIPO de crudo
   está en el caché de la tabla dinámica (pivotCacheRecords): cada registro son
   cinco índices a los ítems compartidos —concepto, zona, tipo, año, mes— y el
   valor en USD/m3. El caché se reconoce por su último campo, «USD/m3»; el número
   de archivo no es fijo.
   · Son precios declarados para regalías, ponderados por volumen vendido —no
     un precio de pizarra— y el Medanito cubre toda la cuenca Neuquina.
   · MI + TSP = mercado interno; TOTAL = interno y exportación mezclados.
   · Cero = sin dato (los meses futuros vienen en 0). Los dos últimos meses son
     provisorios: cada corrida los pisa.
   · El Brent sale del mismo archivo para que la comparación sea contra la misma
     cuenta; el de FRED/EIA sigue en eia/brent. */
async function crudoLocal() {
  const outer = unzipSync(new Uint8Array(await (await get(REGALIAS_CRUDO_ZIP)).arrayBuffer()));
  const xlsxName = Object.keys(outer).find((n) => n.toLowerCase().endsWith('.xlsx'));
  if (!xlsxName) throw new Error('el ZIP de regalías no trae un xlsx');
  const xlsx = unzipSync(outer[xlsxName], { filter: (f) => f.name.startsWith('xl/pivotCache/pivotCache') });

  const items = (xml: string) =>
    [...xml.matchAll(/<cacheField name="([^"]*)"[^>]*>([\s\S]*?)<\/cacheField>/g)].map((m) => ({
      name: m[1],
      values: [...m[2].matchAll(/<[sn] v="([^"]*)"/g)].map((v) => v[1]),
    }));
  const defName = Object.keys(xlsx).find(
    (n) => /pivotCacheDefinition\d+\.xml$/.test(n) && items(strFromU8(xlsx[n])).at(-1)?.name === 'USD/m3',
  );
  if (!defName) throw new Error('no encontré el caché de precios (USD/m3) en el xlsx');
  const fields = items(strFromU8(xlsx[defName]));
  const records = strFromU8(xlsx[defName.replace('Definition', 'Records')]);
  const idx = (field: string) => fields.findIndex((f) => f.name === field);
  const [fConcepto, fTipo, fAnio, fMes] = ['CONCEPTO', 'CUENCA/PROVINCIA/TIPO DE CRUDO', 'AÑO', 'MES'].map(idx);

  const QUIERO: Record<string, { series: string; name: string }> = {
    'PRECIO TOTAL|MEDANITO': { series: 'medanito', name: 'Medanito (Cuenca Neuquina), precio total' },
    'PRECIO MI + TSP|MEDANITO': { series: 'medanito_mi', name: 'Medanito, mercado interno' },
    'PRECIO TOTAL|ESCALANTE': { series: 'escalante', name: 'Escalante (Golfo San Jorge), precio total' },
    'PRECIO TOTAL|BRENT': { series: 'brent', name: 'Brent (Informe de Regalías SE)' },
  };
  const puntos = new Map<string, Point[]>();
  for (const r of records.matchAll(/<r>([\s\S]*?)<\/r>/g)) {
    const toks = [...r[1].matchAll(/<([xnm])(?: v="([^"]*)")?\/>/g)].map((t) => ({ kind: t[1], v: t[2] }));
    const val = (i: number) => (toks[i].kind === 'x' ? fields[i].values[Number(toks[i].v)] : toks[i].v);
    const q = QUIERO[`${val(fConcepto)}|${val(fTipo)}`];
    const usdM3 = Number(toks.at(-1)?.v);
    if (!q || !positive(usdM3)) continue; // 0 = sin dato
    const list = puntos.get(q.series) ?? [];
    list.push({ date: day(`${val(fAnio)}-${String(val(fMes)).padStart(2, '0')}-01`), value: Math.round((usdM3 / 6.2898) * 100) / 100 });
    puntos.set(q.series, list);
  }
  if (!puntos.get('medanito')?.length) throw new Error('el caché no trajo Medanito');
  for (const { series, name } of Object.values(QUIERO)) {
    const pts = (puntos.get(series) ?? []).sort((a, b) => a.date.getTime() - b.date.getTime());
    await replacePoints('se', series, name, 'USD/bbl', pts);
  }
}

/* CUENCAS DE EE.UU., para comparar con Vaca Muerta. El Drilling Productivity
   Report murió en 2024 (el xlsx sigue en línea, congelado en jun-2024); sus
   regiones viven ahora en las tablas 4a/5a/10a del STEO. La API mezcla historia
   y pronóstico sin marcarlos: se corta en el último mes histórico, que es el
   anterior al mes de publicación (sale entre el 6 y el 10). Los últimos meses
   «históricos» son estimaciones que la EIA revisa cada mes: se pisan.
   Unidades: petróleo crudo (sin condensado ni LGN) en miles de b/d; gas
   comercializado en Bcf/d (× 28,317 = MMm3/d). */
async function cuencasEeuu() {
  const key = process.env.EIA_API_KEY;
  if (!key) throw new Error('falta EIA_API_KEY');
  const CUENCAS = { PM: 'permian', EF: 'eagle_ford', BK: 'bakken', HA: 'haynesville', AP: 'appalachia' };
  const SERIES = Object.entries(CUENCAS).flatMap(([code, slug]) => [
    { id: `COPR${code}`, series: `${slug}_oil`, unit: 'kb/d', scale: 1000, what: 'crude oil production' },
    { id: `NGMP${code}`, series: `${slug}_gas`, unit: 'Bcf/d', scale: 1, what: 'marketed natural gas production' },
    { id: `RIGS${code}`, series: `${slug}_rigs`, unit: 'rigs', scale: 1, what: 'active rigs' },
  ]);
  const hoy = new Date();
  // ponytail: corte por fecha de publicación aproximada (día 10); leer «Last Historical Month» del xlsx si molesta
  const ultimo = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - (hoy.getUTCDate() >= 10 ? 1 : 2), 1));
  // de a una serie: pedidas juntas, la API del STEO se va a 504
  for (const s of SERIES) {
    const params = new URLSearchParams({ api_key: key, frequency: 'monthly', 'data[0]': 'value', length: '5000' });
    params.append('facets[seriesId][]', s.id);
    params.append('start', '2015-01');
    params.append('end', monthKey(ultimo));
    const body = (await (await get(`https://api.eia.gov/v2/steo/data/?${params}`)).json()) as {
      response?: { data?: { seriesId: string; period: string; value: string | null }[] };
    };
    const rows = body.response?.data ?? [];
    if (!rows.length) throw new Error(`${s.id}: la API del STEO no devolvió datos`);
    const points = rows
      .filter((r) => r.seriesId === s.id && r.value != null)
      .map((r) => ({ date: day(`${r.period}-01`), value: Math.round(parseFloat(r.value!) * s.scale * 1000) / 1000 }))
      .filter((p) => Number.isFinite(p.value))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const nombre = s.series.split('_').slice(0, -1).join(' ');
    await replacePoints('eia_steo', s.series, `${nombre}: ${s.what} (EIA STEO)`, s.unit, points);
  }
}

/* EXPORTACIONES POR PROVINCIA, las registradas. INDEC publica la serie mensual
   de origen provincial (OPEX) dentro del ZIP de exportaciones del año
   (/files/zips/exports_{AAAA}_M.zip, mismo nombre todo el año); el xlsx trae
   2002 → último mes, una fila por mes × provincia × gran rubro, FOB en dólares.
   En enero el ZIP del año nuevo todavía no existe: se cae al del año anterior.
   La hoja cambia de nombre cada mes: se lee la primera. Foto completa: INDEC
   revisa los meses provisorios. */
async function exportacionesProvincia() {
  const anio = new Date().getUTCFullYear();
  let r = await fetch(`https://comex.indec.gob.ar/files/zips/exports_${anio}_M.zip`);
  if (r.status === 404) r = await fetch(`https://comex.indec.gob.ar/files/zips/exports_${anio - 1}_M.zip`);
  if (!r.ok) throw new Error(`comex.indec.gob.ar HTTP ${r.status}`);
  const zip = unzipSync(new Uint8Array(await r.arrayBuffer()));
  const name = Object.keys(zip).find((n) => /opex_mensual/i.test(n));
  if (!name) throw new Error('el ZIP de INDEC no trae la serie OPEX mensual');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(zip[name]) as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];

  const slug = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let col: Record<string, number> | null = null;
  const data: Prisma.FactProvinceExportCreateManyInput[] = [];
  ws.eachRow((row) => {
    const v = Array.from(row.values as ExcelJS.CellValue[], (x) => (x == null ? '' : String(x).trim()));
    if (!col) {
      if (v.includes('Nombre Prov')) col = Object.fromEntries(v.map((t, i) => [t, i]));
      return;
    }
    const c = col;
    const usd = Number(v[c['FOB_dólar']]);
    if (!/^\d{4}$/.test(v[c['Año']]) || !Number.isFinite(usd)) return;
    data.push({
      date: day(`${v[c['Año']]}-${v[c['Mes']].padStart(2, '0')}-01`),
      provinceSlug: slug(v[c['Nombre Prov']]),
      provinceName: v[c['Nombre Prov']],
      rubro: v[c['Rubro']].replace(/\s*\([^)]*\)\s*$/, ''), // "Combustibles y energía (CyE)" → sin sigla
      usd,
      kg: Number(v[c['Peso neto']]) || null,
    });
  });
  if (data.length < 10_000) throw new Error(`la serie trajo ${data.length} filas; no reemplazo`);
  const ultimo = data.reduce((a, b) => (a.date > b.date ? a : b)).date as Date;
  const nqn = data
    .filter((d) => (d.date as Date).getTime() === ultimo.getTime() && d.provinceSlug === 'neuquen')
    .reduce((a, d) => a + d.usd, 0);
  console.log(`  ${data.length} filas, último ${monthKey(ultimo)} (Neuquén: US$ ${(nqn / 1e6).toFixed(1)} M)`);
  if (DRY_RUN) return;
  await prisma.$transaction(
    async (tx) => {
      await tx.factProvinceExport.deleteMany({});
      for (let i = 0; i < data.length; i += 5000) await tx.factProvinceExport.createMany({ data: data.slice(i, i + 5000) });
    },
    { timeout: 5 * 60_000 },
  );
}

/* Pozos en perforación: el CSV trae una fila por empresa × área × yacimiento ×
   concepto (exploración, explotación…) y pesa ~70 MB; acá se suma por mes y
   provincia. La foto entera se reemplaza: la Secretaría corrige meses viejos. */
async function perforacion() {
  const rows = parse(await (await get(PERFORACION_CSV)).text(), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
  const suma = new Map<string, number>();
  for (const r of rows) {
    if (!/^\d{4}-\d{2}/.test(r.indice_tiempo)) continue;
    const k = `${r.indice_tiempo.slice(0, 7)}|${r.provincia.trim()}`;
    suma.set(k, (suma.get(k) ?? 0) + (Number(r.cantidad) || 0));
  }
  const data = [...suma].map(([k, wells]) => {
    const [mes, province] = k.split('|');
    return { date: day(`${mes}-01`), province, wells: Math.round(wells) };
  });
  if (data.length < 100) throw new Error(`el CSV trajo ${data.length} filas; no reemplazo la serie`);
  const ultimo = data.reduce((a, b) => (a.date > b.date ? a : b)).date;
  const totalUltimo = data.filter((d) => d.date.getTime() === ultimo.getTime()).reduce((a, d) => a + d.wells, 0);
  console.log(`  ${data.length} filas mes × provincia, último ${monthKey(ultimo)}: ${totalUltimo} pozos`);
  if (DRY_RUN) return;
  await prisma.$transaction([prisma.factWellsDrilling.deleteMany({}), prisma.factWellsDrilling.createMany({ data })]);
}

/* EL RIGI. La página del Ministerio se dibuja desde una planilla pública: una
   fila por PROVINCIA, así que un proyecto que cruza tres provincias viene tres
   veces. La clave es el link a la resolución, que es único por proyecto. La
   planilla no trae fecha ni número de resolución: salen de la página de cada
   norma (`fecha_publicacion=DD-MM-YYYY` y el <title>). Sólo están los APROBADOS;
   un anuncio sin resolución en el BO (p. ej. TGS, oct-2026) no entra hasta que
   el Ministerio lo cargue. La lista reemplaza a la anterior: lo que salió de la
   planilla, sale de la base. */
async function rigi() {
  const rows = parse(await (await get(RIGI_SHEET)).text(), { columns: true, skip_empty_lines: true }) as Record<
    string,
    string
  >[];
  const num = (v: string) => Number(v.replace(/\./g, '').replace(',', '.')); // formato AR: 12.240
  const porNorma = new Map<string, { name: string; provinces: string[]; r: Record<string, string> }>();
  for (const r of rows) {
    if (!r.enlace?.startsWith('http')) continue; // la fila 1 repite los títulos
    const p = porNorma.get(r.enlace);
    if (p) p.provinces.push(r.provincia);
    else porNorma.set(r.enlace, { name: r.nombre.trim(), provinces: [r.provincia], r });
  }
  if (porNorma.size < 10) throw new Error(`la planilla trajo ${porNorma.size} proyectos; no reemplazo la lista`);

  const projects: Prisma.RigiProjectCreateInput[] = [];
  for (const [url, { name, provinces, r }] of porNorma) {
    const html = await (await get(url)).text().catch(() => '');
    const fecha = html.match(/fecha_publicacion=(\d{2})-(\d{2})-(\d{4})/);
    const res = html.match(/<title>[^<]*?(Resoluci[oó]n \d+\/\d{4})/);
    projects.push({
      name,
      sector: r.sector.trim(),
      operator: r.empresa.trim() || null,
      province: provinces.join(' / '),
      investmentMusd: num(r['inv-comprometida']) || null,
      approvalDate: fecha ? day(`${fecha[3]}-${fecha[2]}-${fecha[1]}`) : null,
      resolution: res ? res[1].replace(/Resoluci[oó]n/, 'Res.') : null,
      jobs: Math.round(num(r['empleos-generados'])) || null,
      description: r.descripcion.trim() || null,
      sourceLabel: 'Ministerio de Economía — Registro RIGI',
      sourceUrl: url,
    });
  }
  const total = projects.reduce((a, p) => a + (p.investmentMusd ?? 0), 0);
  const sinFecha = projects.filter((p) => !p.approvalDate).map((p) => p.name);
  console.log(`  ${projects.length} proyectos, US$ ${total.toLocaleString('es-AR')} M${sinFecha.length ? ` · sin fecha: ${sinFecha.join(', ')}` : ''}`);
  if (DRY_RUN) return;
  await prisma.$transaction([
    prisma.rigiProject.deleteMany({ where: { name: { notIn: projects.map((p) => p.name) } } }),
    ...projects.map(({ name, ...data }) =>
      prisma.rigiProject.upsert({ where: { name }, create: { name, ...data }, update: data }),
    ),
  ]);
}

async function main() {
  const t0 = Date.now();
  // Cada bloque es independiente: si una fuente se cae, las demás se cargan igual.
  // Sin argumentos corren todos; con argumentos, sólo esos (`refresh-market.ts combustibles`).
  // datos.energia.gob.ar no responde desde el VPS, por eso combustibles y perforacion van aparte.
  const only = process.argv.slice(2);
  const blocks = [
    ['precios', 'precios energía (FRED/EIA)', energyPrices],
    ['dolar', 'dólar (argentinadatos)', fx],
    ['macro', 'macro (BCRA + datos.gob.ar)', macro],
    ['intercambio', 'intercambio energético (INDEC)', energyTrade],
    ['combustibles', 'combustibles en surtidor (datos.energia.gob.ar)', fuelPrices],
    ['rigi', 'proyectos RIGI aprobados (Ministerio de Economía)', rigi],
    ['perforacion', 'pozos en perforación (datos.energia.gob.ar)', perforacion],
    ['crudo', 'precio del crudo local: Medanito y Escalante (SE, regalías)', crudoLocal],
    ['cuencas', 'cuencas de EE.UU.: Permian y otras (EIA STEO)', cuencasEeuu],
    ['exportaciones', 'exportaciones por provincia (INDEC OPEX)', exportacionesProvincia],
  ] as const;
  const unknown = only.filter((k) => !blocks.some(([key]) => key === k));
  if (unknown.length) throw new Error(`bloques desconocidos: ${unknown.join(', ')}`);
  let failed = 0;
  for (const [key, name, fn] of blocks) {
    if (only.length && !only.includes(key)) continue;
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
