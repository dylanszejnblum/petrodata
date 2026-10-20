import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { cached, TTL } from '../../common/cache';
import { isPreliminary, latestCompleteMonth } from '../../common/complete-month';
import { ListOperatorsQueryDto, OperatorProductionQueryDto, OperatorSort } from './operators.dto';
import { parseMonthInput } from '../production/production.dto';

const SORT_COLUMN: Record<OperatorSort, string> = {
  oil_m3: 'oil_m3',
  gas_thousand_m3: 'gas_thousand_m3',
  boe: 'boe',
  active_wells: 'active_wells',
};

export interface SeriesPoint {
  date_month: string;
  oil_m3: number;
  oil_bbl_d: number;
  gas_thousand_m3: number;
  gas_mmcf_d: number;
  boe: number;
  active_wells: number;
  /** month still being reported by operators (see common/complete-month) */
  preliminary: boolean;
}

// Economic-contribution assumptions. Volumes are official (Secretaría de Energía);
// everything below is a stated valuation convention, surfaced in the API response.
const OIL_DISCOUNT_USD_BBL = 5; // Medanito realization vs Brent
const MCF_TO_MMBTU = 1.037; // standard dry-gas heating value
const ROYALTY_RATE = 0.12; // statutory provincial royalty on wellhead value

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListOperatorsQueryDto) {
    return cached(`operators:list:${q.sort ?? 'boe'}:${q.order ?? 'desc'}`, TTL.SHORT, () =>
      this.computeList(q),
    );
  }

  private async computeList(q: ListOperatorsQueryDto) {
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

  /**
   * Economic contribution per operator over the trailing (up to) 12 months of data.
   * Gross value = oil_bbl × (Brent − discount) + gas MMBtu × PIST, priced month by month.
   * Exports are attributed pro-rata by BOE share; royalties at the statutory 12%.
   * `upTo` caps the window at months <= that date (the executives ranking replays
   * past cuts with it); omitted = the latest 12 months on file.
   */
  async contribution(upTo?: Date) {
    const monthRows = await this.prisma.$queryRawUnsafe<{ date_month: Date }[]>(
      `SELECT DISTINCT date_month FROM agg_monthly_by_operator
       WHERE $1::date IS NULL OR date_month <= $1::date
       ORDER BY date_month DESC LIMIT 12`,
      upTo ?? null,
    );
    if (!monthRows.length) return null;
    const windowMonths = monthRows.map((r) => r.date_month).reverse();
    const from = windowMonths[0];
    const to = windowMonths[windowMonths.length - 1];

    const [volumeRows, priceRows, tradeAgg, gdpRow] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT operator_slug, MAX(operator_name) AS operator_name, date_month,
          SUM(oil_bbl)::float AS oil_bbl,
          SUM(gas_mcf)::float AS gas_mcf,
          (SUM(oil_bbl) + SUM(gas_mcf) / 5.8)::float AS boe
        FROM agg_monthly_by_operator
        WHERE date_month >= $1 AND date_month <= $2
        GROUP BY operator_slug, date_month
        `,
        from,
        to,
      ),
      this.prisma.factPrice.findMany({
        where: { series: { in: ['brent', 'gas_pist'] }, date: { lte: to } },
        orderBy: { date: 'asc' },
        select: { series: true, date: true, value: true },
      }),
      this.prisma.factEnergyTrade.aggregate({
        where: { granularity: 'monthly', period: { gte: from, lte: to } },
        _sum: { energyExportsUsd: true },
      }),
      this.prisma.factPrice.findFirst({
        where: { series: 'gdp_usd' },
        orderBy: { date: 'desc' },
      }),
    ]);

    // Forward-fill: price for a month = latest observation at or before it.
    const priceAt = (series: string, month: Date): number | null => {
      let last: number | null = null;
      for (const p of priceRows) {
        if (p.series !== series) continue;
        if (p.date.getTime() > month.getTime()) break;
        last = p.value;
      }
      return last;
    };
    const brentByMonth = new Map<number, number | null>();
    const pistByMonth = new Map<number, number | null>();
    for (const m of windowMonths) {
      brentByMonth.set(m.getTime(), priceAt('brent', m));
      pistByMonth.set(m.getTime(), priceAt('gas_pist', m));
    }

    type Acc = {
      operator_name: string;
      oil_bbl: number;
      gas_mcf: number;
      boe: number;
      oil_value_usd: number;
      gas_value_usd: number;
    };
    const byOperator = new Map<string, Acc>();
    const totals = { oil_bbl: 0, gas_mcf: 0, boe: 0, oil_value_usd: 0, gas_value_usd: 0 };

    for (const r of volumeRows) {
      const t = new Date(r.date_month).getTime();
      const brent = brentByMonth.get(t);
      const pist = pistByMonth.get(t);
      const oilValue = brent != null ? r.oil_bbl * Math.max(brent - OIL_DISCOUNT_USD_BBL, 0) : 0;
      const gasValue = pist != null ? r.gas_mcf * MCF_TO_MMBTU * pist : 0;

      let acc = byOperator.get(r.operator_slug);
      if (!acc) {
        acc = { operator_name: r.operator_name, oil_bbl: 0, gas_mcf: 0, boe: 0, oil_value_usd: 0, gas_value_usd: 0 };
        byOperator.set(r.operator_slug, acc);
      }
      acc.oil_bbl += r.oil_bbl;
      acc.gas_mcf += r.gas_mcf;
      acc.boe += r.boe;
      acc.oil_value_usd += oilValue;
      acc.gas_value_usd += gasValue;
      totals.oil_bbl += r.oil_bbl;
      totals.gas_mcf += r.gas_mcf;
      totals.boe += r.boe;
      totals.oil_value_usd += oilValue;
      totals.gas_value_usd += gasValue;
    }

    const months = windowMonths.length;
    const annualize = 12 / months;
    const energyExportsUsd = tradeAgg._sum.energyExportsUsd ?? null;
    const gdpUsd = gdpRow?.value ?? null;
    const totalGross = totals.oil_value_usd + totals.gas_value_usd;

    const avg = (series: Map<number, number | null>) => {
      const vals = [...series.values()].filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const operators = [...byOperator.entries()]
      .filter(([, a]) => a.boe > 0)
      .map(([slug, a]) => {
        const gross = a.oil_value_usd + a.gas_value_usd;
        const shareBoe = totals.boe ? a.boe / totals.boe : 0;
        return {
          operator_slug: slug,
          operator_name: a.operator_name,
          oil_bbl: a.oil_bbl,
          gas_mcf: a.gas_mcf,
          boe: a.boe,
          share_boe: shareBoe,
          share_oil: totals.oil_bbl ? a.oil_bbl / totals.oil_bbl : 0,
          share_gas: totals.gas_mcf ? a.gas_mcf / totals.gas_mcf : 0,
          oil_value_usd: a.oil_value_usd,
          gas_value_usd: a.gas_value_usd,
          gross_value_usd: gross,
          gross_value_annualized_usd: gross * annualize,
          attributed_exports_usd: energyExportsUsd != null ? energyExportsUsd * shareBoe : null,
          royalties_usd: gross * ROYALTY_RATE,
          value_share_of_gdp: gdpUsd ? (gross * annualize) / gdpUsd : null,
        };
      })
      .sort((x, y) => y.gross_value_usd - x.gross_value_usd);

    return {
      window: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        months,
      },
      totals: {
        oil_bbl: totals.oil_bbl,
        gas_mcf: totals.gas_mcf,
        boe: totals.boe,
        gross_value_usd: totalGross,
        gross_value_annualized_usd: totalGross * annualize,
        royalties_usd: totalGross * ROYALTY_RATE,
        energy_exports_usd: energyExportsUsd,
        gdp_usd: gdpUsd,
        gdp_year: gdpRow ? gdpRow.date.getUTCFullYear() : null,
        value_share_of_gdp: gdpUsd ? (totalGross * annualize) / gdpUsd : null,
      },
      assumptions: {
        brent_avg_usd_bbl: avg(brentByMonth),
        oil_discount_usd_bbl: OIL_DISCOUNT_USD_BBL,
        gas_pist_avg_usd_mmbtu: avg(pistByMonth),
        mcf_to_mmbtu: MCF_TO_MMBTU,
        royalty_rate: ROYALTY_RATE,
      },
      operators,
    };
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

    const activeWellsRows = latestMonth
      ? await this.prisma.$queryRaw<{ active_wells: number }[]>`
          SELECT COUNT(DISTINCT well_id)::int AS active_wells
          FROM fact_production_monthly
          WHERE operator_slug = ${slug} AND date_month = ${latestMonth} AND boe > 0
        `
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
        active_wells: activeWellsRows[0]?.active_wells ?? 0,
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

    return cached(
      `operators:series:${slug}:${q.from ?? ''}:${q.to ?? ''}:${q.months ?? ''}`,
      TTL.SHORT,
      async () => (await this.querySeries([slug], { from, to, months: q.months })).get(slug) ?? [],
    );
  }

  /** One grouped query for several operators; returns one entry per requested slug. */
  async batchSeries(slugs: string[], months?: number) {
    const key = `operators:batch:${[...slugs].sort().join(',')}:${months ?? ''}`;
    return cached(key, TTL.SHORT, async () => {
      const bySlug = await this.querySeries(slugs, { months });
      return slugs.map((slug) => ({ operator_slug: slug, points: bySlug.get(slug) ?? [] }));
    });
  }

  private async querySeries(
    slugs: string[],
    opts: { from?: Date; to?: Date; months?: number },
  ): Promise<Map<string, SeriesPoint[]>> {
    const conds: Prisma.Sql[] = [Prisma.sql`operator_slug IN (${Prisma.join(slugs)})`];
    if (opts.from) conds.push(Prisma.sql`date_month >= ${opts.from}`);
    if (opts.to) conds.push(Prisma.sql`date_month <= ${opts.to}`);
    if (!opts.from && opts.months) {
      conds.push(
        Prisma.sql`date_month >= (SELECT MAX(date_month) FROM fact_production_monthly) - (${opts.months} * INTERVAL '1 month')`,
      );
    }
    const where = Prisma.join(conds, ' AND ');

    const complete = await latestCompleteMonth(this.prisma);
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        operator_slug,
        date_month,
        SUM(oil_m3)::float AS oil_m3,
        SUM(oil_bbl_d)::float AS oil_bbl_d,
        SUM(gas_thousand_m3)::float AS gas_thousand_m3,
        SUM(gas_mmcf_d)::float AS gas_mmcf_d,
        SUM(boe)::float AS boe,
        COUNT(DISTINCT CASE WHEN boe > 0 THEN well_id END)::int AS active_wells
      FROM fact_production_monthly
      WHERE ${where}
      GROUP BY operator_slug, date_month
      ORDER BY date_month ASC
    `;

    const bySlug = new Map<string, SeriesPoint[]>();
    for (const r of rows) {
      const list = bySlug.get(r.operator_slug) ?? [];
      list.push({
        date_month: new Date(r.date_month).toISOString().slice(0, 10),
        oil_m3: r.oil_m3,
        oil_bbl_d: r.oil_bbl_d,
        gas_thousand_m3: r.gas_thousand_m3,
        gas_mmcf_d: r.gas_mmcf_d,
        boe: r.boe,
        active_wells: r.active_wells,
        preliminary: isPreliminary(r.date_month, complete),
      });
      bySlug.set(r.operator_slug, list);
    }
    return bySlug;
  }
}
