import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { latestCompleteMonth } from '../../common/complete-month';
import { CAPACIDAD_GAS, OBRAS } from './obras';

const BBL_PER_M3 = 6.2898;

const OLEODUCTOS: Record<string, { name: string; operator: string; route: string }> = {
  oldelval_allen_rosales: {
    name: 'Oldelval Allen – Puerto Rosales (línea original + Duplicar)',
    operator: 'Oldelval',
    route: 'Allen (Río Negro) → Puerto Rosales (Bahía Blanca): refinerías y exportación por el Atlántico',
  },
  otasa: {
    name: 'Oleoducto Trasandino (OTASA)',
    operator: 'Oleoducto Trasandino Argentina S.A.',
    route: 'Puesto Hernández (Neuquén) → Chile (refinería ENAP Biobío)',
  },
  ypf_ph_lujan: {
    name: 'Puesto Hernández – Luján de Cuyo (YPF)',
    operator: 'YPF',
    route: 'Puesto Hernández (Neuquén) → refinería Luján de Cuyo (Mendoza)',
  },
};

const diasDe = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
const r0 = (v: number) => Math.round(v);
const r1 = (v: number) => Math.round(v * 10) / 10;

@Injectable()
export class TransporteService {
  constructor(private readonly prisma: PrismaService) {}

  /* Capacidad contra uso de los ductos que sacan petróleo y gas de la cuenca,
     con la producción de Vaca Muerta al lado y las obras en marcha. El uso es
     el volumen mensual entregado / recibido pasado a diario. La utilización del
     petróleo es contra la capacidad de DISEÑO del último año declarado (el
     Anexo 2A va con un año de atraso: Oldelval todavía no cargó 2025). */
  async evacuacion(months = 24) {
    const [flows, caps, complete] = await Promise.all([
      this.prisma.factPipelineFlow.findMany({ orderBy: { date: 'asc' } }),
      this.prisma.factPipelineCapacity.findMany({ orderBy: { year: 'desc' } }),
      latestCompleteMonth(this.prisma),
    ]);
    const serie = (pipeline: string, perDay: (vol: number) => number) =>
      flows
        .filter((f) => f.pipeline === pipeline)
        .slice(-months)
        .map((f) => ({ date: f.date.toISOString().slice(0, 7), per_day: perDay(f.volume / diasDe(f.date)) }));

    const oil = Object.entries(OLEODUCTOS).map(([pipeline, meta]) => {
      const cap = caps.find((c) => c.pipeline === pipeline);
      const points = serie(pipeline, r0);
      const last = points.at(-1);
      return {
        pipeline,
        ...meta,
        capacity: cap
          ? {
              year: cap.year,
              design_m3d: cap.designM3d,
              max_operating_m3d: cap.maxM3d,
              design_bbl_d: cap.designM3d != null ? r0(cap.designM3d * BBL_PER_M3) : null,
            }
          : null,
        latest: last
          ? {
              date: last.date,
              m3d: last.per_day,
              bbl_d: r0(last.per_day * BBL_PER_M3),
              utilization_pct: cap?.designM3d ? r1((last.per_day / cap.designM3d) * 100) : null,
            }
          : null,
        series_m3d: points,
      };
    });

    const gas = CAPACIDAD_GAS.map((g) => {
      const points = serie(g.pipeline, (milesM3) => r1(milesM3 / 1000)); // miles m3/d → MMm3/d
      const last = points.at(-1);
      return {
        ...g,
        latest: last
          ? { date: last.date, mm3d: last.per_day, utilization_pct: r1((last.per_day / g.capacity_mm3d) * 100) }
          : null,
        series_mm3d: points,
      };
    });

    // Vaca Muerta, último mes completo, para poner los ductos en escala
    const vm = complete
      ? await this.prisma.$queryRaw<{ oil_bbl_d: number; gas_mm3_d: number }[]>`
          SELECT SUM(oil_bbl_d)::float AS oil_bbl_d, SUM(gas_mm3_d)::float AS gas_mm3_d
          FROM agg_monthly_by_operator WHERE vm_combined AND date_month = ${complete}`
      : [];
    return {
      vaca_muerta: complete
        ? { date: complete.toISOString().slice(0, 7), oil_bbl_d: r0(vm[0]?.oil_bbl_d ?? 0), gas_mm3d: r1(vm[0]?.gas_mm3_d ?? 0) }
        : null,
      oil,
      gas,
      projects: OBRAS,
    };
  }
}
