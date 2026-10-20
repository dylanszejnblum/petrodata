/**
 * Equipos de perforación activos en Argentina, desde el Worldwide Rig Count de
 * Baker Hughes (hoja «WW Monthly», una fila por valor).
 *
 *   pnpm db:load:rigs <xlsx> [<xlsx>…]          suma/actualiza los meses de esos archivos
 *   pnpm db:load:rigs --reset <archivo> <actual> borra la serie antes (primera carga)
 *
 * EL ARCHIVO SE BAJA A MANO. rigcount.bakerhughes.com/intl-rig-count está detrás
 * de Akamai y le contesta 403 a todo lo que no sea un navegador, así que una vez
 * por mes (sale los primeros días hábiles) hay que entrar con el navegador, bajar
 * «Worldwide Rig Count Report - New Report» y pasarle la ruta a este script. El
 * link cambia en cada publicación (/static-files/<GUID>).
 *
 * Para la primera carga van los dos archivos: el histórico «New Report
 * (2013-Jul 2025)» y el actual. Son el MISMO método (el nuevo de ago-2025); la
 * serie vieja de esta tabla era otra cosa (85 equipos en abr-2026 contra 44 de
 * Baker Hughes) y por eso se reemplaza entera con --reset. Baker Hughes revisa
 * meses para atrás: cada carga pisa los meses que trae el archivo.
 */
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();
const MESES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Mes como número (1–12) a partir de 9, "9", "Sep" o "September". */
function mesDe(v: unknown): number | null {
  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
  const i = MESES.indexOf(String(v).trim().slice(0, 3).toLowerCase());
  return i >= 0 ? i + 1 : null;
}

const texto = (v: ExcelJS.CellValue) =>
  v && typeof v === 'object' && 'result' in v ? String(v.result ?? '') : String(v ?? '');

async function leer(path: string): Promise<Map<string, { oil: number; gas: number }>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet('WW Monthly');
  if (!ws) throw new Error(`${path}: no tiene la hoja «WW Monthly»`);

  // las columnas cambian entre el histórico y el actual: se buscan por título
  let col: Record<string, number> | null = null;
  const meses = new Map<string, { oil: number; gas: number }>();
  ws.eachRow((row) => {
    // row.values es un arreglo con huecos (índice = número de columna): Array.from los rellena
    const celdas = Array.from(row.values as ExcelJS.CellValue[], (v) => texto(v).trim());
    if (!col) {
      if (celdas.includes('Country') && celdas.includes('DrillFor')) {
        col = Object.fromEntries(celdas.map((t, i) => [t, i]));
      }
      return;
    }
    const c = col;
    if (celdas[c['Country']]?.toUpperCase() !== 'ARGENTINA') return;
    if (c['Rig Status'] && !/active/i.test(celdas[c['Rig Status']])) return;
    const anio = Number(celdas[c['Year']]);
    const mes = mesDe(celdas[c['Month']]);
    const valor = Number(celdas[c['Rig Count Value']] ?? celdas[c['Value']]);
    if (!anio || !mes || !Number.isFinite(valor)) return;
    const key = `${anio}-${String(mes).padStart(2, '0')}`;
    const m = meses.get(key) ?? { oil: 0, gas: 0 };
    // tierra y costa afuera vienen en filas separadas: se suman
    if (/oil/i.test(celdas[c['DrillFor']])) m.oil += valor;
    else if (/gas/i.test(celdas[c['DrillFor']])) m.gas += valor;
    meses.set(key, m);
  });
  if (!col) throw new Error(`${path}: no encontré la fila de títulos (Country / DrillFor)`);
  if (!meses.size) throw new Error(`${path}: no hay filas de ARGENTINA`);
  return meses;
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  const files = args.filter((a) => a !== '--reset');
  if (!files.length) throw new Error('Uso: pnpm db:load:rigs [--reset] <xlsx> [<xlsx>…]');

  // en orden: el archivo posterior pisa al anterior en los meses que comparten
  const meses = new Map<string, { oil: number; gas: number }>();
  for (const f of files) {
    const m = await leer(f);
    const keys = [...m.keys()].sort();
    console.log(`  ${f}: ${m.size} meses, ${keys[0]} → ${keys.at(-1)}`);
    for (const [k, v] of m) meses.set(k, v);
  }
  const data = [...meses.entries()].map(([k, v]) => ({
    date: new Date(`${k}-01T00:00:00Z`),
    oilRigs: v.oil,
    gasRigs: v.gas,
    totalRigs: v.oil + v.gas,
  }));
  const ultimo = data.reduce((a, b) => (a.date > b.date ? a : b));
  console.log(`  último: ${ultimo.date.toISOString().slice(0, 7)} — ${ultimo.oilRigs} petróleo + ${ultimo.gasRigs} gas = ${ultimo.totalRigs}`);
  if (process.env.DRY_RUN === '1') return console.log('DRY_RUN: no escribí nada.');

  await prisma.$transaction([
    reset
      ? prisma.factRigCount.deleteMany({})
      : prisma.factRigCount.deleteMany({ where: { date: { in: data.map((d) => d.date) } } }),
    prisma.factRigCount.createMany({ data }),
  ]);
  console.log(`  ${data.length} meses cargados${reset ? ' (serie reemplazada)' : ''}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
