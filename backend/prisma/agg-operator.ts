import type { Prisma } from '@prisma/client';

/** Rearma agg_monthly_by_operator desde fact_production_monthly para los meses >= since. */
export async function rebuildAggByOperator(tx: Prisma.TransactionClient, since: Date) {
  await tx.aggMonthlyByOperator.deleteMany({ where: { dateMonth: { gte: since } } });
  await tx.$executeRaw`
    INSERT INTO agg_monthly_by_operator
      (date_month, operator_slug, operator_name, concession, yacimiento, province, formation_slug,
       vm_combined, oil_m3, oil_bbl, oil_bbl_d, gas_thousand_m3, gas_mm3_d, gas_mcf, gas_mmcf_d,
       boe, active_wells)
    SELECT f.date_month, f.operator_slug, o.operator_name, f.concession, f.yacimiento, f.province,
           f.formation_slug, f.vm_combined,
           round(sum(f.oil_m3)::numeric, 2), round(sum(f.oil_bbl)::numeric, 2),
           round(sum(f.oil_bbl_d)::numeric, 2), round(sum(f.gas_thousand_m3)::numeric, 2),
           round(sum(f.gas_mm3_d)::numeric, 2), round(sum(f.gas_mcf)::numeric, 2),
           round(sum(f.gas_mmcf_d)::numeric, 2), round(sum(f.boe)::numeric, 2),
           count(*) FILTER (WHERE f.boe > 0) -- activo = produjo; un pozo que declaró cero no cuenta
    FROM fact_production_monthly f
    JOIN dim_operator o USING (operator_slug)
    WHERE f.date_month >= ${since}
    GROUP BY 1, 2, 3, 4, 5, 6, 7, 8`;
}
