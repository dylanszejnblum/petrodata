import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { CompanyExecutive } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getObject, s3ConfigFromEnv } from '../../common/s3';
import { OperatorsService } from '../operators/operators.service';
import { cached, TTL } from '../../common/cache';
import type {
  DirectivoDto,
  DirectivoMovimientoDto,
  DirectivosResponseDto,
  MovimientosDto,
  PeriodoMovimientosDto,
  VotoEstadoDto,
} from './directivos.response';
import {
  diaDe,
  hashVotante,
  LIMITE_SEMANAL,
  puntosPorVoto,
  semanaDe,
  topeSemanalIp,
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

type Contribucion = NonNullable<Awaited<ReturnType<OperatorsService['contribution']>>>;
type EmpresaRanking = { slug: string; name: string; projectCountOilGas: number | null };

/* La fila de cada directivo con los insumos de su empresa. `pozos` es el conteo
   de HOY también cuando se recalcula un corte viejo: la base no guarda la
   historia de pozos por empresa, y el que pesa de verdad es la escala. */
function filasDe(
  execs: CompanyExecutive[],
  companyBySlug: Map<string, EmpresaRanking>,
  contribution: Contribucion,
) {
  const contribBySlug = new Map(contribution.operators.map((o) => [o.operator_slug, o]));
  /* Los tres insumos, todos públicos y todos de la EMPRESA:
     · escala   — cuánto produce, como parte del BOE nacional
     · rinde    — cuánto saca por pozo (valor / (pozos + piso))
     · prima    — cuánto vale lo que produce, como parte del valor del país
     Una empresa sin producción en la ventana no tiene índice calculable: va
     con los tres en cero y queda al final, que es lo honesto. Inventarle un
     número para que la lista quede completa es exactamente lo que la página
     promete no hacer. */
  return execs.map((e) => {
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
      photo_url_2x: e.photoUrl ? `/api/v2/directivos/${e.companySlug}/foto?size=2x` : null,
      escala: c?.share_boe ?? 0,
      valorUsd: c?.gross_value_usd ?? 0,
      pozos: company?.projectCountOilGas ?? 0,
    };
  });
}

/* EL DESEMPATE ES EXPLÍCITO y no el que regala el sort: veinticinco de las
   cuarenta y ocho empatan —dieciséis en el mismo valor— y dejarlo librado a
   la implementación es dejar librado el puesto de media lista. Se cae al
   índice sin votos y después al slug, que es estable entre pedidos: sin eso
   dos llamadas seguidas podían devolver órdenes distintos para los mismos
   datos. */
function ordenar<T extends { index: number; company_slug: string }>(
  base: T[],
  puntosDelCorte: Map<string, number>,
) {
  return base
    .map((d) => ({ ...d, conVoto: d.index + (puntosDelCorte.get(d.company_slug) ?? 0) }))
    .sort(
      (a, b) =>
        b.conVoto - a.conVoto || b.index - a.index || a.company_slug.localeCompare(b.company_slug),
    );
}

/** El índice como se publica: recortado a 0–100, un decimal. */
const indicePublicado = (conVoto: number) => Math.round(Math.min(100, Math.max(0, conVoto)) * 10) / 10;

/** Cuánto mira hacia atrás cada período de `movimientos()`. */
export const PERIODOS = {
  day: (d: Date) => d.setUTCDate(d.getUTCDate() - 1),
  week: (d: Date) => d.setUTCDate(d.getUTCDate() - 7),
  month: (d: Date) => d.setUTCMonth(d.getUTCMonth() - 1),
  year: (d: Date) => d.setUTCFullYear(d.getUTCFullYear() - 1),
} as const;
export type Periodo = keyof typeof PERIODOS;

/* TURNSTILE, opcional. Con TURNSTILE_SECRET seteada cada voto trae un token del
   widget de Cloudflare y se verifica acá; sin ella el voto sigue como antes.
   No cambia que una IP no es una persona, pero deja afuera al script que
   recorre la lista votando desde un pool de IPs. */
async function verificarTurnstile(token: string | undefined, ip: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return;
  if (!token) throw new ForbiddenException('Falta la verificación anti-bot.');
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!r?.ok) throw new ServiceUnavailableException('No se pudo verificar el voto, probá de nuevo.');
  const { success } = (await r.json()) as { success?: boolean };
  if (!success) throw new ForbiddenException('La verificación anti-bot falló.');
}

