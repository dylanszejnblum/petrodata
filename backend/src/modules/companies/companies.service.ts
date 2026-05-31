import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MineralProjectsService,
  NormalizedProject,
} from '../shared/mineral-projects.service';
import { CompanyRef, stageRank } from '../shared/mineral-entities.util';
import { ListCompaniesQueryDto } from './companies.dto';

interface CompanyBucket {
  ref: CompanyRef;
  projects: NormalizedProject[];
}

@Injectable()
export class CompaniesService {
  constructor(private readonly projectsService: MineralProjectsService) {}

  async list(q: ListCompaniesQueryDto) {
    const buckets = await this.buildIndex();

    let companies = [...buckets.values()].map((b) => ({
      slug: b.ref.slug,
      name: b.ref.name,
      origin_country: b.ref.origin_country,
      project_count: b.projects.length,
      commodities: distinct(b.projects.map((p) => p.commodity)).sort(),
      image_url: null as string | null,
    }));

    if (q.q) {
      const needle = q.q.toLowerCase();
      companies = companies.filter((c) => c.name.toLowerCase().includes(needle));
    }
    if (q.commodity) {
      const c = q.commodity.toLowerCase();
      companies = companies.filter((co) => co.commodities.some((x) => x.toLowerCase() === c));
    }
    if (q.origin_country) {
      const oc = q.origin_country.toLowerCase();
      companies = companies.filter((co) => (co.origin_country ?? '').toLowerCase() === oc);
    }

    return companies.sort(
      (a, b) => b.project_count - a.project_count || a.name.localeCompare(b.name),
    );
  }

  async detail(slug: string) {
    const buckets = await this.buildIndex();
    const bucket = buckets.get(slug.toLowerCase());
    if (!bucket) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Company not found: ${slug}` });
    }

    const projects = [...bucket.projects].sort(
      (a, b) => stageRank(b.status) - stageRank(a.status) || a.name.localeCompare(b.name),
    );

    return {
      name: bucket.ref.name,
      slug: bucket.ref.slug,
      origin_country: bucket.ref.origin_country,
      description: null,
      projects: projects.map((p) => ({
        name: p.name,
        commodity: p.commodity,
        province: p.province,
        status: p.status_label ?? p.status,
        coordinates: { lat: p.latitude, lng: p.longitude },
        resources_summary: p.resources_summary,
      })),
      total_projects: projects.length,
      commodities_involved: distinct(projects.map((p) => p.commodity)).sort(),
      provinces: distinct(projects.map((p) => p.province).filter((x): x is string => !!x)).sort(),
      project_timeline: buildTimeline(projects),
    };
  }

  private async buildIndex(): Promise<Map<string, CompanyBucket>> {
    const projects = await this.projectsService.getAll();
    const buckets = new Map<string, CompanyBucket>();

    for (const p of projects) {
      for (const ref of p.controllers) {
        let bucket = buckets.get(ref.slug);
        if (!bucket) {
          bucket = { ref, projects: [] };
          buckets.set(ref.slug, bucket);
        }
        // Prefer a known origin country if a later reference supplies one.
        if (!bucket.ref.origin_country && ref.origin_country) {
          bucket.ref = { ...bucket.ref, origin_country: ref.origin_country };
        }
        bucket.projects.push(p);
      }
    }

    return buckets;
  }
}

function distinct<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function buildTimeline(projects: NormalizedProject[]): Array<{ stage: string; date: string | null }> {
  const stages = distinct(
    projects.map((p) => p.status_label ?? p.status).filter((s): s is string => !!s),
  );
  return stages
    .sort((a, b) => stageRank(a) - stageRank(b))
    .map((stage) => ({ stage, date: null }));
}
