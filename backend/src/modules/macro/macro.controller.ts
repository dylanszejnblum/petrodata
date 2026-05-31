import { Controller, Get, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { FxQueryDto } from './macro.dto';
import { FxLatestDto, FxPointDto, RigCountPointDto } from './macro.response';
import { MacroService } from './macro.service';

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
  @ApiOperation({
    summary: 'Argentina rig-count time series',
    description: 'Monthly Baker Hughes rig count for Argentina (oil / gas / total). Currently a small placeholder dataset until the scraper stabilizes.',
  })
  @ApiOkEnvelope(RigCountPointDto, { isArray: true })
  rigCount() {
    return this.service.rigCountSeries();
  }

  @Get('rig-count/latest')
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
