import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoWellsQueryDto, parseBbox } from './geo.dto';

export interface WellFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, any>;
}

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async wells(q: GeoWellsQueryDto) {
    const limit = q.limit ?? 1000;
    const where: Prisma.DimWellWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
    };
    if (q.operator) where.operatorSlug = q.operator;
    if (q.formation) where.formationSlug = q.formation;
    if (q.basin) where.basin = q.basin;
    if (q.province) where.province = q.province;

    if (q.bbox) {
      const bbox = parseBbox(q.bbox);
      if (!bbox) throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid bbox: expected "west,south,east,north"' });
      where.latitude = { gte: bbox.south, lte: bbox.north };
      where.longitude = { gte: bbox.west, lte: bbox.east };
    }

    const rows = await this.prisma.dimWell.findMany({ where, take: limit });

    const features: WellFeature[] = rows.map((w) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [w.longitude as number, w.latitude as number] },
      properties: {
        well_id: w.wellId,
        sigla: w.sigla,
        operator_slug: w.operatorSlug,
        operator_name: w.operatorName,
        formation_slug: w.formationSlug,
        basin: w.basin,
        province: w.province,
        concession: w.concession,
        yacimiento: w.yacimiento,
        well_type: w.wellType,
        status_code: w.statusCode,
        depth_m: w.depthM,
      },
    }));

    return {
      __raw: true,
      type: 'FeatureCollection',
      features,
    };
  }

  async well(wellId: string) {
    const w = await this.prisma.dimWell.findUnique({ where: { wellId } });
    if (!w) throw new NotFoundException({ code: 'NOT_FOUND', message: `Well not found: ${wellId}` });
    if (w.latitude == null || w.longitude == null) {
      throw new NotFoundException({ code: 'NO_GEOMETRY', message: `Well ${wellId} has no coordinates` });
    }
    return {
      __raw: true,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [w.longitude, w.latitude] },
      properties: {
        well_id: w.wellId,
        sigla: w.sigla,
        operator_slug: w.operatorSlug,
        operator_name: w.operatorName,
        formation_slug: w.formationSlug,
        basin: w.basin,
        province: w.province,
        concession: w.concession,
        yacimiento: w.yacimiento,
        well_type: w.wellType,
        status_code: w.statusCode,
        depth_m: w.depthM,
      },
    };
  }
}
