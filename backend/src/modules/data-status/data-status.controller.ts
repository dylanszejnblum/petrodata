import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope } from '../../common/swagger';
import { DataFreshnessDto } from './data-status.response';
import { DataStatusService } from './data-status.service';

@ApiTags('data-status')
@Controller('data-freshness')
export class DataStatusController {
  constructor(private readonly service: DataStatusService) {}

  @Get()
  @ApiOperation({
    summary: 'Data freshness + row counts',
    description: 'Returns the earliest/latest months available plus a row count per table. Use this to attribute the data source on the frontend and to detect stale ingestion.',
  })
  @ApiOkEnvelope(DataFreshnessDto)
  freshness() {
    return this.service.freshness();
  }
}
