import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, MiningProject } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginated, skipTake } from '../../common/pagination.dto';
import {
  CommodityProjectsQueryDto,
  ListProjectsQueryDto,
  MapQueryDto,
  ProjectSortField,
} from './minerals.dto';
import { PricesService } from './prices.service';

interface ResourceEntry {
  category?: string;
  values?: Record<string, unknown>;
}

const SORT_FIELD_MAP: Record<ProjectSortField, keyof Prisma.MiningProjectOrderByWithRelationInput> = {
  project_name: 'projectName',
  primary_commodity: 'primaryCommodity',
  status: 'status',
  province: 'province',
};

@Injectable()
export class MineralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prices: PricesService,
  ) {}

  async list(q: ListProjectsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const sort: ProjectSortField = q.sort ?? 'project_name';
    const order = q.order ?? 'asc';

    const where: Prisma.MiningProjectWhereInput = {};
    if (q.commodity) where.primaryCommodity = { equals: q.commodity, mode: 'insensitive' };
    if (q.status) where.status = { equals: q.status, mode: 'insensitive' };
    if (q.province) where.province = { equals: q.province, mode: 'insensitive' };
    if (q.q) {
      where.OR = [
        { projectName: { contains: q.q, mode: 'insensitive' } },
        { operator: { contains: q.q, mode: 'insensitive' } },
        { province: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.miningProject.count({ where }),
      this.prisma.miningProject.findMany({
        where,
        orderBy: { [SORT_FIELD_MAP[sort]]: order },
        ...skipTake(page, limit),
      }),
    ]);

    return paginated(rows.map((r) => this.shapeListItem(r)), total, page, limit);
  }

  async detail(name: string) {
    const project = await this.prisma.miningProject.findUnique({
      where: { projectName: name },
    });
    if (!project) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Project not found: ${name}` });
    }

    const [commodityPrices, stock] = await Promise.all([
      this.prices.commoditiesForProject(project.primaryCommodity, project.byProducts),
      this.prices.stockForOperator(project.operator, project.ownerController),
    ]);

    return {
      ...this.shapeDetail(project),
      commodity_prices: commodityPrices,
      stock,
    };
  }

  async commodities() {
    const rows = await this.prisma.miningProject.findMany({
      select: {
        primaryCommodity: true,
        status: true,
        resources: true,
        reserves: true,
      },
    });

    const buckets = new Map<
      string,
      {
        projects: number;
        producing: number;
        resourceTotals: Record<string, number>;
        reserveTotals: Record<string, number>;
      }
    >();

    for (const r of rows) {
      const key = r.primaryCommodity;
      let b = buckets.get(key);
      if (!b) {
        b = { projects: 0, producing: 0, resourceTotals: {}, reserveTotals: {} };
        buckets.set(key, b);
      }
      b.projects++;
      if (isProducing(r.status)) b.producing++;
      accumulateTotals(b.resourceTotals, r.resources);
      accumulateTotals(b.reserveTotals, r.reserves);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([commodity, b]) => ({
        commodity,
        projects: b.projects,
        producing_projects: b.producing,
        resource_totals: b.resourceTotals,
        reserve_totals: b.reserveTotals,
      }));
  }

  async commodityProjects(commodity: string, q: CommodityProjectsQueryDto) {
    const where: Prisma.MiningProjectWhereInput = {
      primaryCommodity: { equals: commodity, mode: 'insensitive' },
    };
    if (q.status) where.status = { equals: q.status, mode: 'insensitive' };
    if (q.province) where.province = { equals: q.province, mode: 'insensitive' };

    const rows = await this.prisma.miningProject.findMany({
      where,
      orderBy: { projectName: 'asc' },
    });

    const filtered = q.min_resources
      ? rows.filter((r) => countResourceEntries(r.resources) > 0)
      : rows;

    return {
      commodity,
      count: filtered.length,
      projects: filtered.map((r) => ({
        ...this.shapeListItem(r),
        resources: r.resources ?? null,
        reserves: r.reserves ?? null,
      })),
    };
  }

  async map(q: MapQueryDto) {
    const where: Prisma.MiningProjectWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
    };
    if (q.commodity) where.primaryCommodity = { equals: q.commodity, mode: 'insensitive' };
    if (q.status) where.status = { equals: q.status, mode: 'insensitive' };
    if (q.province) where.province = { equals: q.province, mode: 'insensitive' };

    const rows = await this.prisma.miningProject.findMany({
      where,
      select: {
        projectName: true,
        primaryCommodity: true,
        status: true,
        province: true,
        operator: true,
        latitude: true,
        longitude: true,
      },
    });

    return {
      __raw: true,
      type: 'FeatureCollection',
      features: rows.map((r) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.longitude as number, r.latitude as number],
        },
        properties: {
          project_name: r.projectName,
          commodity: r.primaryCommodity,
          status: r.status,
          province: r.province,
          operator: r.operator,
        },
      })),
    };
  }

  async summary() {
    const rows = await this.prisma.miningProject.findMany({
      select: {
        primaryCommodity: true,
        status: true,
        province: true,
        sourcePipeline: true,
      },
    });

    const by_commodity: Record<string, number> = {};
    const by_status: Record<string, number> = {};
    const by_province: Record<string, number> = {};
    const sources = new Set<string>();

    for (const r of rows) {
      by_commodity[r.primaryCommodity] = (by_commodity[r.primaryCommodity] ?? 0) + 1;
      if (r.status) by_status[r.status] = (by_status[r.status] ?? 0) + 1;
      if (r.province) by_province[r.province] = (by_province[r.province] ?? 0) + 1;
      if (r.sourcePipeline) sources.add(r.sourcePipeline);
    }

    return {
      total_projects: rows.length,
      by_commodity,
      by_status,
      by_province,
      data_sources: Array.from(sources).sort(),
    };
  }

  private shapeListItem(r: MiningProject) {
    return {
      project_name: r.projectName,
      primary_commodity: r.primaryCommodity,
      by_products: r.byProducts,
      status: r.status,
      deposit_type: r.depositType,
      province: r.province,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
      operator: r.operator,
      commodity_highlights: buildCommodityHighlights(r.resources),
    };
  }

  private shapeDetail(r: MiningProject) {
    return {
      ...this.shapeListItem(r),
      by_products_list: r.byProducts
        ? r.byProducts.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      owner_controller: r.ownerController,
      area_ha: r.areaHa,
      technical_economic: {
        since_production: r.sinceProduction,
        estimated_lom_years: r.estimatedLomYears,
        productive_capacity: r.productiveCapacity,
        estimated_annual_production: r.estimatedAnnualProd,
        capex: r.capex,
        mining_method: r.miningMethod,
        product: r.product,
      },
      resources: r.resources ?? null,
      reserves: r.reserves ?? null,
      resources_year: r.resourcesYear,
      geology: r.geology ?? null,
      source_pipeline: r.sourcePipeline,
      ingested_at: r.ingestedAt.toISOString(),
    };
  }
}

function isProducing(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('operation') || s.includes('production') || s.includes('producing');
}

function asEntryList(raw: unknown): ResourceEntry[] {
  if (Array.isArray(raw)) return raw as ResourceEntry[];
  if (raw && typeof raw === 'object') {
    // Object form: { Measured: [...], Indicated: [...] }
    const out: ResourceEntry[] = [];
    for (const [category, values] of Object.entries(raw as Record<string, unknown>)) {
      if (Array.isArray(values)) {
        for (const v of values) {
          if (v && typeof v === 'object') {
            out.push({ category, values: v as Record<string, unknown> });
          }
        }
      } else if (values && typeof values === 'object') {
        out.push({ category, values: values as Record<string, unknown> });
      }
    }
    return out;
  }
  return [];
}

function countResourceEntries(raw: unknown): number {
  return asEntryList(raw).length;
}

function categorySlug(category: string | undefined): string {
  if (!category) return 'unknown';
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function accumulateTotals(target: Record<string, number>, raw: unknown): void {
  for (const entry of asEntryList(raw)) {
    const cat = categorySlug(entry.category);
    const values = entry.values ?? {};
    for (const [unit, v] of Object.entries(values)) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      const key = `${cat}_${unit}`;
      target[key] = (target[key] ?? 0) + n;
    }
  }
}

function buildCommodityHighlights(raw: unknown): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const entry of asEntryList(raw)) {
    const cat = categorySlug(entry.category);
    const values = entry.values ?? {};
    for (const [unit, v] of Object.entries(values)) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      const commodity = commodityFromUnitKey(unit);
      if (!commodity) continue;
      const bucket = (out[commodity] ??= {});
      const key = `${cat}_${shortUnit(unit)}`;
      if (bucket[key] === undefined) bucket[key] = n;
    }
  }
  return out;
}

const COMMODITY_PREFIXES: Array<{ match: RegExp; commodity: string }> = [
  { match: /^Ag(_|$)/, commodity: 'Silver' },
  { match: /^Au(_|$)/, commodity: 'Gold' },
  { match: /^Cu(_|$)/, commodity: 'Copper' },
  { match: /^Pb(_|$)/, commodity: 'Lead' },
  { match: /^Zn(_|$)/, commodity: 'Zinc' },
  { match: /^Mo(_|$)/, commodity: 'Molybdenum' },
  { match: /^Sn(_|$)/, commodity: 'Tin' },
  { match: /^Ni(_|$)/, commodity: 'Nickel' },
  { match: /^Co(_|$)/, commodity: 'Cobalt' },
  { match: /^U3O8(_|$)/, commodity: 'Uranium' },
  { match: /^Uranium(_|$)/, commodity: 'Uranium' },
  { match: /^Li(_|$)/, commodity: 'Lithium' },
  { match: /^LCE(_|$)/, commodity: 'Lithium' },
  { match: /^pct_Pb$/, commodity: 'Lead' },
  { match: /^pct_Zn$/, commodity: 'Zinc' },
  { match: /^pct_Cu$/, commodity: 'Copper' },
  { match: /^pct_Mo$/, commodity: 'Molybdenum' },
];

function commodityFromUnitKey(key: string): string | null {
  for (const { match, commodity } of COMMODITY_PREFIXES) {
    if (match.test(key)) return commodity;
  }
  return null;
}

function shortUnit(key: string): string {
  // Strip leading commodity symbol so "Ag_kOz" → "kOz", "pct_Pb" → "pct".
  if (key.startsWith('pct_')) return 'pct';
  const idx = key.indexOf('_');
  return idx >= 0 ? key.slice(idx + 1) : key;
}
