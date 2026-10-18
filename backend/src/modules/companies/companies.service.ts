import { Injectable, NotFoundException } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MineralProjectsService, NormalizedProject } from '../shared/mineral-projects.service';
import { stageRank } from '../shared/mineral-entities.util';
import { CompanyStocksService, yahooSymbol } from './company-stocks.service';
import { ListCompaniesQueryDto } from './companies.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: MineralProjectsService,
    private readonly stocks: CompanyStocksService,
  ) {}

  async list(q: ListCompaniesQueryDto) {
    const where: Prisma.CompanyWhereInput = {};
    if (q.type && q.type !== 'all') where.type = q.type;
    if (q.country) where.country = { equals: q.country, mode: 'insensitive' };
    if (q.q) where.name = { contains: q.q, mode: 'insensitive' };

    const [companies, portfolios, shares] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          slug: true,
          name: true,
          type: true,
          sector: true,
          country: true,
          logoUrl: true,
          stockTicker: true,
          stockExchange: true,
          isPublic: true,
          projectCountOilGas: true,
          projectCountMining: true,
          commoditySlugs: true,
          provinces: true,
        },
      }),
      this.portfolioMap(),
      this.nationalShareMap(),
    ]);

    let items = companies.map((c) => {
      const portfolio = portfolios.get(c.slug) ?? [];
      const miningCount = portfolio.length || c.projectCountMining;
      const commodities = mergeUnique(c.commoditySlugs, portfolio.map((p) => p.commodity));
      const provinces = mergeUnique(c.provinces, portfolio.map((p) => p.province).filter(isStr));
      return {
        slug: c.slug,
        name: c.name,
        type: c.type,
        sector: c.sector,
        country: c.country,
        logo_url: emptyToNull(c.logoUrl),
        stock_ticker: c.stockTicker,
        stock_exchange: c.stockExchange,
        is_public: c.isPublic,
        project_count_oil_gas: c.projectCountOilGas,
        project_count_mining: miningCount,
        project_count: c.projectCountOilGas + miningCount,
        commodities,
        provinces,
        national_share_boe: shares.get(c.slug) ?? null,
      };
    });

    if (q.commodity) {
      const c = q.commodity.toLowerCase();
      items = items.filter((it) => it.commodities.some((x) => x.toLowerCase() === c));
    }

    return items.sort(
      (a, b) => b.project_count - a.project_count || a.name.localeCompare(b.name),
    );
  }

  async publicCompanies() {
    const companies = await this.prisma.company.findMany({
      where: { isPublic: true, stockTicker: { not: null } },
      orderBy: { name: 'asc' },
    });
    return companies.map((c) => ({
      slug: c.slug,
      name: c.name,
      type: c.type,
      sector: c.sector,
      country: c.country,
      logo_url: emptyToNull(c.logoUrl),
      stock_ticker: c.stockTicker,
      stock_exchange: c.stockExchange,
      is_public: c.isPublic,
      project_count_oil_gas: c.projectCountOilGas,
      project_count_mining: c.projectCountMining,
      project_count: c.projectCountOilGas + c.projectCountMining,
      commodities: c.commoditySlugs,
      provinces: c.provinces,
    }));
  }

  async prices() {
    const companies = await this.prisma.company.findMany({
      where: { isPublic: true, stockTicker: { not: null } },
      orderBy: { name: 'asc' },
    });
    const symbols = companies.map((c) => yahooSymbol(c.stockTicker as string, c.stockExchange));
    const quotes = await this.stocks.quotes(symbols);
    const bySymbol = new Map(quotes.map((qt) => [qt.ticker, qt]));
    return companies.map((c) => {
      const qt = bySymbol.get(yahooSymbol(c.stockTicker as string, c.stockExchange));
      return {
        slug: c.slug,
        name: c.name,
        ticker: c.stockTicker as string,
        price: qt?.price ?? null,
        change_pct: qt?.change_pct ?? null,
        exchange: qt?.exchange ?? c.stockExchange ?? null,
      };
    });
  }

  async priceHistory(ticker: string, range: string, interval: string) {
    // Only tickers from our company table: otherwise this is an open Yahoo
    // proxy whose history cache grows with every symbol someone invents.
    const company = await this.prisma.company.findFirst({
      where: { stockTicker: { equals: ticker, mode: 'insensitive' } },
    });
    if (!company) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Unknown ticker "${ticker}".` });
    }
    const symbol = yahooSymbol(ticker.toUpperCase(), company.stockExchange);

    const data = await this.stocks.history(symbol, range, interval);
    if (!data || data.history.length === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No price history for ticker "${ticker}" (range=${range}, interval=${interval}).`,
      });
    }
    // Echo back the caller's display ticker rather than the suffixed symbol.
    return { ...data, ticker: company.stockTicker };
  }

  async detail(slug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!company) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Company not found: ${slug}` });
    }

    const [portfolios, shares] = await Promise.all([this.portfolioMap(), this.nationalShareMap()]);
    const portfolio = portfolios.get(company.slug) ?? [];
    const sortedProjects = [...portfolio].sort(
      (a, b) => stageRank(b.status) - stageRank(a.status) || a.name.localeCompare(b.name),
    );

    const commodities = mergeUnique(company.commoditySlugs, portfolio.map((p) => p.commodity));
    const provinces = mergeUnique(company.provinces, portfolio.map((p) => p.province).filter(isStr));

    return {
      slug: company.slug,
      name: company.name,
      type: company.type,
      sector: company.sector,
      country: company.country,
      website: company.website,
      logo_url: emptyToNull(company.logoUrl),
      stock_ticker: company.stockTicker,
      stock_exchange: company.stockExchange,
      is_public: company.isPublic,
      commodities_involved: commodities,
      provinces,
      project_count_oil_gas: company.projectCountOilGas,
      project_count_mining: portfolio.length || company.projectCountMining,
      projects: sortedProjects.map((p) => ({
        name: p.name,
        commodity: p.commodity,
        province: p.province,
        status: p.status_label ?? p.status,
        coordinates: { lat: p.latitude, lng: p.longitude },
        resources_summary: p.resources_summary,
      })),
      project_timeline: buildTimeline(sortedProjects),
      oil_gas_production_summary: this.oilGasSummary(company, shares.get(company.slug) ?? null),
      stock: company.isPublic && company.stockTicker
        ? { ...(await this.stocks.quote(yahooSymbol(company.stockTicker, company.stockExchange))), ticker: company.stockTicker }
        : null,
    };
  }

  private oilGasSummary(c: Company, nationalShareBoe: number | null) {
    if (c.type !== 'oil_and_gas' && c.type !== 'both') return null;
    return {
      oil_production_m3: c.oilProductionM3,
      gas_production_m3: c.gasProductionM3,
      boe_total: c.boeTotal,
      well_count: c.projectCountOilGas,
      provinces: c.provinces,
      national_share_boe: nationalShareBoe,
    };
  }

  /**
   * operator_slug → share of national BOE over the trailing (up to) 12 months.
   * Company slugs equal operator slugs for O&G companies. BOE is derived from
   * raw volumes (oil_bbl + gas_mcf/5.8), matching /operators/contribution.
   */
  private async nationalShareMap(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ operator_slug: string; boe: number }>>(`
      SELECT operator_slug, (SUM(oil_bbl) + SUM(gas_mcf) / 5.8)::float AS boe
      FROM agg_monthly_by_operator
      WHERE date_month >= (SELECT MAX(date_month) FROM agg_monthly_by_operator) - INTERVAL '11 months'
      GROUP BY operator_slug
    `);
    const total = rows.reduce((a, r) => a + r.boe, 0);
    const map = new Map<string, number>();
    if (!total) return map;
    for (const r of rows) if (r.boe > 0) map.set(r.operator_slug, r.boe / total);
    return map;
  }

  /** slug → mineral projects controlled by that company. */
  private async portfolioMap(): Promise<Map<string, NormalizedProject[]>> {
    const projects = await this.projectsService.getAll();
    const map = new Map<string, NormalizedProject[]>();
    for (const p of projects) {
      for (const ref of p.controllers) {
        const arr = map.get(ref.slug) ?? [];
        arr.push(p);
        map.set(ref.slug, arr);
      }
    }
    return map;
  }
}

function isStr(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function emptyToNull(v: string | null): string | null {
  return v && v.trim() !== '' ? v : null;
}

function mergeUnique(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

function buildTimeline(projects: NormalizedProject[]): Array<{ stage: string; date: string | null }> {
  const stages = [...new Set(projects.map((p) => p.status_label ?? p.status).filter(isStr))];
  return stages.sort((x, y) => stageRank(x) - stageRank(y)).map((stage) => ({ stage, date: null }));
}
