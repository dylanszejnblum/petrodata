import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { InversionesService } from './inversiones.service';

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
      'Computed /inversiones payload: VM production, national share, active wells, operator leaderboard, production series, energy exports, breakeven headroom (live Brent from FactPrice vs. a cited breakeven reference), activity momentum (new VM wells/month), and INDEC energy trade — real energy exports, energy trade surplus (superávit) and the agro-vs-energy export crossover (cruce) — all derived from ingested data, source-cited, with as-of from the data.',
  })
  get() {
    return this.service.getPage();
  }
}
