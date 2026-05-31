import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/swagger';
import { GeoWellsQueryDto } from './geo.dto';
import { GeoWellFeatureCollectionDto, GeoWellFeatureDto } from './geo.response';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly service: GeoService) {}

  @Get('wells')
  @ApiOperation({
    summary: 'Wells as a GeoJSON FeatureCollection',
    description: [
      'Returns **raw GeoJSON** (no `data` / `meta` envelope) so the response can be fed directly into Mapbox / MapLibre / Leaflet.',
      '',
      'Use `bbox=west,south,east,north` for viewport-based loading.',
      '',
      'Wells without coordinates are excluded. The `limit` caps total features per request (max 1000).',
    ].join('\n'),
  })
  @ApiOkResponse({ type: GeoWellFeatureCollectionDto, description: 'GeoJSON FeatureCollection of well points.' })
  @ApiBadRequestResponse({ type: ApiErrorDto, description: 'Invalid bbox format.' })
  wells(@Query() q: GeoWellsQueryDto) {
    return this.service.wells(q);
  }

  @Get('wells/:id')
  @ApiOperation({
    summary: 'Single well as a GeoJSON Feature',
    description: 'Returns raw GeoJSON. 404 if the well has no recorded coordinates.',
  })
  @ApiParam({ name: 'id', example: '10000' })
  @ApiOkResponse({ type: GeoWellFeatureDto, description: 'GeoJSON Feature for one well.' })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Well missing or has no geometry.' })
  well(@Param('id') id: string) {
    return this.service.well(id);
  }
}
