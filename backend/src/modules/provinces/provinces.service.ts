import { Injectable, NotFoundException } from '@nestjs/common';
import { isPreliminary, latestCompleteMonth } from '../../common/complete-month';
import { PrismaService } from '../../prisma/prisma.service';
import { MineralProjectsService, NormalizedProject } from '../shared/mineral-projects.service';
import { provinceCode, slugify } from '../shared/mineral-entities.util';
import { ListProvincesQueryDto, ProvinceProductionQueryDto, parseMonth } from './provinces.dto';

interface ProvinceRegistryEntry {
  slug: string;
  name: string; // canonical display name
  ogName: string | null; // exact province string used in the O&G fact tables
  ogWells: number;
  mining: NormalizedProject[];
}

/* Las "exportaciones por provincia" NO son exportaciones registradas: las armó
   pipeline_company_enrichment.py (2026-05-31) sobre la producción, con precio y
   porcentaje exportado fijos, y el total nacional está escrito a mano. Hasta
   reemplazarlas por una fuente real (INDEC/SIACAM), el meta lo dice para que
   nadie las publique como dato. */
export const EXPORTS_ESTIMATE = {
  kind: 'estimate',
  method:
    'Not recorded exports. Oil: provincial production × US$65/bbl × 85% assumed exported. ' +
    'Gas: production × US$3.5/mcf × 50% assumed exported. National totals are hand-entered round figures.',
  computed_at: '2026-05-31',
  period: 'Production window not recorded; values are a static snapshot, not updated monthly.',
  publishable: false,
} as const;
@Injectable()
export class ProvincesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: MineralProjectsService,
  ) {}

  async list(q: ListProvincesQueryDto) {
    const registry = await this.buildRegistry();

    let provinces = [...registry.values()].map((p) => {
      const commodities = uniqueSorted(p.mining.map((m) => m.commodity));
      return {
        slug: p.slug,
        name: p.name,
        iso_code: provinceCode(p.name),
        oil_gas_wells: p.ogWells,
        mining_projects: p.mining.length,
        combined_project_count: p.ogWells + p.mining.length,
        commodities,
        has_oil_gas: p.ogWells > 0,
        has_mining: p.mining.length > 0,
      };
    });

    if (q.commodity) {
      const c = q.commodity.toLowerCase();
      provinces = provinces.filter((p) => p.commodities.some((x) => x.toLowerCase() === c));
    }

    return provinces.sort((a, b) => b.combined_project_count - a.combined_project_count || a.name.localeCompare(b.name));
  }

  async detail(slug: string) {
    const registry = await this.buildRegistry();
    const entry = registry.get(slug.toLowerCase());
    if (!entry) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Province not found: ${slug}` });
    }

    const [oilGas, exports] = await Promise.all([
      entry.ogName ? this.oilGasSummary(entry.ogName) : Promise.resolve(null),
      this.exportsForSlug(entry.slug),
    ]);

    const mining = entry.mining.length ? this.miningBlock(entry.mining) : null;
    const combined = (oilGas?.active_wells ?? entry.ogWells) + entry.mining.length;

    return {
      name: entry.name,
      slug: entry.slug,
      iso_code: provinceCode(entry.name),
      oil_gas: oilGas,
      mining,
      exports,
      combined_project_count: combined,
    };
  }

  async production(slug: string, q: ProvinceProductionQueryDto) {
    const registry = await this.buildRegistry();
    const entry = registry.get(slug.toLowerCase());
    if (!entry) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Province not found: ${slug}` });
    }
    if (!entry.ogName) return [];

    const from = parseMonth(q.from);
    const to = parseMonth(q.to);
    const params: unknown[] = [entry.ogName];
    let dateClause = '';
    if (from) {
      params.push(from);
      dateClause += ` AND date_month >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateClause += ` AND date_month <= $${params.length}`;
    }

    const complete = await latestCompleteMonth(this.prisma);
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT date_month,
              SUM(oil_bbl_d)::float        AS oil_bbl_d,
              SUM(gas_mmcf_d)::float       AS gas_mmcf_d,
              SUM(oil_m3)::float           AS oil_m3,
              SUM(gas_thousand_m3)::float  AS gas_thousand_m3,
              SUM(boe)::float              AS boe,
              COUNT(DISTINCT well_id) FILTER (WHERE boe > 0)::int AS active_wells
       FROM fact_production_monthly
       WHERE province = $1${dateClause}
       GROUP BY date_month
       ORDER BY date_month ASC`,
      ...params,
    );

    return rows.map((r) => ({
      date_month: monthStr(r.date_month),
      oil_bbl_d: num(r.oil_bbl_d),
      gas_mmcf_d: num(r.gas_mmcf_d),
      oil_m3: num(r.oil_m3),
      gas_thousand_m3: num(r.gas_thousand_m3),
      boe: num(r.boe),
      active_wells: num(r.active_wells),
      preliminary: isPreliminary(r.date_month as Date, complete),
    }));
  }

  async exports(slug: string) {
    const registry = await this.buildRegistry();
    if (!registry.has(slug.toLowerCase())) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Province not found: ${slug}` });
    }
    return this.exportsForSlug(slug.toLowerCase());
  }

  async exportSummary() {
    const rows = await this.prisma.provinceExport.findMany();
    const provinces = new Map<string, { slug: string; name: string; total: number; by_sector: Record<string, number> }>();
    const nationalBySector: Record<string, number> = {};
    let nationalTotal = 0;

    for (const r of rows) {
      if (r.slug === 'nacional') {
        nationalBySector[r.sector] = (nationalBySector[r.sector] ?? 0) + r.valueAnnualUsd;
        nationalTotal += r.valueAnnualUsd;
        continue;
      }
      let p = provinces.get(r.slug);
      if (!p) {
        p = { slug: r.slug, name: r.provinceName, total: 0, by_sector: {} };
        provinces.set(r.slug, p);
      }
      p.total += r.valueAnnualUsd;
      p.by_sector[r.sector] = (p.by_sector[r.sector] ?? 0) + r.valueAnnualUsd;
    }

    return {
      provinces: [...provinces.values()]
        .map((p) => ({ slug: p.slug, name: p.name, total_export_usd: p.total, by_sector: p.by_sector }))
        .sort((a, b) => b.total_export_usd - a.total_export_usd),
      national_total_usd: nationalTotal,
      national_by_sector: nationalBySector,
      estimate: EXPORTS_ESTIMATE,
    };
  }

  private async exportsForSlug(slug: string) {
    const rows = await this.prisma.provinceExport.findMany({
      where: { slug },
      orderBy: { valueAnnualUsd: 'desc' },
    });
    return rows.map((r) => ({ sector: r.sector, product: r.productName, value_annual_usd: r.valueAnnualUsd }));
  }

  private miningBlock(projects: NormalizedProject[]) {
    return {
      project_count: projects.length,
      commodities: uniqueSorted(projects.map((p) => p.commodity)),
      controllers: uniqueSorted(projects.flatMap((p) => p.controllers.map((c) => c.name))),
      projects: projects.map((p) => ({
        name: p.name,
        commodity: p.commodity,
        status: p.status_label ?? p.status,
        controllers: p.controllers,
        coordinates: { lat: p.latitude, lng: p.longitude },
        resources_summary: p.resources_summary,
      })),
    };
  }

  private async oilGasSummary(ogName: string) {
    const latest = await this.prisma.$queryRawUnsafe<Array<{ m: Date | null }>>(
      `SELECT MAX(date_month) AS m FROM fact_production_monthly WHERE province = $1`,
      ogName,
    );
    const month = latest[0]?.m;
    if (!month) return null;

    const [agg] = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT SUM(oil_bbl_d)::float  AS oil_bbl_d,
              SUM(gas_mmcf_d)::float AS gas_mmcf_d,
              SUM(boe)::float        AS boe,
              SUM(CASE WHEN vm_combined THEN boe ELSE 0 END)::float AS vm_boe,
              COUNT(DISTINCT well_id) FILTER (WHERE boe > 0)::int    AS active_wells
       FROM fact_production_monthly
       WHERE province = $1 AND date_month = $2`,
      ogName,
      month,
    );

    const topRows = await this.prisma.$queryRawUnsafe<Array<{ operator_slug: string; boe: number }>>(
      `SELECT operator_slug, SUM(boe)::float AS boe
       FROM fact_production_monthly
       WHERE province = $1 AND date_month = $2
       GROUP BY operator_slug
       ORDER BY boe DESC
       LIMIT 5`,
      ogName,
      month,
    );
    const names = await this.prisma.dimOperator.findMany({
      where: { operatorSlug: { in: topRows.map((r) => r.operator_slug) } },
      select: { operatorSlug: true, operatorName: true },
    });
    const nameMap = new Map(names.map((n) => [n.operatorSlug, n.operatorName]));

    const boe = num(agg.boe);
    return {
      production_oil_bbl_d: round2(num(agg.oil_bbl_d)),
      production_gas_mmcf_d: round2(num(agg.gas_mmcf_d)),
      active_wells: num(agg.active_wells),
      vm_pct: boe ? round4(num(agg.vm_boe) / boe) : 0,
      top_operators: topRows.map((r) => ({
        operator_slug: r.operator_slug,
        operator_name: nameMap.get(r.operator_slug) ?? r.operator_slug,
        boe: round2(num(r.boe)),
      })),
      latest_month: monthStr(month),
    };
  }

  /** Build the unified province registry: O&G provinces ∪ mineral provinces. */
  private async buildRegistry(): Promise<Map<string, ProvinceRegistryEntry>> {
    const [ogRows, projects] = await Promise.all([
      this.ogProvinceWells(),
      this.projectsService.getAll(),
    ]);

    const registry = new Map<string, ProvinceRegistryEntry>();

    for (const og of ogRows) {
      const slug = slugify(og.province);
      registry.set(slug, { slug, name: og.province, ogName: og.province, ogWells: og.wells, mining: [] });
    }

    for (const p of projects) {
      if (!p.province) continue;
      const slug = slugify(p.province);
      const entry = registry.get(slug);
      if (entry) {
        entry.mining.push(p);
      } else {
        registry.set(slug, { slug, name: p.province, ogName: null, ogWells: 0, mining: [p] });
      }
    }

    return registry;
  }

  private async ogProvinceWells(): Promise<Array<{ province: string; wells: number }>> {
    const latest = await this.prisma.$queryRawUnsafe<Array<{ m: Date | null }>>(
      `SELECT MAX(date_month) AS m FROM fact_production_monthly`,
    );
    const month = latest[0]?.m;
    if (!month) return [];
    const rows = await this.prisma.$queryRawUnsafe<Array<{ province: string; wells: number }>>(
      `SELECT province, COUNT(DISTINCT well_id) FILTER (WHERE boe > 0)::int AS wells
       FROM fact_production_monthly
       WHERE date_month = $1
       GROUP BY province`,
      month,
    );
    return rows.map((r) => ({ province: r.province, wells: num(r.wells) }));
  }
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function monthStr(d: Date | string | null | unknown): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d as string);
  return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function uniqueSorted(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))].sort();
}
