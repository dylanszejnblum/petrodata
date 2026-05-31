import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MineralProjectsService,
  NormalizedProject,
} from '../shared/mineral-projects.service';
import {
  isExploration,
  isOperating,
  provinceCode,
  slugify,
  stageRank,
} from '../shared/mineral-entities.util';
import { ListProvincesQueryDto } from './provinces.dto';

interface ProvinceBucket {
  name: string;
  slug: string;
  projects: NormalizedProject[];
}

@Injectable()
export class ProvincesService {
  constructor(private readonly projectsService: MineralProjectsService) {}

  async list(q: ListProvincesQueryDto) {
    const buckets = await this.buildIndex();

    let provinces = [...buckets.values()].map((b) => ({
      slug: b.slug,
      name: b.name,
      iso_code: provinceCode(b.name),
      project_count: b.projects.length,
      commodities: distinct(b.projects.map((p) => p.commodity)).sort(),
      total_resources: null as number | null,
    }));

    if (q.commodity) {
      const c = q.commodity.toLowerCase();
      provinces = provinces.filter((p) => p.commodities.some((x) => x.toLowerCase() === c));
    }

    return provinces.sort((a, b) => a.name.localeCompare(b.name));
  }

  async detail(slug: string) {
    const buckets = await this.buildIndex();
    const bucket = buckets.get(slug.toLowerCase());
    if (!bucket) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Province not found: ${slug}` });
    }

    const projects = [...bucket.projects].sort(
      (a, b) => stageRank(b.status) - stageRank(a.status) || a.name.localeCompare(b.name),
    );

    const byCommodity = new Map<string, number>();
    for (const p of projects) byCommodity.set(p.commodity, (byCommodity.get(p.commodity) ?? 0) + 1);

    const companies = distinct(
      projects.flatMap((p) => p.controllers.map((c) => c.name)),
    ).sort();

    return {
      name: bucket.name,
      slug: bucket.slug,
      iso_code: provinceCode(bucket.name),
      project_count: projects.length,
      commodities: [...byCommodity.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, project_count]) => ({ name, project_count, total_resources: null })),
      projects: projects.map((p) => ({
        name: p.name,
        status: p.status_label ?? p.status,
        commodity: p.commodity,
        controllers: p.controllers,
        coordinates: { lat: p.latitude, lng: p.longitude },
        resources_summary: p.resources_summary,
      })),
      trade_stats: null,
      active_mines: projects.filter((p) => isOperating(p.status)).length,
      exploration_projects: projects.filter((p) => isExploration(p.status)).length,
      companies_operating: companies,
    };
  }

  private async buildIndex(): Promise<Map<string, ProvinceBucket>> {
    const projects = await this.projectsService.getAll();
    const buckets = new Map<string, ProvinceBucket>();

    for (const p of projects) {
      if (!p.province) continue;
      const slug = slugify(p.province);
      let bucket = buckets.get(slug);
      if (!bucket) {
        bucket = { name: p.province, slug, projects: [] };
        buckets.set(slug, bucket);
      }
      bucket.projects.push(p);
    }

    return buckets;
  }
}

function distinct<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
