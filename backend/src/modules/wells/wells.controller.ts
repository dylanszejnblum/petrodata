import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { ListWellsQueryDto, WellProductionQueryDto } from './wells.dto';
import { WellDetailDto, WellDto, WellTimeSeriesPointDto } from './wells.response';
import { WellsService } from './wells.service';

@ApiTags('wells')
@Controller('wells')
export class WellsController {
  constructor(private readonly service: WellsService) {}

  @Get()
  @ApiOperation({
    summary: 'List wells',
    description: 'Paginated well catalog. Supports filters by operator/formation/basin/province/concession and a substring search on `sigla`.',
  })
  @ApiOkEnvelope(WellDto, { isArray: true, paginated: true })
  list(@Query() q: ListWellsQueryDto) {
    return this.service.list(q);
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
