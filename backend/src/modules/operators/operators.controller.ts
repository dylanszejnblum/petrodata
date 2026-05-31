import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/swagger';
import { ApiOkEnvelope } from '../../common/swagger';
import { ListOperatorsQueryDto, OperatorProductionQueryDto } from './operators.dto';
import {
  OperatorDetailDto,
  OperatorListItemDto,
  OperatorTimeSeriesPointDto,
} from './operators.response';
import { OperatorsService } from './operators.service';

@ApiTags('operators')
@Controller('operators')
export class OperatorsController {
  constructor(private readonly service: OperatorsService) {}

  @Get()
  @ApiOperation({
    summary: 'List operators with latest-month totals',
    description:
      'Returns one row per operator, joined to the latest month available in `agg_monthly_by_operator`. Includes BOE share from Vaca Muerta wells.',
  })
  @ApiOkEnvelope(OperatorListItemDto, { isArray: true })
  list(@Query() q: ListOperatorsQueryDto) {
    return this.service.list(q);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Operator detail',
    description: 'Metadata, latest-month rank, latest-month totals and YTD totals for one operator.',
  })
  @ApiParam({ name: 'slug', example: 'ypf' })
  @ApiOkEnvelope(OperatorDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Operator slug not found.' })
  detail(@Param('slug') slug: string) {
    return this.service.detail(slug);
  }

  @Get(':slug/production')
  @ApiOperation({
    summary: 'Monthly time series for an operator',
    description: 'One point per `date_month`. Optionally filtered with `from` / `to`.',
  })
  @ApiParam({ name: 'slug', example: 'ypf' })
  @ApiOkEnvelope(OperatorTimeSeriesPointDto, { isArray: true })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Operator slug not found.' })
  production(@Param('slug') slug: string, @Query() q: OperatorProductionQueryDto) {
    return this.service.timeSeries(slug, q);
  }
}
