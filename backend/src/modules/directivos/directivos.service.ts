import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getObject, s3ConfigFromEnv } from '../../common/s3';
import { OperatorsService } from '../operators/operators.service';
import type { DirectivoDto, DirectivosResponseDto, VotoEstadoDto } from './directivos.response';
import {
  diaDe,
  hashVotante,
  LIMITE_SEMANAL,
  puntosPorVoto,
  semanaDe,
} from './voto-reglas';

/* ── EL ÍNDICE ────────────────────────────────────────────────────────────
   Estos números son el motivo por el que el cálculo vive acá y no en el
   frontend. La ponderación NO se publica (pedido de producto): el pie de la
   card nombra los tres insumos y nada más. Mientras el cálculo estaba en el
   repo del frontend eso era falso — las constantes estaban a dos archivos de
   la prosa que decía que eran secretas, y bastaba un `view-source` del bundle.

   El otro motivo es que los tres insumos ya viven en esta base y se mueven
   todos los meses. En el frontend estaban congelados en un fixture del
   2026-08, así que el índice envejecía en silencio: los nombres seguían
   ordenados por la foto de agosto pasara lo que pasara con la producción.

   ESCALA 60% · RENDIMIENTO 25% · PRIMA 15%.

   El rendimiento se divide por (pozos + PISO_POZOS) y no por pozos. Sin ese
   piso, GeoPark entraba séptima con el 0,1% del valor porque opera nueve pozos
   —el artefacto del denominador chico— y un índice que pone a una empresa de
   nueve pozos arriba de Pampa pierde toda credibilidad ante la gente que se
   supone que tiene que impresionar. 500 es tres veces la mediana de pozos; con
   ese piso no queda ningún intruso por debajo del 0,5% del valor en el top 10. */
const PESOS = { escala: 0.6, rinde: 0.25, prima: 0.15 } as const;
const PISO_POZOS = 500;

/** 0–100 contra el máximo de la población. */
function normalizar(valor: number, max: number): number {
  return max > 0 ? (valor / max) * 100 : 0;
}

export interface InsumosIndice {
  /** parte del BOE nacional en la ventana (0–1) */
  escala: number;
  /** valor bruto US$ de la ventana */
  valorUsd: number;
  /** pozos activos de la empresa */
  pozos: number;
}

/* La cuenta, separada del acceso a datos para poder correrla sin base — que es
   donde vive el riesgo: es tres normalizaciones contra el máximo de la
   población y una suma ponderada, y equivocarse en cualquiera de las tres da un
   ranking plausible y mal. Ver directivos.service.spec.ts. */
export function calcularIndices<T>(
  filas: (T & InsumosIndice)[],
  totalValorUsd: number,
): (T & { index: number })[] {
  const total = totalValorUsd || 1;
  const crudos = filas.map((f) => ({
    fila: f,
    escala: f.escala,
    rinde: f.valorUsd / (f.pozos + PISO_POZOS),
    prima: f.valorUsd / total,
  }));
  const max = {
    escala: Math.max(...crudos.map((r) => r.escala), 0),
    rinde: Math.max(...crudos.map((r) => r.rinde), 0),
    prima: Math.max(...crudos.map((r) => r.prima), 0),
  };
  return crudos.map((r) => ({
    ...r.fila,
    index:
      Math.round(
        (normalizar(r.escala, max.escala) * PESOS.escala +
          normalizar(r.rinde, max.rinde) * PESOS.rinde +
          normalizar(r.prima, max.prima) * PESOS.prima) *
          10,
      ) / 10,
  }));
}

