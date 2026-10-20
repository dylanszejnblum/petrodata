import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { ListWellsQueryDto, WellProductionQueryDto, WellSummaryQueryDto } from './wells.dto';
import { WellDetailDto, WellDto, WellSummaryDto, WellTimeSeriesPointDto } from './wells.response';
import { WellsService } from './wells.service';

@ApiTags('wells')
@Controller('wells')
export class WellsController {
  constructor(private readonly service: WellsService) {}

  @Get()
  @ApiOperation({
    summary: 'List wells',
    description: 'Paginated well catalog (every well ever registered, incl. abandoned; `pagination.total` is the catalog count — for active wells use /wells/summary). Supports filters by operator/formation/basin/province/concession and a substring search on `sigla`.',
  })
  @ApiOkEnvelope(WellDto, { isArray: true, paginated: true })
  list(@Query() q: ListWellsQueryDto) {
    return this.service.list(q);
  }

  // Declared before :id so "summary" isn't read as a well id.
  @Get('summary')
  @ApiOperation({
    summary: 'Well counts by province, formation or operator',
    description:
      'Producing wells (boe > 0, the API-wide meaning of "active") and reporting wells (filed that month, ' +
      'zero months included) per group, for one month. Defaults to latest_complete_month. `vm=true` for Vaca Muerta only.',
  })
  @ApiOkEnvelope(WellSummaryDto)
  summary(@Query() q: WellSummaryQueryDto) {
    return this.service.summary(q);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Well detail',
    description: 'Well metadata plus a `latest_production` block with the most recent monthly fact for this well.',
  })
  @ApiParam({ name: 'id', example: '93863', description: 'Internal `well_id` (numeric string).' })
  @ApiOkEnvelope(WellDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Well ID not found.' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get(':id/production')
  @ApiOperation({
    summary: 'Monthly production for a single well',
    description: 'Time-ordered monthly facts. Optionally filtered with `from` / `to`.',
  })
  @ApiParam({ name: 'id', example: '93863' })
  @ApiOkEnvelope(WellTimeSeriesPointDto, { isArray: true })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Well ID not found.' })
  production(@Param('id') id: string, @Query() q: WellProductionQueryDto) {
    return this.service.timeSeries(id, q);
  }
}
