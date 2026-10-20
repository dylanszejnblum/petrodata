import { Controller, Get, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { FxQueryDto } from './macro.dto';
import { FxLatestDto, FxPointDto, RigCountPointDto, WellsDrillingPointDto } from './macro.response';
import { MacroService } from './macro.service';
import { SHALE_RESOURCES } from './shale-resources';

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

  @Get('world/basins')
  @ResponseMeta({
    source: 'EIA Short-Term Energy Outlook (US basins) · Secretaría de Energía (Vaca Muerta) · Baker Hughes (Argentina rigs)',
    dataset: 'Vaca Muerta vs US shale basins, monthly',
    note: 'US: crude oil only (no condensate/NGL) and marketed gas; recent months are EIA estimates, revised monthly.',
  })
  @ApiOperation({
    summary: 'Vaca Muerta vs Permian and other US shale basins',
    description:
      'Monthly, same units: crude kb/d, gas Bcf/d and MMm3/d, rigs. Basins: permian, eagle_ford, bakken, haynesville, ' +
      'appalachia (EIA STEO) and vaca_muerta (SE production, `preliminary` on the month still being filed). ' +
      '`argentina_rigs` is the whole country (Baker Hughes): there is no VM-only rig count.',
  })
  @ApiQuery({ name: 'from', required: false, example: '2024-01' })
  basins(@Query('from') from?: string) {
    return this.service.basins(from);
  }

  @Get('world/shale-resources')
  @ResponseMeta({ source: SHALE_RESOURCES.source, dataset: 'Technically recoverable shale resources by country' })
  @ApiOperation({
    summary: 'Shale resources by country (EIA 2015)',
    description:
      'Unproved technically recoverable shale gas (Tcf) and tight oil (billion bbl): top 10 countries each, world total and ' +
      'Argentina by formation. Static: EIA has not updated this assessment since Sept 2015 — cite it with its date.',
  })
  shaleResources() {
    return SHALE_RESOURCES;
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
