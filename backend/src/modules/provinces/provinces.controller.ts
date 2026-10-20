import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { ListProvincesQueryDto, ProvinceProductionQueryDto } from './provinces.dto';
import {
  ProvinceDetailDto,
  ProvinceExportRowDto,
  ProvinceExportSummaryDto,
  ProvinceListItemDto,
  ProvinceProductionPointDto,
} from './provinces.response';
import { EXPORTS_ESTIMATE, ProvincesService } from './provinces.service';

// meta de los dos endpoints de exportaciones: ver EXPORTS_ESTIMATE
const EXPORTS_META = {
  source: 'vacamuerta.io estimate over Secretaría de Energía production — NOT an export record',
  dataset: 'Estimated provincial export value',
  ...EXPORTS_ESTIMATE,
};

@ApiTags('provinces')
@Controller({ path: 'provinces', version: '2' })
export class ProvincesController {
  constructor(private readonly service: ProvincesService) {}

  @Get()
  @ApiOperation({
    summary: 'List provinces',
    description: 'Every province with oil & gas or mining activity, with combined project counts and commodities. Filter by `commodity`.',
  })
  @ApiOkEnvelope(ProvinceListItemDto, { isArray: true })
  list(@Query() q: ListProvincesQueryDto) {
    return this.service.list(q);
  }

  @Get('export-summary')
  @ResponseMeta(EXPORTS_META)
  @ApiOperation({
    summary: 'Province export ranking',
    description:
      'ESTIMATE, not recorded exports (see `meta.method` / `estimate`): provinces ranked by an annual value ' +
      'derived from production with fixed price and export-share assumptions. Do not publish as export data.',
  })
  @ApiOkEnvelope(ProvinceExportSummaryDto)
  exportSummary() {
    return this.service.exportSummary();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Province detail',
    description: 'Unified province profile: live oil & gas production summary, mineral project portfolio, and export profile.',
  })
  @ApiParam({ name: 'slug', example: 'chubut' })
  @ApiOkEnvelope(ProvinceDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Province slug not found.' })
  detail(@Param('slug') slug: string) {
    return this.service.detail(slug);
  }

  @Get(':slug/production')
  @ApiOperation({
    summary: 'Province O&G production time series',
    description: 'Monthly oil & gas production for the province (same shape as operator production). Empty for provinces with no O&G activity. Supports `from` / `to`.',
  })
  @ApiParam({ name: 'slug', example: 'neuquen' })
  @ApiOkEnvelope(ProvinceProductionPointDto, { isArray: true })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Province slug not found.' })
  production(@Param('slug') slug: string, @Query() q: ProvinceProductionQueryDto) {
    return this.service.production(slug, q);
  }

  @Get(':slug/exports')
  @ResponseMeta(EXPORTS_META)
  @ApiOperation({
    summary: 'Province exports by sector',
    description:
      'ESTIMATE, not recorded exports (see `meta.method`): annual value by sector derived from production ' +
      'with fixed price and export-share assumptions. Do not publish as export data.',
  })
  @ApiParam({ name: 'slug', example: 'chubut' })
  @ApiOkEnvelope(ProvinceExportRowDto, { isArray: true })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Province slug not found.' })
  exports(@Param('slug') slug: string) {
    return this.service.exports(slug);
  }
}
