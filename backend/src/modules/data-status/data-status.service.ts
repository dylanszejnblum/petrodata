import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async freshness() {
    const [
      operatorCount,
      formationCount,
      wellCount,
      factCount,
      aggCount,
      latestFact,
      earliestFact,
      latestAgg,
    ] = await this.prisma.$transaction([
      this.prisma.dimOperator.count(),
      this.prisma.dimFormation.count(),
      this.prisma.dimWell.count(),
      this.prisma.factProductionMonthly.count(),
      this.prisma.aggMonthlyByOperator.count(),
      this.prisma.factProductionMonthly.findFirst({ orderBy: { dateMonth: 'desc' }, select: { dateMonth: true } }),
      this.prisma.factProductionMonthly.findFirst({ orderBy: { dateMonth: 'asc' }, select: { dateMonth: true } }),
      this.prisma.aggMonthlyByOperator.findFirst({ orderBy: { dateMonth: 'desc' }, select: { dateMonth: true } }),
    ]);

    const fmt = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

    return {
      source: 'Secretaría de Energía / datos.energia.gob.ar',
      dataset: 'Producción de petróleo y gas por pozo',
      license: 'CC-BY-4.0',
      latest_month: fmt(latestFact?.dateMonth),
      earliest_month: fmt(earliestFact?.dateMonth),
      tables: {
        dim_operator: { rows: operatorCount },
        dim_formation: { rows: formationCount },
        dim_well: { rows: wellCount },
        fact_production_monthly: { rows: factCount, latest_month: fmt(latestFact?.dateMonth) },
        agg_monthly_by_operator: { rows: aggCount, latest_month: fmt(latestAgg?.dateMonth) },
      },
    };
  }
}
