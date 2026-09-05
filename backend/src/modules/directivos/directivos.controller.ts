import { Body, Controller, Get, Header, HttpCode, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { VotarDto } from './directivos.dto';
import { DirectivosResponseDto, VotoEstadoDto } from './directivos.response';
import { DirectivosService } from './directivos.service';

/* La IP viene del proxy, igual que en newsletter: se lee del header y no de un
   parámetro, así que no entra en el contrato de OpenAPI. `trust proxy` está
   puesto en main.ts, si no req.ip sería la del Traefik y votaría uno solo por
   todos. */
function clientIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string) ?? '';
  return xff.split(',')[0]?.trim() || req.ip || 'unknown';
}

@ApiTags('directivos')
@Controller({ path: 'directivos', version: '2' })
export class DirectivosController {
  constructor(private readonly service: DirectivosService) {}

  @Get()
  @ApiOperation({
    summary: 'Quién dirige la cuenca',
    description:
      'Los directivos de las empresas del ranking, ordenados por un índice 0–100. ' +
      'El índice es de la EMPRESA —escala de producción, rendimiento por pozo y prima de valor, ' +
      'recalculados sobre la última ventana de doce meses— atribuido a quien la dirige: ' +
      'el dato no trae ninguna métrica de la persona. La ponderación no se publica. ' +
      'Los votos de la semana suman hasta ±6 puntos, repartidos por posición relativa, y ' +
      'entran al corte del día siguiente al que se emitieron.',
  })
  @ApiOkEnvelope(DirectivosResponseDto)
  async list() {
    const res = await this.service.list();
    if (!res) throw new NotFoundException('No hay directivos cargados todavía.');
    return res;
  }

  @Get('voto')
  @ApiOperation({
    summary: 'El presupuesto de quien pregunta',
    description:
      'Votos usados y emitidos esta semana por el que hace el pedido, identificado por IP. ' +
      'Respuesta por cliente: no la cachees.',
  })
  @ApiOkEnvelope(VotoEstadoDto)
  estado(@Req() req: Request) {
    return this.service.estadoVoto(clientIp(req));
  }

  @Get(':slug/foto')
  /* El meta va fijo para que el interceptor no consulte la base por cada
     imagen: acá no se sirve dato de producción, se sirve un jpg. */
  @ResponseMeta({ source: 'Petrodata', dataset: 'Retratos de directivos' })
  @ApiOperation({
    summary: 'La foto del directivo',
    description:
      'Devuelve el retrato desde el bucket privado. 404 si esa empresa no tiene foto cargada — ' +
      'son 32 de 48 y la lista cae al monograma sola. Cachea un año: el nombre del objeto lleva ' +
      'el slug, así que si cambia la cara hay que purgar.',
  })
  @ApiParam({ name: 'slug', example: 'ypf' })
  @ApiProduces('image/jpeg')
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Esa empresa no tiene foto.' })
  async foto(@Param('slug') slug: string, @Res() res: Response) {
    const { body, contentType, etag } = await this.service.foto(slug);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (etag) res.setHeader('ETag', etag);
    res.send(body);
  }

  @Post(':slug/voto')
  @HttpCode(200)
  // Cinco votos por semana ya es el límite real; esto sólo frena el que
  // martillea el endpoint para descubrir quién está cargado.
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({
    summary: 'Votar a un directivo',
    description:
      'Un voto por persona y por semana, cinco por semana en total. El voto NO se edita: una vez ' +
      'emitido no se saca ni se da vuelta hasta el lunes. El votante se identifica por IP — que no ' +
      'es una persona: una oficina o una operadora móvil son miles detrás de una sola, y ' +
      'cualquiera con VPN vota lo que quiera. Devuelve el presupuesto actualizado.',
  })
  @ApiParam({ name: 'slug', example: 'ypf', description: 'Slug de la EMPRESA.' })
  @ApiOkEnvelope(VotoEstadoDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'No hay directivo cargado para esa empresa.' })
  @ApiConflictResponse({ type: ApiErrorDto, description: 'Ya votó a esa persona esta semana, o se quedó sin votos.' })
  votar(@Param('slug') slug: string, @Body() dto: VotarDto, @Req() req: Request) {
    return this.service.votar(slug, dto.value, clientIp(req));
  }
}
