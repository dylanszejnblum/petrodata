import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginated, skipTake } from '../../common/pagination.dto';
import { CommoditySeriesQueryDto, FuelPricesQueryDto, parseDateInput } from './prices.dto';

const COMMODITY_SERIES = ['gold', 'silver', 'copper', 'lithium_etf', 'uranium_etf'];

@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService) {}

  async commoditiesSummary() {
    const rows = await this.prisma.factPrice.findMany({
      where: { source: 'yahoo', series: { in: COMMODITY_SERIES } },
      orderBy: [{ series: 'asc' }, { date: 'desc' }],
    });
    // Pick the latest row per series.
    const latest = new Map<string, typeof rows[number]>();
    for (const r of rows) {
      if (!latest.has(r.series)) latest.set(r.series, r);
    }
    return COMMODITY_SERIES.filter((s) => latest.has(s)).map((s) => {
      const r = latest.get(s)!;
      return {
        commodity: r.series,
        name: r.name,
        unit: r.unit,
        latest: r.value,
        latest_date: monthString(r.date),
      };
    });
  }

  async commoditySeries(commodity: string, q: CommoditySeriesQueryDto) {
    const exists = await this.prisma.factPrice.findFirst({
      where: { source: 'yahoo', series: commodity.toLowerCase() },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Commodity series not found: ${commodity}. Available: ${COMMODITY_SERIES.join(', ')}`,
      });
    }

    const from = parseDateInput(q.from);
    const to = parseDateInput(q.to);
    const where: Prisma.FactPriceWhereInput = {
      source: 'yahoo',
      series: commodity.toLowerCase(),
    };
    if (from || to) {
      where.date = {};
      if (from) (where.date as Prisma.DateTimeFilter).gte = from;
      if (to) (where.date as Prisma.DateTimeFilter).lte = to;
    }
    const rows = await this.prisma.factPrice.findMany({ where, orderBy: { date: 'asc' } });
    return rows.map((r) => ({ date: monthString(r.date), value: r.value }));
  }

  async energySummary() {
    const rows = await this.prisma.factPrice.findMany({
      where: { source: 'eia' },
      orderBy: [{ series: 'asc' }, { date: 'desc' }],
    });
    const latest = new Map<string, typeof rows[number]>();
    for (const r of rows) {
      if (!latest.has(r.series)) latest.set(r.series, r);
    }
    return Array.from(latest.values()).map((r) => ({
      series: r.series,
      name: r.name,
      unit: r.unit,
      latest: r.value,
      latest_date: monthString(r.date),
    }));
  }

  async fuelPrices(q: FuelPricesQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 100;

    const where: Prisma.FactFuelPriceWhereInput = {};
    if (q.provincia) where.provincia = { equals: q.provincia, mode: 'insensitive' };
    if (q.producto) where.producto = { equals: q.producto, mode: 'insensitive' };
    if (q.bandera) where.empresaBandera = { equals: q.bandera, mode: 'insensitive' };
    if (q.from || q.to) {
      where.fechaVigencia = {};
      if (q.from) (where.fechaVigencia as Prisma.DateTimeFilter).gte = parseDateInput(q.from);
      if (q.to) (where.fechaVigencia as Prisma.DateTimeFilter).lte = parseDateInput(q.to);
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.factFuelPrice.count({ where }),
      this.prisma.factFuelPrice.findMany({
        where,
        orderBy: [{ fechaVigencia: 'desc' }, { provincia: 'asc' }],
        ...skipTake(page, limit),
      }),
    ]);

    return paginated(
      rows.map((r) => ({
        provincia: r.provincia,
        localidad: r.localidad,
        producto: r.producto,
        empresa_bandera: r.empresaBandera,
        empresa: r.empresa,
        precio: r.precio,
        fecha_vigencia: r.fechaVigencia.toISOString().slice(0, 10),
        tipo_horario: r.tipoHorario,
        latitude: r.latitude,
        longitude: r.longitude,
      })),
      total,
      page,
      limit,
    );
  }

  async fuelLatest(q: { provincia?: string; producto?: string }) {
    const provinciaFilter = q.provincia
      ? Prisma.sql`AND LOWER(provincia) = LOWER(${q.provincia})`
      : Prisma.empty;
    const productoFilter = q.producto
      ? Prisma.sql`AND LOWER(producto) = LOWER(${q.producto})`
      : Prisma.empty;

    const latest = await this.prisma.$queryRaw<
      Array<{
        provincia: string;
        producto: string;
        fecha: Date;
        precio_promedio: number;
        precio_min: number;
        precio_max: number;
        sample_size: bigint;
      }>
    >`
      WITH max_fecha AS (
        SELECT provincia, producto, MAX(fecha_vigencia) AS fecha
        FROM fact_fuel_price
        WHERE 1=1 ${provinciaFilter} ${productoFilter}
        GROUP BY provincia, producto
      )
      SELECT f.provincia,
             f.producto,
             mf.fecha,
             AVG(f.precio)::float AS precio_promedio,
             MIN(f.precio)::float AS precio_min,
             MAX(f.precio)::float AS precio_max,
             COUNT(*)              AS sample_size
      FROM fact_fuel_price f
      JOIN max_fecha mf
        ON mf.provincia = f.provincia
       AND mf.producto = f.producto
       AND mf.fecha = f.fecha_vigencia
      GROUP BY f.provincia, f.producto, mf.fecha
      ORDER BY f.provincia, f.producto
    `;

    return latest.map((r) => ({
      provincia: r.provincia,
      producto: r.producto,
      precio_promedio: round(r.precio_promedio, 2),
      precio_min: round(r.precio_min, 2),
      precio_max: round(r.precio_max, 2),
      sample_size: Number(r.sample_size),
      fecha_vigencia: r.fecha.toISOString().slice(0, 10),
    }));
  }
}

function monthString(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
