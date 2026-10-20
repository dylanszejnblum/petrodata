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

/* Exportaciones por provincia = las REGISTRADAS por INDEC (OPEX mensual), en
   fact_province_export. Los totales anuales son el último año calendario
   completo (los doce meses cargados); el año en curso va aparte como acumulado.
   «Extranjero y Plataforma Continental» e «Indeterminado» suman al total
   nacional pero no son provincias. */
const NO_PROVINCIA = new Set(['extranjero-y-plataforma-continental', 'indeterminado']);
export const EXPORTS_SOURCE = {
  source: 'INDEC — Origen provincial de las exportaciones (OPEX), serie mensual',
  source_url: 'https://comex.indec.gob.ar/',
  note: 'FOB in US$. INDEC marks 2024 onward as provisional.',
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

  /** Último año con los 12 meses y meses cargados del año siguiente (acumulado). */
  private async exportPeriods() {
    const [{ last }] = await this.prisma.$queryRaw<{ last: Date | null }[]>`SELECT MAX(date) AS last FROM fact_province_export`;
    if (!last) return null;
    const year = last.getUTCMonth() === 11 ? last.getUTCFullYear() : last.getUTCFullYear() - 1;
    return {
      year,
      from: new Date(Date.UTC(year, 0, 1)),
      to: new Date(Date.UTC(year, 11, 1)),
      ytdFrom: new Date(Date.UTC(year + 1, 0, 1)),
      last,
    };
  }

  async exportSummary() {
    const per = await this.exportPeriods();
    if (!per) return { provinces: [], national_total_usd: 0, national_by_sector: {}, period: null, ytd: null, ...EXPORTS_SOURCE };
    const [annual, ytd] = await Promise.all(
      [
        [per.from, per.to],
        [per.ytdFrom, per.last],
      ].map(([from, to]) =>
        this.prisma.factProvinceExport.groupBy({
          by: ['provinceSlug', 'provinceName', 'rubro'],
          where: { date: { gte: from, lte: to } },
          _sum: { usd: true },
        }),
      ),
    );
    const provinces = new Map<string, { slug: string; name: string; total: number; by_sector: Record<string, number> }>();
    const nationalBySector: Record<string, number> = {};
    let nationalTotal = 0;
    for (const r of annual) {
      const usd = r._sum.usd ?? 0;
      nationalBySector[r.rubro] = (nationalBySector[r.rubro] ?? 0) + usd;
      nationalTotal += usd;
      if (NO_PROVINCIA.has(r.provinceSlug)) continue;
      const p = provinces.get(r.provinceSlug) ?? { slug: r.provinceSlug, name: r.provinceName, total: 0, by_sector: {} };
      p.total += usd;
      p.by_sector[r.rubro] = (p.by_sector[r.rubro] ?? 0) + usd;
      provinces.set(r.provinceSlug, p);
    }
    const ytdBySlug = new Map<string, number>();
    for (const r of ytd) ytdBySlug.set(r.provinceSlug, (ytdBySlug.get(r.provinceSlug) ?? 0) + (r._sum.usd ?? 0));
    const ymd = (d: Date) => d.toISOString().slice(0, 7);
    return {
      period: { year: per.year, from: ymd(per.from), to: ymd(per.to) },
      provinces: [...provinces.values()]
        .map((p) => ({
          slug: p.slug,
          name: p.name,
          total_export_usd: p.total,
          by_sector: p.by_sector,
          ytd_export_usd: ytdBySlug.get(p.slug) ?? 0,
        }))
        .sort((a, b) => b.total_export_usd - a.total_export_usd),
      national_total_usd: nationalTotal,
      national_by_sector: nationalBySector,
      ytd: per.last >= per.ytdFrom ? { from: ymd(per.ytdFrom), to: ymd(per.last), national_total_usd: [...ytdBySlug.values()].reduce((a, b) => a + b, 0) } : null,
      ...EXPORTS_SOURCE,
    };
  }

  private async exportsForSlug(slug: string) {
    const per = await this.exportPeriods();
    if (!per) return [];
    const rows = await this.prisma.factProvinceExport.groupBy({
      by: ['rubro'],
      where: { provinceSlug: slug, date: { gte: per.from, lte: per.to } },
      _sum: { usd: true },
    });
    return rows
      .map((r) => ({ sector: r.rubro, product: r.rubro, value_annual_usd: r._sum.usd ?? 0, year: per.year }))
      .sort((a, b) => b.value_annual_usd - a.value_annual_usd);
  }

  /** Serie mensual de exportaciones de una provincia, total y por rubro. */
  async exportsMonthly(slug: string, from?: string) {
    const registry = await this.buildRegistry();
    if (!registry.has(slug.toLowerCase())) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Province not found: ${slug}` });
    }
    const rows = await this.prisma.factProvinceExport.findMany({
      where: {
        provinceSlug: slug.toLowerCase(),
        ...(from ? { date: { gte: new Date(`${from.slice(0, 7)}-01T00:00:00Z`) } } : {}),
      },
      orderBy: { date: 'asc' },
    });
    const byMonth = new Map<string, { date: string; total_usd: number; by_sector: Record<string, number> }>();
    for (const r of rows) {
      const date = r.date.toISOString().slice(0, 7);
      const m = byMonth.get(date) ?? { date, total_usd: 0, by_sector: {} };
      m.total_usd += r.usd;
      m.by_sector[r.rubro] = r.usd;
      byMonth.set(date, m);
    }
    return [...byMonth.values()];
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
