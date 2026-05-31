import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CompanyRef,
  controllersFromJson,
  controllersFromOperator,
  provinceCode,
  resourcesSummary,
} from './mineral-entities.util';

export interface NormalizedProject {
  name: string;
  commodity: string;
  province: string | null;
  province_code: string | null;
  status: string | null;
  status_label: string | null;
  latitude: number | null;
  longitude: number | null;
  controllers: CompanyRef[];
  resources_summary: Record<string, number> | null;
  resources_raw: unknown;
  source: 'siacam_uranium' | 'mining_pipeline';
}

/**
 * Single source of truth for the unified project list. Uranium comes from the
 * richer SIACAM table (`uranium_project`); every other commodity comes from the
 * mining pipeline (`mining_project`). Mining rows tagged `Uranium` are excluded
 * to avoid double-counting the SIACAM uranium projects.
 */
@Injectable()
export class MineralProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<NormalizedProject[]> {
    const [uranium, mining] = await Promise.all([
      this.prisma.uraniumProject.findMany(),
      this.prisma.miningProject.findMany({
        where: { primaryCommodity: { not: 'Uranium', mode: 'insensitive' } },
      }),
    ]);

    const out: NormalizedProject[] = [];

    for (const u of uranium) {
      out.push({
        name: u.projectName,
        commodity: u.mineral || 'Uranio',
        province: u.province,
        province_code: provinceCode(u.province, u.provinceCode),
        status: u.status,
        status_label: u.statusLabel,
        latitude: u.latitude,
        longitude: u.longitude,
        controllers: controllersFromJson(u.controllers),
        resources_summary: null,
        resources_raw: null,
        source: 'siacam_uranium',
      });
    }

    for (const m of mining) {
      out.push({
        name: m.projectName,
        commodity: m.primaryCommodity,
        province: m.province,
        province_code: provinceCode(m.province),
        status: m.status,
        status_label: m.status,
        latitude: m.latitude,
        longitude: m.longitude,
        controllers: controllersFromOperator(m.operator, m.ownerController),
        resources_summary: resourcesSummary(m.resources),
        resources_raw: m.resources ?? null,
        source: 'mining_pipeline',
      });
    }

    return out;
  }
}
