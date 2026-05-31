import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginated, skipTake } from '../../common/pagination.dto';
import { GroupBy, MonthlyQueryDto, parseMonthInput, parseVmFlag } from './production.dto';

const GROUP_BY_COLUMN: Record<GroupBy, string> = {
  operator: 'operator_slug',
  concession: 'concession',
  formation: 'formation_slug',
  province: 'province',
};

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async monthly(q: MonthlyQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const from = parseMonthInput(q.from);
    const to = parseMonthInput(q.to);
    const vm = parseVmFlag(q.vm);

    if (q.group_by) {
      return this.groupedMonthly(q.group_by, { from, to, vm, operator: q.operator, formation: q.formation, province: q.province }, page, limit);
    }

    const where: Prisma.FactProductionMonthlyWhereInput = {};
    if (q.operator) where.operatorSlug = q.operator;
    if (q.formation) where.formationSlug = q.formation;
    if (q.province) where.province = q.province;
    if (vm !== undefined) where.vmCombined = vm;
    if (from || to) {
      where.dateMonth = {};
      if (from) (where.dateMonth as Prisma.DateTimeFilter).gte = from;
      if (to) (where.dateMonth as Prisma.DateTimeFilter).lte = to;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.factProductionMonthly.count({ where }),
      this.prisma.factProductionMonthly.findMany({
        where,
        orderBy: [{ dateMonth: 'desc' }, { boe: 'desc' }],
        ...skipTake(page, limit),
      }),
    ]);

    return paginated(rows.map(this.shapeFact), total, page, limit);
  }

  private async groupedMonthly(
    groupBy: GroupBy,
    filters: { from?: Date; to?: Date; vm?: boolean; operator?: string; formation?: string; province?: string },
    page: number,
    limit: number,
  ) {
    const column = GROUP_BY_COLUMN[groupBy];
    const params: any[] = [];
    const conds: string[] = [];
    const add = (sql: string, val: any) => {
      params.push(val);
      conds.push(sql.replace('?', `$${params.length}`));
    };

    if (filters.operator) add('operator_slug = ?', filters.operator);
    if (filters.formation) add('formation_slug = ?', filters.formation);
    if (filters.province) add('province = ?', filters.province);
    if (filters.vm !== undefined) add('vm_combined = ?', filters.vm);
    if (filters.from) add('date_month >= ?', filters.from);
    if (filters.to) add('date_month <= ?', filters.to);

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countSql = `
      SELECT COUNT(*)::int AS total FROM (
        SELECT 1 FROM fact_production_monthly ${whereSql}
        GROUP BY date_month, ${column}
      ) t
    `;
    const dataSql = `
      SELECT
        date_month,
        ${column} AS group_key,
        SUM(oil_m3)::float AS oil_m3,
        SUM(oil_bbl)::float AS oil_bbl,
        SUM(oil_bbl_d)::float AS oil_bbl_d,
        SUM(gas_thousand_m3)::float AS gas_thousand_m3,
        SUM(gas_mm3_d)::float AS gas_mm3_d,
        SUM(gas_mcf)::float AS gas_mcf,
        SUM(gas_mmcf_d)::float AS gas_mmcf_d,
        SUM(boe)::float AS boe,
        COUNT(DISTINCT well_id)::int AS active_wells
      FROM fact_production_monthly
      ${whereSql}
      GROUP BY date_month, ${column}
      ORDER BY date_month DESC, boe DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countRows, rows] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...params),
      this.prisma.$queryRawUnsafe<any[]>(dataSql, ...params),
    ]);

    const total = countRows[0]?.total ?? 0;
    const shaped = rows.map((r) => ({
      date_month: this.formatMonth(r.date_month),
      [groupBy]: r.group_key,
      oil_m3: r.oil_m3,
      oil_bbl: r.oil_bbl,
      oil_bbl_d: r.oil_bbl_d,
      gas_thousand_m3: r.gas_thousand_m3,
      gas_mm3_d: r.gas_mm3_d,
      gas_mcf: r.gas_mcf,
      gas_mmcf_d: r.gas_mmcf_d,
      boe: r.boe,
      active_wells: r.active_wells,
    }));

    return paginated(shaped, total, page, limit);
  }

  async latest() {
    const latestRow = await this.prisma.factProductionMonthly.findFirst({
      orderBy: { dateMonth: 'desc' },
      select: { dateMonth: true },
    });
    if (!latestRow) {
      return {
        date_month: null,
        oil_m3: 0,
        oil_bbl_d: 0,
        gas_thousand_m3: 0,
        gas_mmcf_d: 0,
        boe: 0,
        active_wells: 0,
        vm_share: { oil: 0, gas: 0, boe: 0 },
        top_operators: [],
      };
    }

    const month = latestRow.dateMonth;

    const totalsAgg = await this.prisma.factProductionMonthly.aggregate({
      where: { dateMonth: month },
      _sum: { oilM3: true, oilBblD: true, gasThousandM3: true, gasMmcfD: true, boe: true },
    });
    const activeWells = await this.prisma.factProductionMonthly.findMany({
      where: { dateMonth: month, boe: { gt: 0 } },
      select: { wellId: true },
      distinct: ['wellId'],
    });

    const vmAgg = await this.prisma.factProductionMonthly.aggregate({
      where: { dateMonth: month, vmCombined: true },
      _sum: { oilM3: true, gasThousandM3: true, boe: true },
    });

    const topRows = await this.prisma.factProductionMonthly.groupBy({
      by: ['operatorSlug'],
      where: { dateMonth: month },
      _sum: { boe: true, oilM3: true, gasThousandM3: true },
      orderBy: { _sum: { boe: 'desc' } },
      take: 5,
    });
    const operatorNames = await this.prisma.dimOperator.findMany({
      where: { operatorSlug: { in: topRows.map((r) => r.operatorSlug) } },
      select: { operatorSlug: true, operatorName: true },
    });
    const nameMap = new Map(operatorNames.map((o) => [o.operatorSlug, o.operatorName]));

    const totalOil = totalsAgg._sum.oilM3 ?? 0;
    const totalGas = totalsAgg._sum.gasThousandM3 ?? 0;
    const totalBoe = totalsAgg._sum.boe ?? 0;

    return {
      date_month: this.formatMonth(month),
      oil_m3: totalOil,
      oil_bbl_d: totalsAgg._sum.oilBblD ?? 0,
      gas_thousand_m3: totalGas,
      gas_mmcf_d: totalsAgg._sum.gasMmcfD ?? 0,
      boe: totalBoe,
      active_wells: activeWells.length,
      vm_share: {
        oil: totalOil ? (vmAgg._sum.oilM3 ?? 0) / totalOil : 0,
        gas: totalGas ? (vmAgg._sum.gasThousandM3 ?? 0) / totalGas : 0,
        boe: totalBoe ? (vmAgg._sum.boe ?? 0) / totalBoe : 0,
      },
      top_operators: topRows.map((r) => ({
        operator_slug: r.operatorSlug,
        operator_name: nameMap.get(r.operatorSlug) ?? r.operatorSlug,
        oil_m3: r._sum.oilM3 ?? 0,
        gas_thousand_m3: r._sum.gasThousandM3 ?? 0,
        boe: r._sum.boe ?? 0,
      })),
    };
  }

  private formatMonth(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  }

  private shapeFact = (r: any) => ({
    id: r.id,
    date_month: this.formatMonth(r.dateMonth),
    well_id: r.wellId,
    operator_slug: r.operatorSlug,
    formation_slug: r.formationSlug,
    concession: r.concession,
    yacimiento: r.yacimiento,
    basin: r.basin,
    province: r.province,
    well_type: r.wellType,
    extraction_type: r.extractionType,
    status_code: r.statusCode,
    tipo_recurso: r.tipoRecurso,
    depth_m: r.depthM,
    coord_x: r.coordX,
    coord_y: r.coordY,
    oil_m3: r.oilM3,
    gas_thousand_m3: r.gasThousandM3,
    oil_bbl: r.oilBbl,
    oil_bbl_d: r.oilBblD,
    oil_boe: r.oilBoe,
    gas_mm3_d: r.gasMm3D,
    gas_mcf: r.gasMcf,
    gas_mmcf_d: r.gasMmcfD,
    gas_boe: r.gasBoe,
    boe: r.boe,
    formation_vaca_muerta: r.formationVacaMuerta,
    unconventional: r.unconventional,
    vm_combined: r.vmCombined,
  });
}
