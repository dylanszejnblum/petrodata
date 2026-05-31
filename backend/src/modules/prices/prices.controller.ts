import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import {
  CommoditySeriesQueryDto,
  FuelPricesQueryDto,
} from './prices.dto';
import {
  CommodityLatestDto,
  CommoditySeriesPointDto,
  EnergyLatestDto,
  FuelLatestEntryDto,
  FuelPriceRowDto,
} from './prices.response';
import { PricesService } from './prices.service';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly service: PricesService) {}

  @Get('commodities')
  @ApiOperation({
    summary: 'Latest commodity prices',
    description: 'One row per tracked commodity series (gold, silver, copper, lithium_etf, uranium_etf) with the most recent monthly value. Sourced from Yahoo Finance (monthly snapshot fetched upstream).',
  })
  @ApiOkEnvelope(CommodityLatestDto, { isArray: true })
  commodities() {
    return this.service.commoditiesSummary();
  }

  @Get('commodities/:commodity')
  @ApiOperation({
    summary: 'Commodity time series',
    description: 'Monthly value history for one commodity (`gold`, `silver`, `copper`, `lithium_etf`, `uranium_etf`).',
  })
  @ApiParam({ name: 'commodity', example: 'gold' })
  @ApiOkEnvelope(CommoditySeriesPointDto, { isArray: true })
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Series not tracked.' })
  commoditySeries(@Param('commodity') commodity: string, @Query() q: CommoditySeriesQueryDto) {
    return this.service.commoditySeries(commodity, q);
  }

  @Get('energy')
  @ApiOperation({
    summary: 'Latest energy prices (EIA)',
    description: 'Latest EIA-sourced energy series (Brent, WTI, Henry Hub). Returns an empty array when the EIA pipeline has not yet run — set `EIA_API_KEY` upstream and re-seed.',
  })
  @ApiOkEnvelope(EnergyLatestDto, { isArray: true })
  energy() {
    return this.service.energySummary();
  }

  @Get('fuel')
  @ApiOperation({
    summary: 'Gas station fuel prices',
    description: 'Filterable list of station-level fuel prices (current snapshot). Use `provincia`, `producto`, `bandera`, `from`, `to`.',
  })
  @ApiOkEnvelope(FuelPriceRowDto, { isArray: true, paginated: true })
  fuel(@Query() q: FuelPricesQueryDto) {
    return this.service.fuelPrices(q);
  }

  @Get('fuel/latest')
  @ApiOperation({
    summary: 'Latest fuel prices by province + product',
    description: 'For each (provincia, producto) pair, returns the latest fecha_vigencia plus min / avg / max across stations on that date. Optionally filter by `provincia` and / or `producto`.',
  })
  @ApiQuery({ name: 'provincia', required: false, example: 'NEUQUEN' })
  @ApiQuery({ name: 'producto', required: false, example: 'Nafta Premium' })
  @ApiOkEnvelope(FuelLatestEntryDto, { isArray: true })
  fuelLatest(@Query('provincia') provincia?: string, @Query('producto') producto?: string) {
    return this.service.fuelLatest({ provincia, producto });
  }
}
