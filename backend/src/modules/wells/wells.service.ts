import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginated, skipTake } from '../../common/pagination.dto';
import { ListWellsQueryDto, WellProductionQueryDto } from './wells.dto';
import { parseMonthInput } from '../production/production.dto';

@Injectable()
export class WellsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListWellsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;

    const where: Prisma.DimWellWhereInput = {};
    if (q.operator) where.operatorSlug = q.operator;
    if (q.formation) where.formationSlug = q.formation;
    if (q.basin) where.basin = q.basin;
    if (q.province) where.province = q.province;
    if (q.concession) where.concession = q.concession;
    if (q.search) where.sigla = { contains: q.search, mode: 'insensitive' };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.dimWell.count({ where }),
      this.prisma.dimWell.findMany({
        where,
        orderBy: { sigla: 'asc' },
        ...skipTake(page, limit),
      }),
    ]);

    return paginated(rows.map(this.shapeWell), total, page, limit);
  }

  async detail(wellId: string) {
    const well = await this.prisma.dimWell.findUnique({ where: { wellId } });
    if (!well) throw new NotFoundException({ code: 'NOT_FOUND', message: `Well not found: ${wellId}` });

    const latest = await this.prisma.factProductionMonthly.findFirst({
      where: { wellId },
      orderBy: { dateMonth: 'desc' },
    });

    return {
      ...this.shapeWell(well),
      latest_production: latest ? {
        date_month: latest.dateMonth.toISOString().slice(0, 10),
        oil_m3: latest.oilM3,
        oil_bbl_d: latest.oilBblD,
        gas_thousand_m3: latest.gasThousandM3,
        gas_mmcf_d: latest.gasMmcfD,
        boe: latest.boe,
        vm_combined: latest.vmCombined,
      } : null,
    };
  }

  async timeSeries(wellId: string, q: WellProductionQueryDto) {
    const well = await this.prisma.dimWell.findUnique({ where: { wellId }, select: { wellId: true } });
    if (!well) throw new NotFoundException({ code: 'NOT_FOUND', message: `Well not found: ${wellId}` });

    const from = parseMonthInput(q.from);
    const to = parseMonthInput(q.to);

    const where: Prisma.FactProductionMonthlyWhereInput = { wellId };
    if (from || to) {
      where.dateMonth = {};
      if (from) (where.dateMonth as Prisma.DateTimeFilter).gte = from;
      if (to) (where.dateMonth as Prisma.DateTimeFilter).lte = to;
    }

    const rows = await this.prisma.factProductionMonthly.findMany({
      where,
      orderBy: { dateMonth: 'asc' },
    });

    return rows.map((r) => ({
      date_month: r.dateMonth.toISOString().slice(0, 10),
      oil_m3: r.oilM3,
      oil_bbl: r.oilBbl,
      oil_bbl_d: r.oilBblD,
      gas_thousand_m3: r.gasThousandM3,
      gas_mm3_d: r.gasMm3D,
      gas_mmcf_d: r.gasMmcfD,
      boe: r.boe,
      vm_combined: r.vmCombined,
    }));
  }

  private shapeWell = (w: any) => ({
    well_id: w.wellId,
    sigla: w.sigla,
    operator_slug: w.operatorSlug,
    operator_name: w.operatorName,
    formation_slug: w.formationSlug,
    province: w.province,
    basin: w.basin,
    concession: w.concession,
    yacimiento: w.yacimiento,
    well_type: w.wellType,
    extraction_type: w.extractionType,
    status_code: w.statusCode,
    resource_type: w.resourceType,
    sub_resource_type: w.subResourceType,
    depth_m: w.depthM,
    latitude: w.latitude,
    longitude: w.longitude,
  });
}
