import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { ListProvincesQueryDto } from './provinces.dto';
import { ProvinceDetailDto, ProvinceListItemDto } from './provinces.response';
import { ProvincesService } from './provinces.service';

@ApiTags('provinces')
@Controller({ path: 'provinces', version: '2' })
export class ProvincesController {
  constructor(private readonly service: ProvincesService) {}

  @Get()
  @ApiOperation({
    summary: 'List provinces',
    description: 'Every province with mining or uranium activity, with project counts and the commodities present. Filter by `commodity`.',
  })
  @ApiOkEnvelope(ProvinceListItemDto, { isArray: true })
  list(@Query() q: ListProvincesQueryDto) {
    return this.service.list(q);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Province detail',
    description: 'All projects in one province, broken down by commodity, with operating companies and exploration / active-mine counts.',
  })
  @ApiParam({ name: 'slug', example: 'chubut' })
  @ApiOkEnvelope(ProvinceDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Province slug not found.' })
  detail(@Param('slug') slug: string) {
    return this.service.detail(slug);
  }
}
