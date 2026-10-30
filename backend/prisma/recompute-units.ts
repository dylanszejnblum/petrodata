/**
 * Recalcula los caudales y el boe de TODA la historia en fact_production_monthly
 * y rearma agg_monthly_by_operator, sin bajar nada de la fuente:
 *   - boe del gas: 35,3147 / 5,8 por mil m3 (antes 36,48, ~6x de más)
 *   - bbl/d, MMm3/d y MMcf/d con los días reales del mes (antes 30 fijos)
 *
 *   DRY_RUN=1 DATABASE_URL=<coolify> pnpm db:recompute:units   (antes/después, no escribe)
 *   DATABASE_URL=<coolify> pnpm db:recompute:units
 */
import { PrismaClient } from '@prisma/client';
import { rebuildAggByOperator } from './agg-operator';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === '1';

const resumen = () => prisma.$queryRaw<
  { month: string; oil_bbl_d: number; gas_mm3_d: number; gas_share_boe: number }[]
>`
  SELECT to_char(date_month, 'YYYY-MM') AS month,
         round(sum(oil_bbl_d)::numeric)::float AS oil_bbl_d,
         round(sum(gas_mm3_d)::numeric, 1)::float AS gas_mm3_d,
         round((sum(gas_boe) / nullif(sum(boe), 0))::numeric, 3)::float AS gas_share_boe
  FROM fact_production_monthly
  WHERE date_month >= (SELECT max(date_month) FROM fact_production_monthly) - interval '2 months'
  GROUP BY 1 ORDER BY 1`;

async function main() {
  console.table(await resumen());
  if (DRY_RUN) return console.log('DRY_RUN: no escribo nada');

  await prisma.$transaction(
    async (tx) => {
      const n = await tx.$executeRaw`
        UPDATE fact_production_monthly SET
          gas_boe    = round((gas_thousand_m3 * 35.3147 / 5.8)::numeric, 2),
          boe        = round((oil_bbl + gas_thousand_m3 * 35.3147 / 5.8)::numeric, 2),
          oil_bbl_d  = round((oil_bbl / extract(day from date_month + interval '1 month' - interval '1 day'))::numeric, 2),
          gas_mm3_d  = round((gas_thousand_m3 / 1000 / extract(day from date_month + interval '1 month' - interval '1 day'))::numeric, 4),
          gas_mmcf_d = round((gas_mcf / 1000 / extract(day from date_month + interval '1 month' - interval '1 day'))::numeric, 4)`;
      console.log(`${n} filas recalculadas`);
      await rebuildAggByOperator(tx, new Date(0));
    },
    { timeout: 60 * 60 * 1000, maxWait: 60_000 },
  );
  console.table(await resumen());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
