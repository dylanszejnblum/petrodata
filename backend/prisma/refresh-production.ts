/**
 * Refresca la producción por pozo desde datos.energia.gob.ar (Capítulo IV,
 * "DDJJ abiertas y cerradas") sin pasar por los CSV de seed.ts.
 *
 * Reemplaza fact_production_monthly y agg_monthly_by_operator desde SINCE en
 * adelante, en una sola transacción. Las DDJJ se rectifican, por eso por
 * defecto vuelve a cargar los últimos 3 meses que ya había además de los nuevos.
 * Operadores, formaciones y pozos que no existían se agregan; los existentes
 * no se tocan.
 *
 *   DATABASE_URL=<coolify> pnpm db:refresh:production
 *   SINCE=2026-01 DRY_RUN=1 pnpm db:refresh:production
 *
 * Reglas sacadas de comparar el CSV fuente contra los meses ya cargados:
 * caudales con los días reales del mes, unconventional = NO CONVENCIONAL o SHALE/TIGHT,
 * vm_combined = formación vaca muerta o unconventional.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { rebuildAggByOperator } from './agg-operator';
import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const prisma = new PrismaClient();

const PACKAGE_URL =
  'http://datos.energia.gob.ar/api/3/action/package_show?id=produccion-de-petroleo-y-gas-por-pozo';
const RESOURCE_RE = /^Producción de Pozos de Gas y Petróleo - (\d{4}) \(DDJJ abiertas y cerradas/;
const DRY_RUN = process.env.DRY_RUN === '1';
const BATCH = Number(process.env.SEED_BATCH_SIZE ?? 5000);
// Un mes final con menos filas que esto (vs el mes más completo) se descarta.
// El último mes publicado suele venir al ~75% y se completa con los meses;
// se carga igual y la próxima corrida lo pisa.
const MIN_COVERAGE = Number(process.env.MIN_COVERAGE ?? 0.5);

const BBL_PER_M3 = 6.28981;
const MCF_PER_KM3 = 35.3147;
// 1 boe = 5,8 mcf. Antes era 6,29 × 5,8 = 36,48 (multiplicaba en vez de
// dividir) y el gas pesaba ~6 veces de más en el boe.
const BOE_PER_KM3_GAS = MCF_PER_KM3 / 5.8;
const daysIn = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

function units(month: Date, oilM3: number, gas: number) {
  const DAYS = daysIn(month);
  const oilBbl = oilM3 * BBL_PER_M3;
  const gasMcf = gas * MCF_PER_KM3;
  const gasBoe = gas * BOE_PER_KM3_GAS;
  return {
    oilM3,
    gasThousandM3: gas,
    oilBbl: r2(oilBbl),
    oilBblD: r2(oilBbl / DAYS),
    oilBoe: r2(oilBbl),
    gasMm3D: r4(gas / 1000 / DAYS),
    gasMcf: r2(gasMcf),
    gasMmcfD: r4(gasMcf / 1000 / DAYS),
    gasBoe: r2(gasBoe),
    boe: r2(oilBbl + gasBoe),
  };
}
const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: string | undefined) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const month = (y: number, m: number) => new Date(Date.UTC(y, m - 1, 1));

// Mismas reglas que los slugs ya cargados: los acentos quedan como "_".
const formationSlug = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
const operatorSlug = (v: string) =>
  v.trim().toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') ||
  'unknown';

async function download(url: string, year: number): Promise<string> {
  const path = join(tmpdir(), `produccion-pozos-${year}.csv`);
  const resp = await fetch(url);
  if (!resp.ok || !resp.body) throw new Error(`datos.energia.gob.ar HTTP ${resp.status} (${year})`);
  await pipeline(Readable.fromWeb(resp.body as any), createWriteStream(path));
  return path;
}

async function* rows(path: string): AsyncGenerator<Record<string, string>> {
  yield* createReadStream(path).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true, bom: true, relax_quotes: true }),
  );
}

async function main() {
  const t0 = Date.now();
  const latest = await prisma.factProductionMonthly.findFirst({
    orderBy: { dateMonth: 'desc' },
    select: { dateMonth: true },
  });
  let since: Date;
  if (process.env.SINCE) {
    const [y, m] = process.env.SINCE.split('-').map(Number);
    since = month(y, m);
  } else {
    if (!latest) throw new Error('Tabla vacía: usá seed.ts para la carga inicial o pasá SINCE');
    const d = latest.dateMonth;
    since = month(d.getUTCFullYear(), d.getUTCMonth() + 1 - 2); // los 3 últimos meses cargados
  }
  console.log(`Último mes en la base: ${latest ? monthKey(latest.dateMonth) : '—'} · recargando desde ${monthKey(since)}`);

  const pkg = await (await fetch(PACKAGE_URL)).json();
  const resources = (pkg.result.resources as { name: string; url: string }[])
    .map((r) => ({ ...r, year: Number(RESOURCE_RE.exec(r.name)?.[1]) }))
    .filter((r) => r.year >= since.getUTCFullYear());
  if (!resources.length) throw new Error('No encontré los CSV anuales en el paquete de CKAN');

  const paths: string[] = [];
  for (const r of resources) {
    console.log(`  bajando ${r.year}...`);
    paths.push(await download(r.url, r.year));
  }

  // Primera pasada: filas por mes, para cortar el mes final incompleto.
  const perMonth = new Map<string, number>();
  for (const p of paths) {
    for await (const r of rows(p)) {
      const d = month(Number(r.anio), Number(r.mes));
      if (d >= since) perMonth.set(monthKey(d), (perMonth.get(monthKey(d)) ?? 0) + 1);
    }
  }
  const months = [...perMonth.keys()].sort();
  const full = Math.max(...perMonth.values());
  while (months.length && perMonth.get(months.at(-1)!)! < full * MIN_COVERAGE) {
    const m = months.pop()!;
    console.log(`  descarto ${m}: ${perMonth.get(m)} filas de ~${full} (todavía se está declarando)`);
  }
  if (!months.length) throw new Error('No quedó ningún mes completo para cargar');
  const until = months.at(-1)!;
  console.log(`  meses a cargar: ${months.map((m) => `${m} (${perMonth.get(m)})`).join(', ')}`);

  const alias = new Map<string, string>();
  for (const o of await prisma.dimOperator.findMany()) {
    alias.set(o.operatorName.trim(), o.operatorSlug);
    for (const a of o.aliases.split('|')) if (a.trim()) alias.set(a.trim(), o.operatorSlug);
  }
  const formations = new Set((await prisma.dimFormation.findMany()).map((f) => f.formationSlug));
  const wells = new Set((await prisma.dimWell.findMany({ select: { wellId: true } })).map((w) => w.wellId));

  const newOps = new Map<string, Prisma.DimOperatorCreateManyInput>();
  const newForms = new Map<string, Prisma.DimFormationCreateManyInput>();
  const newWells = new Map<string, Prisma.DimWellCreateManyInput>();
  const facts: Prisma.FactProductionMonthlyCreateManyInput[] = [];

  for (const p of paths) {
    for await (const r of rows(p)) {
      const dateMonth = month(Number(r.anio), Number(r.mes));
      const key = monthKey(dateMonth);
      if (dateMonth < since || key > until) continue;

      const empresa = r.empresa.trim();
      let op = alias.get(empresa);
      if (!op) {
        op = operatorSlug(empresa);
        alias.set(empresa, op);
        newOps.set(op, { operatorSlug: op, operatorName: empresa, aliases: empresa });
      }
      const formacion = r.formacion.trim();
      const form = formationSlug(formacion);
      const formationVacaMuerta = form === 'vaca_muerta';
      if (!formations.has(form)) {
        formations.add(form);
        newForms.set(form, { formationSlug: form, formationName: formacion || form, formationVacaMuerta });
      }
      const unconventional =
        r.tipo_de_recurso === 'NO CONVENCIONAL' || ['SHALE', 'TIGHT'].includes(r.sub_tipo_recurso);

      const base = {
        wellId: r.idpozo,
        operatorSlug: op,
        formationSlug: form,
        concession: r.areapermisoconcesion,
        yacimiento: r.areayacimiento,
        basin: r.cuenca,
        province: r.provincia,
        wellType: r.tipopozo,
        extractionType: r.tipoextraccion,
        statusCode: r.tipoestado,
        depthM: numOrNull(r.profundidad),
      };
      if (!wells.has(r.idpozo)) {
        wells.add(r.idpozo);
        // ponytail: pozo nuevo sin coordenadas (no aparece en el mapa); sumar el padrón de pozos si hace falta
        newWells.set(r.idpozo, {
          ...base,
          sigla: r.sigla,
          operatorName: empresa,
          resourceType: r.tipo_de_recurso,
          subResourceType: r.sub_tipo_recurso,
          latitude: null,
          longitude: null,
        });
      }

      facts.push({
        ...base,
        dateMonth,
        tipoRecurso: r.tipo_de_recurso,
        coordX: null,
        coordY: null,
        ...units(dateMonth, num(r.prod_pet), num(r.prod_gas)),
        formationVacaMuerta,
        unconventional,
        vmCombined: formationVacaMuerta || unconventional,
      });
    }
  }

  // DDJJ abiertas con el gas/petróleo cargado en m3 en vez de miles de m3
  // (sep-2026: 698 pozos de Petróleos Sudamericanos, uno pasó de 260 a 241.810).
  // Un pozo suelto que salta ~1000× puede ser real (arranque); cuando lo hacen
  // muchos pozos del mismo operador en el mismo mes es el error de unidad.
  // ponytail: solo mira el mes anterior dentro de la ventana; el primer mes queda sin control
  const MIN_WELLS = 50;
  const prev = new Map<string, Prisma.FactProductionMonthlyCreateManyInput>();
  const jumps = new Map<string, { f: Prisma.FactProductionMonthlyCreateManyInput; oil: boolean; gas: boolean }[]>();
  const jumped = (cur: number, before: number) => before > 0 && cur / before > 300 && cur / before < 3000;
  for (const f of [...facts].sort((a, b) => +(a.dateMonth as Date) - +(b.dateMonth as Date))) {
    const p = prev.get(f.wellId);
    prev.set(f.wellId, f);
    if (!p) continue;
    const oil = jumped(f.oilM3!, p.oilM3!);
    const gas = jumped(f.gasThousandM3!, p.gasThousandM3!);
    if (!oil && !gas) continue;
    const k = `${monthKey(f.dateMonth as Date)} ${f.operatorSlug}`;
    jumps.set(k, [...(jumps.get(k) ?? []), { f, oil, gas }]);
  }
  for (const [k, list] of jumps) {
    if (list.length < MIN_WELLS) continue;
    for (const { f, oil, gas } of list) {
      Object.assign(f, units(f.dateMonth as Date, oil ? f.oilM3! / 1000 : f.oilM3!, gas ? f.gasThousandM3! / 1000 : f.gasThousandM3!));
    }
    console.log(`  corregido ×1000 (m3 en vez de miles de m3): ${k}, ${list.length} pozos`);
  }

  const tot = new Map<string, [number, number]>();
  for (const f of facts) {
    const t = tot.get(monthKey(f.dateMonth as Date)) ?? [0, 0];
    t[0] += f.oilBblD!;
    t[1] += f.gasMm3D!;
    tot.set(monthKey(f.dateMonth as Date), t);
  }
  for (const [m, [oil, gas]] of [...tot].sort())
    console.log(`  ${m}: ${(oil / 1000).toFixed(1)} kbbl/d petróleo · ${gas.toFixed(1)} MMm3/d gas`);

  console.log(
    `  ${facts.length} filas · nuevos: ${newOps.size} operadores, ${newForms.size} formaciones, ${newWells.size} pozos`,
  );
  if (newOps.size) console.log(`    operadores nuevos: ${[...newOps.values()].map((o) => o.operatorName).join(', ')}`);
  if (DRY_RUN) {
    console.log('DRY_RUN: no escribo nada');
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.dimOperator.createMany({ data: [...newOps.values()], skipDuplicates: true });
      await tx.dimFormation.createMany({ data: [...newForms.values()], skipDuplicates: true });
      const w = [...newWells.values()];
      for (let i = 0; i < w.length; i += BATCH) {
        await tx.dimWell.createMany({ data: w.slice(i, i + BATCH), skipDuplicates: true });
      }

      await tx.factProductionMonthly.deleteMany({ where: { dateMonth: { gte: since } } });
      for (let i = 0; i < facts.length; i += BATCH) {
        await tx.factProductionMonthly.createMany({ data: facts.slice(i, i + BATCH) });
      }

      await rebuildAggByOperator(tx, since);
    },
    { timeout: 60 * 60 * 1000, maxWait: 60_000 },
  );

  console.log(`Listo: ${monthKey(since)} → ${until} en ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
