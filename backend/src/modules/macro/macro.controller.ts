import { Controller, Get, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { FxQueryDto } from './macro.dto';
import { FxLatestDto, FxPointDto, RigCountPointDto, WellsDrillingPointDto } from './macro.response';
import { MacroService } from './macro.service';

const RIG_META = {
  source: 'Baker Hughes — Worldwide Rig Count (rigcount.bakerhughes.com)',
  dataset: 'Active drilling rigs, Argentina (oil / gas)',
  note: 'Loaded manually each month; Baker Hughes revises past months.',
};

@ApiTags('macro')
@Controller()
export class MacroController {
  constructor(private readonly service: MacroService) {}

  @Get('macro/fx')
  @ApiOperation({
    summary: 'USD/ARS time series',
    description: 'Daily official (BCRA) and blue (parallel) exchange rates from bluelytics. Both sell and buy sides. Range filterable.',
  })
  @ApiOkEnvelope(FxPointDto, { isArray: true })
  fxSeries(@Query() q: FxQueryDto) {
    return this.service.fxSeries(q);
  }

  @Get('macro/fx/latest')
  @ApiOperation({
    summary: 'Latest USD/ARS rates',
    description: 'Latest oficial + blue (sell + buy) rates.',
  })
  @ApiOkEnvelope(FxLatestDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'No FX data ingested.' })
  fxLatest() {
    return this.service.fxLatest();
  }

  @Get('rig-count')
  @ResponseMeta(RIG_META)
  @ApiOperation({
    summary: 'Argentina rig-count time series',
    description:
      'Active drilling rigs in Argentina per month, oil / gas / total — Baker Hughes Worldwide Rig Count (method since Aug 2025, ' +
      'history from 2013). Loaded by hand monthly (Baker Hughes blocks automated downloads), so it can trail by a month; ' +
      'for an always-current official activity series see /rig-count/wells-drilling.',
  })
  @ApiOkEnvelope(RigCountPointDto, { isArray: true })
  rigCount() {
    return this.service.rigCountSeries();
  }

  @Get('rig-count/wells-drilling')
  @ResponseMeta({
    source: 'Secretaría de Energía / datos.energia.gob.ar',
    dataset: 'Perforación de pozos de petróleo y gas — Pozos en perforación',
    license: 'CC-BY-4.0',
  })
  @ApiOperation({
    summary: 'Wells being drilled per month (official)',
    description:
      'Wells in drilling per month, national total and by province (Secretaría de Energía). Counts WELLS, not rigs, and ' +
      'does not split oil from gas. Refreshed automatically by db:refresh. Filter with `province` (e.g. Neuquén).',
  })
  @ApiQuery({ name: 'province', required: false, example: 'Neuquén' })
  @ApiOkEnvelope(WellsDrillingPointDto, { isArray: true })
  wellsDrilling(@Query('province') province?: string) {
    return this.service.wellsDrilling(province);
  }

  @Get('rig-count/latest')
  @ResponseMeta(RIG_META)
  @ApiOperation({
    summary: 'Latest rig-count snapshot',
    description: 'Most recent month\'s oil / gas / total rig count.',
  })
  @ApiOkEnvelope(RigCountPointDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'No rig-count data ingested.' })
  rigCountLatest() {
    return this.service.rigCountLatest();
  }
}
