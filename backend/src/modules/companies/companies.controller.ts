import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { ListCompaniesQueryDto } from './companies.dto';
import { CompanyDetailDto, CompanyListItemDto } from './companies.response';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@Controller({ path: 'companies', version: '2' })
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @ApiOperation({
    summary: 'List companies',
    description:
      'Every controlling company / operator across all commodities, with project counts and the commodities they operate in. Sorted by project count. Filter by `q`, `commodity`, `origin_country`.',
  })
  @ApiOkEnvelope(CompanyListItemDto, { isArray: true })
  list(@Query() q: ListCompaniesQueryDto) {
    return this.service.list(q);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Company detail',
    description: 'Full project portfolio for one company across commodities and provinces, with a stage timeline.',
  })
  @ApiParam({ name: 'slug', example: 'cnea' })
  @ApiOkEnvelope(CompanyDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Company slug not found.' })
  detail(@Param('slug') slug: string) {
    return this.service.detail(slug);
  }
}
