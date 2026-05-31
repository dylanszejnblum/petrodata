import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListOperatorsQueryDto, OperatorProductionQueryDto, OperatorSort } from './operators.dto';
import { parseMonthInput } from '../production/production.dto';

const SORT_COLUMN: Record<OperatorSort, string> = {
  oil_m3: 'oil_m3',
  gas_thousand_m3: 'gas_thousand_m3',
  boe: 'boe',
  active_wells: 'active_wells',
};

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListOperatorsQueryDto) {
    const sort = SORT_COLUMN[q.sort ?? 'boe'];
    const order = (q.order ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const latestRow = await this.prisma.aggMonthlyByOperator.findFirst({
      orderBy: { dateMonth: 'desc' },
      select: { dateMonth: true },
    });
    if (!latestRow) return [];
    const month = latestRow.dateMonth;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        o.operator_slug,
        o.operator_name,
        COALESCE(SUM(a.oil_m3), 0)::float AS oil_m3,
        COALESCE(SUM(a.oil_bbl_d), 0)::float AS oil_bbl_d,
        COALESCE(SUM(a.gas_thousand_m3), 0)::float AS gas_thousand_m3,
        COALESCE(SUM(a.gas_mmcf_d), 0)::float AS gas_mmcf_d,
        COALESCE(SUM(a.boe), 0)::float AS boe,
        COALESCE(SUM(a.active_wells), 0)::int AS active_wells,
        COALESCE(SUM(CASE WHEN a.vm_combined THEN a.boe ELSE 0 END), 0)::float AS vm_boe
      FROM dim_operator o
      LEFT JOIN agg_monthly_by_operator a
        ON a.operator_slug = o.operator_slug AND a.date_month = $1
      GROUP BY o.operator_slug, o.operator_name
      ORDER BY ${sort} ${order} NULLS LAST, o.operator_slug ASC
      `,
      month,
    );

    return rows.map((r) => ({
      operator_slug: r.operator_slug,
      operator_name: r.operator_name,
      latest_month: month.toISOString().slice(0, 10),
      oil_m3: r.oil_m3,
      oil_bbl_d: r.oil_bbl_d,
      gas_thousand_m3: r.gas_thousand_m3,
      gas_mmcf_d: r.gas_mmcf_d,
      boe: r.boe,
      active_wells: r.active_wells,
      vm_share_boe: r.boe ? r.vm_boe / r.boe : 0,
    }));
  }

  async detail(slug: string) {
    const op = await this.prisma.dimOperator.findUnique({ where: { operatorSlug: slug } });
    if (!op) throw new NotFoundException({ code: 'NOT_FOUND', message: `Operator not found: ${slug}` });

    const latestRow = await this.prisma.factProductionMonthly.findFirst({
      orderBy: { dateMonth: 'desc' },
      select: { dateMonth: true },
    });
    const latestMonth = latestRow?.dateMonth;
    const year = latestMonth ? latestMonth.getUTCFullYear() : new Date().getUTCFullYear();
    const ytdStart = new Date(Date.UTC(year, 0, 1));

    const ytdAgg = await this.prisma.factProductionMonthly.aggregate({
      where: { operatorSlug: slug, dateMonth: { gte: ytdStart } },
      _sum: {
        oilM3: true,
        oilBbl: true,
        gasThousandM3: true,
        gasMcf: true,
        boe: true,
      },
    });

    const latestAgg = latestMonth
      ? await this.prisma.factProductionMonthly.aggregate({
          where: { operatorSlug: slug, dateMonth: latestMonth },
          _sum: {
            oilM3: true,
            oilBblD: true,
            gasThousandM3: true,
            gasMmcfD: true,
            boe: true,
          },
        })
      : null;

    const activeWells = latestMonth
      ? await this.prisma.factProductionMonthly.findMany({
          where: { operatorSlug: slug, dateMonth: latestMonth, boe: { gt: 0 } },
          select: { wellId: true },
          distinct: ['wellId'],
        })
      : [];

    let rank: number | null = null;
    if (latestMonth) {
      const ranked = await this.prisma.factProductionMonthly.groupBy({
        by: ['operatorSlug'],
        where: { dateMonth: latestMonth },
        _sum: { boe: true },
        orderBy: { _sum: { boe: 'desc' } },
      });
      const idx = ranked.findIndex((r) => r.operatorSlug === slug);
      if (idx >= 0) rank = idx + 1;
    }

    return {
      operator_slug: op.operatorSlug,
      operator_name: op.operatorName,
      aliases: op.aliases ? op.aliases.split('|').filter(Boolean) : [],
      latest_month: latestMonth ? latestMonth.toISOString().slice(0, 10) : null,
      latest_month_rank: rank,
      latest: latestAgg && latestMonth ? {
        oil_m3: latestAgg._sum.oilM3 ?? 0,
        oil_bbl_d: latestAgg._sum.oilBblD ?? 0,
        gas_thousand_m3: latestAgg._sum.gasThousandM3 ?? 0,
        gas_mmcf_d: latestAgg._sum.gasMmcfD ?? 0,
        boe: latestAgg._sum.boe ?? 0,
        active_wells: activeWells.length,
      } : null,
      ytd: {
        year,
        oil_m3: ytdAgg._sum.oilM3 ?? 0,
        oil_bbl: ytdAgg._sum.oilBbl ?? 0,
        gas_thousand_m3: ytdAgg._sum.gasThousandM3 ?? 0,
        gas_mcf: ytdAgg._sum.gasMcf ?? 0,
        boe: ytdAgg._sum.boe ?? 0,
      },
    };
  }

  async timeSeries(slug: string, q: OperatorProductionQueryDto) {
    const op = await this.prisma.dimOperator.findUnique({ where: { operatorSlug: slug } });
    if (!op) throw new NotFoundException({ code: 'NOT_FOUND', message: `Operator not found: ${slug}` });

    const from = parseMonthInput(q.from);
    const to = parseMonthInput(q.to);

    const params: any[] = [slug];
    let dateClause = '';
    if (from) {
      params.push(from);
      dateClause += ` AND date_month >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateClause += ` AND date_month <= $${params.length}`;
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        date_month,
        SUM(oil_m3)::float AS oil_m3,
        SUM(oil_bbl_d)::float AS oil_bbl_d,
        SUM(gas_thousand_m3)::float AS gas_thousand_m3,
        SUM(gas_mmcf_d)::float AS gas_mmcf_d,
        SUM(boe)::float AS boe,
        COUNT(DISTINCT CASE WHEN boe > 0 THEN well_id END)::int AS active_wells
      FROM fact_production_monthly
      WHERE operator_slug = $1${dateClause}
      GROUP BY date_month
      ORDER BY date_month ASC
      `,
      ...params,
    );

    return rows.map((r) => ({
      date_month: new Date(r.date_month).toISOString().slice(0, 10),
      oil_m3: r.oil_m3,
      oil_bbl_d: r.oil_bbl_d,
      gas_thousand_m3: r.gas_thousand_m3,
      gas_mmcf_d: r.gas_mmcf_d,
      boe: r.boe,
      active_wells: r.active_wells,
    }));
  }
}
