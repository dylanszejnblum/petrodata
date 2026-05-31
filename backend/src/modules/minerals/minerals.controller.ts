import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import {
  CommodityProjectsQueryDto,
  ListProjectsQueryDto,
  MapQueryDto,
} from './minerals.dto';
import {
  CommodityPriceDto,
  CommodityRollupDto,
  ProjectDetailDto,
  ProjectListItemDto,
  SummaryDto,
} from './minerals.response';
import { MineralsService } from './minerals.service';
import { PricesService } from './prices.service';

@ApiTags('minerals')
@Controller({ path: 'minerals', version: '2' })
export class MineralsController {
  constructor(
    private readonly service: MineralsService,
    private readonly pricesService: PricesService,
  ) {}

  @Get('projects')
  @ApiOperation({
    summary: 'List mining projects',
    description:
      'Paginated, filterable catalog of mining projects across commodities (silver, gold, uranium, copper, lithium, …). Each list item includes a small `commodity_highlights` map derived from the project\'s resources JSONB.',
  })
  @ApiOkEnvelope(ProjectListItemDto, { isArray: true, paginated: true })
  list(@Query() q: ListProjectsQueryDto) {
    return this.service.list(q);
  }

  @Get('projects/:name')
  @ApiOperation({
    summary: 'Mining project detail',
    description:
      'Full project fact sheet, including raw `resources` and `reserves` JSONB exactly as the pipeline emitted them.',
  })
  @ApiParam({ name: 'name', example: 'Diablillos', description: 'Project name (case-sensitive, as ingested).' })
  @ApiOkEnvelope(ProjectDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Project name not found.' })
  detail(@Param('name') name: string) {
    return this.service.detail(name);
  }

  @Get('commodities')
  @ApiOperation({
    summary: 'Commodity rollups',
    description: 'Project counts and aggregate resource/reserve totals per commodity.',
  })
  @ApiOkEnvelope(CommodityRollupDto, { isArray: true })
  commodities() {
    return this.service.commodities();
  }

  @Get('commodities/:commodity')
  @ApiOperation({
    summary: 'Projects for one commodity',
    description: 'All projects whose primary commodity matches (case-insensitive), with their raw resources/reserves attached.',
  })
  @ApiParam({ name: 'commodity', example: 'Silver' })
  @ApiOkResponse({ description: 'Projects grouped under one commodity.' })
  commodityProjects(@Param('commodity') commodity: string, @Query() q: CommodityProjectsQueryDto) {
    return this.service.commodityProjects(commodity, q);
  }

  @Get('map')
  @ApiOperation({
    summary: 'Projects as a GeoJSON FeatureCollection',
    description: 'Raw GeoJSON (no `data` / `meta` envelope). Projects without coordinates are excluded.',
  })
  @ApiOkResponse({ description: 'GeoJSON FeatureCollection of project points.' })
  map(@Query() q: MapQueryDto) {
    return this.service.map(q);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Dashboard summary',
    description: 'Totals and breakdowns by commodity, status, and province, plus the set of source pipelines that fed the database.',
  })
  @ApiOkEnvelope(SummaryDto)
  summary() {
    return this.service.summary();
  }

  @Get('prices')
  @ApiOperation({
    summary: 'Live commodity prices',
    description: 'Latest quotes for the tracked commodities (Silver, Gold, Copper, Uranium, Lithium). Uranium and Lithium use sector ETFs as proxies. Sourced from Yahoo Finance; 5-minute server-side cache.',
  })
  @ApiOkEnvelope(CommodityPriceDto, { isArray: true })
  prices() {
    return this.pricesService.commodities();
  }

  @Get('prices/:commodity')
  @ApiOperation({
    summary: 'Live commodity price (single)',
    description: 'Latest quote for one commodity. Case-insensitive name match against the supported set.',
  })
  @ApiParam({ name: 'commodity', example: 'Silver' })
  @ApiOkEnvelope(CommodityPriceDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Commodity not tracked.' })
  price(@Param('commodity') commodity: string) {
    return this.pricesService.commodity(commodity);
  }
}
