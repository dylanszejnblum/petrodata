import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiOkEnvelope } from '../../common/swagger';
import { MonthlyQueryDto } from './production.dto';
import {
  GroupedProductionRowDto,
  LatestSummaryDto,
  ProductionFactDto,
} from './production.response';
import { ProductionService } from './production.service';

@ApiTags('production')
@ApiExtraModels(GroupedProductionRowDto)
@Controller('production')
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  @Get('monthly')
  @ApiOperation({
    summary: 'Monthly production facts',
    description: [
      'Returns paginated monthly production rows from `fact_production_monthly`.',
      '',
      'Filters: `operator`, `formation`, `province`, `vm=true|false`, `from=YYYY-MM`, `to=YYYY-MM`.',
      '',
      'Pass `group_by=operator|concession|formation|province` to aggregate rows on the fly — the response items follow the `GroupedProductionRowDto` shape (the group key field is named after the chosen `group_by`).',
    ].join('\n'),
  })
  @ApiOkEnvelope(ProductionFactDto, {
    isArray: true,
    paginated: true,
    description:
      'Default (ungrouped) response. When `group_by` is supplied, items follow `GroupedProductionRowDto` instead.',
  })
  monthly(@Query() q: MonthlyQueryDto) {
    return this.service.monthly(q);
  }

  @Get('latest')
  @ApiOperation({
    summary: 'Latest-month summary',
    description:
      'Single-row totals for the most recent month available, including BOE total, VM share of oil/gas/BOE, and the top 5 operators by BOE.',
  })
  @ApiOkEnvelope(LatestSummaryDto)
  latest() {
    return this.service.latest();
  }
}
