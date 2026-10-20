import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { EXPORTS_SOURCE, ProvincesService } from './provinces.service';

const EXPORTS_META = { source: EXPORTS_SOURCE.source, dataset: 'Exportaciones por provincia de origen', note: EXPORTS_SOURCE.note };

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
      'Recorded exports by province of origin (INDEC OPEX), FOB US$, for the last complete calendar year (`period`), by ' +
      'gran rubro (Combustibles y energía, Productos primarios, MOA, MOI), plus the current year to date (`ytd_export_usd`, `ytd`).',
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

  @Get(':slug/exports/monthly')
  @ResponseMeta(EXPORTS_META)
  @ApiOperation({
    summary: 'Province exports, monthly',
    description:
      'Monthly recorded exports (INDEC OPEX, FOB US$) since 2002: total and by gran rubro. Use `from` to trim. ' +
      'For Neuquén, «Combustibles y energía» is ~97% of the total.',
  })
  @ApiParam({ name: 'slug', example: 'neuquen' })
  @ApiQuery({ name: 'from', required: false, example: '2024-01' })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Province slug not found.' })
  exportsMonthly(@Param('slug') slug: string, @Query('from') from?: string) {
    return this.service.exportsMonthly(slug, from);
  }

  @Get(':slug/exports')
  @ResponseMeta(EXPORTS_META)
  @ApiOperation({
    summary: 'Province exports by sector',
    description: 'Recorded exports (INDEC OPEX) for the last complete calendar year, by gran rubro. `year` says which.',
  })
  @ApiParam({ name: 'slug', example: 'chubut' })
  @ApiOkEnvelope(ProvinceExportRowDto, { isArray: true })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Province slug not found.' })
  exports(@Param('slug') slug: string) {
    return this.service.exports(slug);
  }
}