@Injectable()
export class DirectivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operators: OperatorsService,
  ) {}

  /* El votante es un HMAC de la IP con un secreto del servidor. Sin el secreto
     no se vota: ver el comentario de hashVotante(). */
  private votante(ip: string): string {
    const salt = process.env.VOTE_SALT;
    if (!salt) {
      throw new ServiceUnavailableException(
        'La votación está deshabilitada: falta VOTE_SALT en el servidor.',
      );
    }
    return hashVotante(ip, salt);
  }

  /** Voto neto por empresa, SÓLO de días anteriores a hoy (el corte diario). */
  private async netoElegible(semana: Date): Promise<Map<string, number>> {
    const rows = await this.prisma.executiveVote.groupBy({
      by: ['companySlug'],
      where: { weekStart: semana, voteDay: { lt: diaDe() } },
      _sum: { value: true },
    });
    return new Map(rows.map((r) => [r.companySlug, r._sum.value ?? 0]));
  }

  async list(): Promise<DirectivosResponseDto | null> {
    const semana = semanaDe();
    const [execs, contribution, neto, votos, votantes] = await Promise.all([
      this.prisma.companyExecutive.findMany(),
      this.operators.contribution(),
      this.netoElegible(semana),
      this.prisma.executiveVote.count({ where: { weekStart: semana } }),
      this.prisma.executiveVote.findMany({
        where: { weekStart: semana },
        distinct: ['voterHash'],
        select: { voterHash: true },
      }),
    ]);
    if (!execs.length || !contribution) return null;
    const puntos = puntosPorVoto(neto);

    const companies = await this.prisma.company.findMany({
      where: { slug: { in: execs.map((e) => e.companySlug) } },
      select: { slug: true, name: true, projectCountOilGas: true },
    });
    const companyBySlug = new Map(companies.map((c) => [c.slug, c]));

    const totalGross = contribution.totals.gross_value_usd || 1;
    const contribBySlug = new Map(contribution.operators.map((o) => [o.operator_slug, o]));

    /* Los tres insumos, todos públicos y todos de la EMPRESA:
       · escala   — cuánto produce, como parte del BOE nacional
       · rinde    — cuánto saca por pozo (valor / (pozos + piso))
       · prima    — cuánto vale lo que produce, como parte del valor del país
       Una empresa sin producción en la ventana no tiene índice calculable: va
       con los tres en cero y queda al final, que es lo honesto. Inventarle un
       número para que la lista quede completa es exactamente lo que la página
       promete no hacer. */
    const filas = execs.map((e) => {
      const company = companyBySlug.get(e.companySlug);
      const c = contribBySlug.get(e.companySlug);
      return {
        company_slug: e.companySlug,
        company_name: company?.name ?? e.companySlug,
        name: e.name,
        role: e.role,
        in_role_since: e.inRoleSince,
        bio: e.bio,
        /* `photoUrl` guarda la CLAVE del objeto en el bucket, no una URL: el
           bucket es privado y las fotos salen por esta misma API. Guardar una
           URL pública ataba la fila a un hostname que no existe. */
        photo_url: e.photoUrl ? `/api/v2/directivos/${e.companySlug}/foto` : null,
        escala: c?.share_boe ?? 0,
        valorUsd: c?.gross_value_usd ?? 0,
        pozos: company?.projectCountOilGas ?? 0,
      };
    });

    /* El voto se suma DESPUÉS de normalizar el índice de la empresa, y con su
       propio presupuesto de puntos: así el aporte de la gente es legible
       —«hasta seis puntos»— y no se mezcla con la ponderación de los insumos,
       que es la que no se publica. */
    const directivos = calcularIndices(filas, totalGross)
      .map((d) => ({ ...d, index: Math.round((d.index + (puntos.get(d.company_slug) ?? 0)) * 10) / 10 }))
      .sort((a, b) => b.index - a.index)
      .map(
        ({ escala: _e, valorUsd: _v, pozos: _p, ...d }, i): DirectivoDto => ({
          ...d,
          rank: i + 1,
        }),
      );

    return {
      directivos,
      /* LOS CONTADORES SON EL CONTEO REAL. Reemplazan a VOTANTES_SEMANA = 377 y
         VOTOS_SEMANA = 1284, que estaban escritos a mano en el frontend con una
         advertencia en mayúsculas de que alguien terminaría citándolos en un
         deck. Ahora son un COUNT: si son chicos, son chicos. */
      votacion: {
        week_start: semana.toISOString().slice(0, 10),
        votes: votos,
        voters: votantes.length,
        weekly_limit: LIMITE_SEMANAL,
      },
      source: {
        window_from: contribution.window.from,
        window_to: contribution.window.to,
        /* Los tres insumos POR SU NOMBRE y sin los pesos, que es exactamente
           lo que el pie de la card tiene permitido decir. */
        inputs: ['Escala de producción', 'Rendimiento por pozo', 'Prima de valor'],
      },
    };
  }

  /** Lo que este votante ya usó esta semana. No se cachea: es por IP. */
  async estadoVoto(ip: string): Promise<VotoEstadoDto> {
    const semana = semanaDe();
    const mios = await this.prisma.executiveVote.findMany({
      where: { voterHash: this.votante(ip), weekStart: semana },
      select: { companySlug: true, value: true, voteDay: true },
    });
    const hoy = diaDe().getTime();
    return {
      week_start: semana.toISOString().slice(0, 10),
      weekly_limit: LIMITE_SEMANAL,
      used: mios.length,
      remaining: Math.max(0, LIMITE_SEMANAL - mios.length),
      votes: mios.map((v) => ({
        company_slug: v.companySlug,
        value: v.value,
        /* false = se emitió hoy y entra en el corte de mañana. Es lo que la
           fila necesita para decir «entra mañana» en vez de no mostrar nada. */
        counted: v.voteDay.getTime() < hoy,
      })),
    };
  }

  /* La foto sale por la API y no por el bucket. Garage sólo publica por Host y
     el proxy de este server no tiene ruta ni certificado para
     `<bucket>.web-….sslip.io` —da 503—, así que un bucket público no se podía
     servir igual. Son 32 jpg de 30 KB con un año de cache: pasarlos por Nest no
     se nota, y el bucket se queda privado, que es mejor de todos modos. */
  async foto(slug: string): Promise<{ body: Buffer; contentType: string; etag: string | null }> {
    const exec = await this.prisma.companyExecutive.findUnique({
      where: { companySlug: slug },
      select: { photoUrl: true },
    });
    if (!exec?.photoUrl) throw new NotFoundException(`Sin foto para ${slug}.`);

    const cfg = s3ConfigFromEnv();
    if (!cfg) {
      throw new ServiceUnavailableException('El almacenamiento de imágenes no está configurado.');
    }
    const obj = await getObject(cfg, exec.photoUrl);
    if (!obj) throw new NotFoundException(`Sin foto para ${slug}.`);
    return obj;
  }

  async votar(slug: string, value: 1 | -1, ip: string): Promise<VotoEstadoDto> {
    const voterHash = this.votante(ip);
    const semana = semanaDe();

    const existe = await this.prisma.companyExecutive.findUnique({
      where: { companySlug: slug },
      select: { companySlug: true },
    });
    if (!existe) throw new NotFoundException(`No hay directivo cargado para ${slug}.`);

    const usados = await this.prisma.executiveVote.count({
      where: { voterHash, weekStart: semana },
    });
    if (usados >= LIMITE_SEMANAL) {
      throw new ConflictException(
        `Se acabaron los ${LIMITE_SEMANAL} votos de la semana. Vuelven el lunes.`,
      );
    }

    /* EL VOTO NO SE EDITA: el índice único (votante, empresa, semana) es quien
       lo hace cumplir, no este chequeo. Se atrapa la colisión en vez de mirar
       antes porque dos pedidos simultáneos del mismo votante pasarían los dos
       por un `findFirst` previo. */
    try {
      await this.prisma.executiveVote.create({
        data: { voterHash, companySlug: slug, value, weekStart: semana, voteDay: diaDe() },
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2002') {
        throw new ConflictException('Ya votaste a esta persona esta semana.');
      }
      throw e;
    }

    return this.estadoVoto(ip);
  }
}