@Injectable()
export class DirectivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operators: OperatorsService,
  ) {}

  /* El votante es un HMAC del id de navegador (`x-votante`) con un secreto del
     servidor; sin id cae a la IP, que es como votaban los clientes viejos. La
     IP se guarda aparte, también como HMAC, sólo para el techo semanal por IP.
     Sin el secreto no se vota: ver el comentario de hashVotante(). */
  private votante(ip: string, navegador: string | null): { voterHash: string; ipHash: string } {
    const salt = process.env.VOTE_SALT;
    if (!salt) {
      throw new ServiceUnavailableException(
        'La votación está deshabilitada: falta VOTE_SALT en el servidor.',
      );
    }
    const ipHash = hashVotante(ip, salt);
    // el prefijo separa los dos espacios: un id de navegador nunca choca con una IP
    return { voterHash: navegador ? hashVotante(`b:${navegador}`, salt) : ipHash, ipHash };
  }

  /* ponytail: caché de una instancia, 30 s. El orden sólo cambia con el corte
     diario; lo que se mueve en vivo son los contadores, y medio minuto de
     atraso ahí no se nota. Sin esto, cada pedido eran siete consultas. */
  private cacheLista: { hasta: number; valor: Promise<DirectivosResponseDto | null> } | null = null

  list(): Promise<DirectivosResponseDto | null> {
    if (this.cacheLista && this.cacheLista.hasta > Date.now()) return this.cacheLista.valor;
    const valor = this.calcularLista();
    this.cacheLista = { hasta: Date.now() + 30_000, valor };
    valor.catch(() => (this.cacheLista = null));
    return valor;
  }

  /** El orden al corte de `dia`: producción conocida hasta ese día y votos de su
      semana emitidos antes de ese día — la misma regla que la lista pública. */
  private async corte(dia: Date, execs: CompanyExecutive[], companyBySlug: Map<string, EmpresaRanking>) {
    const [contribution, neto] = await Promise.all([
      this.operators.contribution(dia),
      this.netoHasta(semanaDe(dia), dia),
    ]);
    if (!contribution) return null;
    const base = calcularIndices(filasDe(execs, companyBySlug, contribution), contribution.totals.gross_value_usd);
    return ordenar(base, puntosPorVoto(neto)).map((d, i) => ({ ...d, rank: i + 1, index: indicePublicado(d.conVoto) }));
  }

  /* EL HISTORIAL NO SE GUARDA, SE RECALCULA. Cada corte viejo se rearma con la
     ventana de producción que terminaba ese día y los votos que había entonces,
     así que el año entero existe desde el primer pedido y no hace falta un cron
     de fotos diarias. Dos consecuencias para quien lo lee:
     · el día y la semana se mueven casi sólo por votos —la producción es
       mensual— y el lunes los votos vuelven a cero, así que el `day` del lunes
       suele mostrar el efecto de ese reinicio;
     · un mes de producción cuenta desde el día 1 de ese mes, aunque la
       Secretaría lo publique semanas después.
     ponytail: cinco ventanas de doce meses por pedido, cacheadas cinco minutos. */
  async movimientos(limit = 5): Promise<MovimientosDto | null> {
    const r = await cached(`directivos:movimientos:${diaDe().toISOString()}`, TTL.SHORT, () =>
      this.calcularMovimientos(),
    );
    if (!r) return null;
    const recorte = (p: PeriodoMovimientosDto | null) =>
      p && { ...p, risers: p.risers.slice(0, limit), fallers: p.fallers.slice(0, limit) };
    return {
      ...r,
      top: r.top.slice(0, limit),
      periods: {
        day: recorte(r.periods.day),
        week: recorte(r.periods.week),
        month: recorte(r.periods.month),
        year: recorte(r.periods.year),
      },
    };
  }

  private async calcularMovimientos(): Promise<MovimientosDto | null> {
    const hoy = diaDe();
    const execs = await this.prisma.companyExecutive.findMany();
    if (!execs.length) return null;
    const companies = await this.prisma.company.findMany({
      where: { slug: { in: execs.map((e) => e.companySlug) } },
      select: { slug: true, name: true, projectCountOilGas: true },
    });
    const companyBySlug = new Map(companies.map((c) => [c.slug, c]));

    const periodos = Object.keys(PERIODOS) as Periodo[];
    const desde = periodos.map((p) => {
      const d = new Date(hoy);
      PERIODOS[p](d);
      return d;
    });
    const [actual, ...previos] = await Promise.all(
      [hoy, ...desde].map((d) => this.corte(d, execs, companyBySlug)),
    );
    if (!actual) return null;

    const ficha = (d: (typeof actual)[number]): DirectivoMovimientoDto => ({
      company_slug: d.company_slug,
      company_name: d.company_name,
      name: d.name,
      role: d.role,
      photo_url: d.photo_url,
      photo_url_2x: d.photo_url_2x,
      rank: d.rank,
      index: d.index,
      rank_before: null,
      rank_change: null,
      index_before: null,
      index_change: null,
    });

    const cambio = (i: number): PeriodoMovimientosDto | null => {
      const antes = previos[i];
      if (!antes) return null;
      const porSlug = new Map(antes.map((d) => [d.company_slug, d]));
      const filas = actual.map((d) => {
        const a = porSlug.get(d.company_slug)!; // mismos execs en todos los cortes
        return {
          ...ficha(d),
          rank_before: a.rank,
          rank_change: a.rank - d.rank,
          index_before: a.index,
          index_change: Math.round((d.index - a.index) * 10) / 10,
        };
      });
      return {
        since: desde[i].toISOString().slice(0, 10),
        risers: filas
          .filter((f) => f.rank_change > 0)
          .sort((x, y) => y.rank_change - x.rank_change || y.index_change - x.index_change || x.rank - y.rank),
        fallers: filas
          .filter((f) => f.rank_change < 0)
          .sort((x, y) => x.rank_change - y.rank_change || x.index_change - y.index_change || x.rank - y.rank),
        all: filas,
      };
    };
    const cambios = Object.fromEntries(periodos.map((p, i) => [p, cambio(i)])) as Record<
      Periodo,
      PeriodoMovimientosDto | null
    >;

    return { as_of: hoy.toISOString().slice(0, 10), top: actual.map(ficha), periods: cambios };
  }

  /** Voto neto por empresa, sólo de días anteriores a `corte`. */
  private async netoHasta(semana: Date, corte: Date): Promise<Map<string, number>> {
    const rows = await this.prisma.executiveVote.groupBy({
      by: ['companySlug'],
      where: { weekStart: semana, voteDay: { lt: corte } },
      _sum: { value: true },
    });
    return new Map(rows.map((r) => [r.companySlug, r._sum.value ?? 0]));
  }

  private async calcularLista(): Promise<DirectivosResponseDto | null> {
    const semana = semanaDe();
    /* Dos cortes: el de hoy y el de ayer. El segundo es lo único que hace
       verdadera la frase del pie —«la flecha dice cuántos lugares se movió cada
       uno»—: sin él, el movimiento habría que compararlo contra un orden que
       nadie guardó. Recalcularlo sale una consulta más y un sort, contra una
       tabla de historial y un cron que habría que mantener. */
    const hoy = diaDe();
    const ayer = new Date(hoy);
    ayer.setUTCDate(ayer.getUTCDate() - 1);

    const [execs, contribution, neto, netoAyer, votos, votantes, aFavor] = await Promise.all([
      this.prisma.companyExecutive.findMany(),
      this.operators.contribution(),
      this.netoHasta(semana, hoy),
      this.netoHasta(semana, ayer),
      this.prisma.executiveVote.count({ where: { weekStart: semana } }),
      /* COUNT(DISTINCT) en la base: el findMany con `distinct` traía un renglón
         por votante a Node para contarlos, cien mil filas con cien mil votantes. */
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(DISTINCT voter_hash)::int AS n FROM executive_vote WHERE week_start = ${semana}`,
      this.prisma.executiveVote.groupBy({
        by: ['companySlug'],
        where: { weekStart: semana, value: 1 },
        _count: { _all: true },
        orderBy: [{ _count: { companySlug: 'desc' } }, { companySlug: 'asc' }],
        take: 3,
      }),
    ]);
    if (!execs.length || !contribution) return null;
    const puntos = puntosPorVoto(neto);
    const puntosAyer = puntosPorVoto(netoAyer);

    const companies = await this.prisma.company.findMany({
      where: { slug: { in: execs.map((e) => e.companySlug) } },
      select: { slug: true, name: true, projectCountOilGas: true },
    });
    const companyBySlug = new Map(companies.map((c) => [c.slug, c]));

    const filas = filasDe(execs, companyBySlug, contribution);

    /* El voto se suma DESPUÉS de normalizar el índice de la empresa, y con su
       propio presupuesto de puntos: así el aporte de la gente es legible
       —«hasta seis puntos»— y no se mezcla con la ponderación de los insumos,
       que es la que no se publica. */
    const base = calcularIndices(filas, contribution.totals.gross_value_usd);

    const puestosAyer = new Map(ordenar(base, puntosAyer).map((d, i) => [d.company_slug, i + 1]));

    const directivos = ordenar(base, puntos).map(
      ({ escala: _e, valorUsd: _v, pozos: _p, conVoto, ...d }, i): DirectivoDto => ({
        ...d,
        /* Se ordena por conVoto crudo pero se publica recortado a 0–100: el
           líder del índice con votos a favor daba 102,4 en una escala que la
           página presenta como de 0 a 100. */
        index: indicePublicado(conVoto),
        rank: i + 1,
        /* Positivo = subió. Cero cuando nadie se movió, que es el caso normal:
           el frontend no dibuja el renglón. */
        rank_change: (puestosAyer.get(d.company_slug) ?? i + 1) - (i + 1),
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
        voters: votantes[0]?.n ?? 0,
        weekly_limit: LIMITE_SEMANAL,
        /* Cuenta TODA la semana, hoy incluido, igual que los dos contadores de
           arriba: es actividad, no el orden, así que no espera al corte. */
        top_voted: aFavor.map((v) => ({
          company_slug: v.companySlug,
          name: execs.find((e) => e.companySlug === v.companySlug)?.name ?? v.companySlug,
          votes: v._count._all,
        })),
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
  async estadoVoto(ip: string, navegador: string | null): Promise<VotoEstadoDto> {
    const semana = semanaDe();
    const mios = await this.prisma.executiveVote.findMany({
      where: { voterHash: this.votante(ip, navegador).voterHash, weekStart: semana },
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
  async foto(
    slug: string,
    size?: string,
  ): Promise<{ body: Buffer; contentType: string; etag: string | null }> {
    const exec = await this.prisma.companyExecutive.findUnique({
      where: { companySlug: slug },
      select: { photoUrl: true },
    });
    if (!exec?.photoUrl) throw new NotFoundException(`Sin foto para ${slug}.`);

    /* La variante retina es OTRO archivo, no un reescalado: `ypf@2x.jpg` al
       lado de `ypf.jpg`. La ficha grande se dibuja a 161×200 CSS, que en una
       pantalla Retina son 322×400 reales, y el archivo de 161 estirado al doble
       se ve borroso. La fila chica no la necesita —se muestra a 60 y el de 161
       ya cubre los 120— así que el 2x sólo se baja al abrir una ficha. */
    const key = size === '2x' ? exec.photoUrl.replace(/\.jpg$/, '@2x.jpg') : exec.photoUrl;

    const cfg = s3ConfigFromEnv();
    if (!cfg) {
      throw new ServiceUnavailableException('El almacenamiento de imágenes no está configurado.');
    }
    const obj = await getObject(cfg, key);
    if (!obj) throw new NotFoundException(`Sin foto para ${slug}.`);
    return obj;
  }

  async votar(
    slug: string,
    value: 1 | -1,
    ip: string,
    navegador: string | null,
    token?: string,
  ): Promise<VotoEstadoDto> {
    const { voterHash, ipHash } = this.votante(ip, navegador);
    await verificarTurnstile(token, ip);
    const semana = semanaDe();

    const existe = await this.prisma.companyExecutive.findUnique({
      where: { companySlug: slug },
      select: { companySlug: true },
    });
    if (!existe) throw new NotFoundException(`No hay directivo cargado para ${slug}.`);

    /* CONTAR E INSERTAR VAN JUNTOS, bajo un lock por votante. Separados, cinco
       pedidos simultáneos a cinco personas distintas veían los cinco «usados <
       5» y entraban todos: un script sacaba diez votos o veinte. El lock es de
       transacción (se suelta solo al terminar) y es por votante, así que dos
       personas distintas no se esperan entre sí.

       EL VOTO NO SE EDITA: eso lo sigue haciendo cumplir el índice único
       (votante, empresa, semana); la colisión se atrapa afuera. */
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${voterHash}))::text`;
        const usados = await tx.executiveVote.count({ where: { voterHash, weekStart: semana } });
        if (usados >= LIMITE_SEMANAL) {
          throw new ConflictException(
            `Se acabaron los ${LIMITE_SEMANAL} votos de la semana. Vuelven el lunes.`,
          );
        }
        /* El techo por IP es blando —sin lock por IP, dos pedidos pueden pasarlo
           por uno o dos votos— y está bien: es contra el volumen de un script
           que rota ids, no un presupuesto exacto. */
        const tope = topeSemanalIp();
        const desdeIp = await tx.executiveVote.count({ where: { ipHash, weekStart: semana } });
        if (desdeIp >= tope) {
          throw new HttpException(
            'Demasiados votos desde esta conexión esta semana.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        await tx.executiveVote.create({
          data: { voterHash, ipHash, companySlug: slug, value, weekStart: semana, voteDay: diaDe() },
        });
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2002') {
        throw new ConflictException('Ya votaste a esta persona esta semana.');
      }
      throw e;
    }

    return this.estadoVoto(ip, navegador);
  }
}
