import { BadRequestException, Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { InversionesService } from './inversiones.service';
import { pickLang } from './inversiones.i18n';

@ApiTags('inversiones')
@ResponseMeta({
  source: 'Computado desde datos oficiales (Secretaría de Energía)',
  dataset: 'Indicadores de inversión Vaca Muerta — CONFIRMADO (computado)',
  note: 'Cada figura se computa a partir de datos ya ingeridos por el pipeline; el as-of sale del propio dato.',
})
@Controller({ path: 'inversiones', version: '2' })
export class InversionesController {
  constructor(private readonly service: InversionesService) {}

  @Get()
  @ApiOperation({
    summary: 'Investment indicators (computed from official data)',
    description:
      'Computed /inversiones payload: VM production, national share, active wells, operator leaderboard, production series, energy exports, breakeven headroom (live Brent from FactPrice vs. a cited breakeven reference), activity momentum (new VM wells/month), and INDEC energy trade — real energy exports, energy trade surplus (superávit) and the agro-vs-energy export crossover (cruce, with each year also as % of GDP from World Bank) — all derived from ingested data, source-cited, with as-of from the data.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['es', 'en'],
    description: 'Response language. Falls back to the Accept-Language header, then Spanish.',
  })
  get(@Query('lang') lang?: string, @Headers('accept-language') acceptLanguage?: string) {
    // Explicit ?lang wins; otherwise negotiate from Accept-Language; default es.
    return this.service.getPage(pickLang(lang ?? acceptLanguage));
  }

  @Get('trimestre')
  @ApiOperation({
    summary: 'Same investment page, filtered to a quarter',
    description:
      'Full /inversiones payload anchored to a calendar quarter: everything (KPIs, series, operator leaderboard, exports) is computed as of the latest complete month within `?trimestre` (YYYY-Qn). Omit the param for the latest complete month. The response lists `trimestresDisponibles` — the valid quarter values.',
  })
  @ApiQuery({ name: 'trimestre', required: false, description: 'Quarter to filter by, e.g. 2026-Q1. Defaults to the latest complete month.' })
  @ApiQuery({ name: 'lang', required: false, enum: ['es', 'en'], description: 'Response language. Falls back to Accept-Language, then Spanish.' })
  getByTrimestre(
    @Query('trimestre') trimestre?: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    if (trimestre && !/^\d{4}-Q[1-4]$/.test(trimestre)) {
      throw new BadRequestException('trimestre must be formatted as YYYY-Qn, e.g. 2026-Q1');
    }
    return this.service.getPage(pickLang(lang ?? acceptLanguage), trimestre);
  }
}
