import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto, ApiOkEnvelope } from '../../common/swagger';
import { ListCompaniesQueryDto, StockHistoryQueryDto } from './companies.dto';
import {
  CompanyDetailDto,
  CompanyListItemDto,
  CompanyStockPriceRowDto,
  StockHistoryDto,
} from './companies.response';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@Controller({ path: 'companies', version: '2' })
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @ApiOperation({
    summary: 'List companies',
    description:
      'All companies — mining operators and oil & gas operators in one list — with logos, stock metadata and project counts. Filter by `type` (oil_and_gas | mining | both | all), `q`, `commodity`, `country`.',
  })
  @ApiOkEnvelope(CompanyListItemDto, { isArray: true })
  list(@Query() q: ListCompaniesQueryDto) {
    return this.service.list(q);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Publicly traded companies',
    description: 'Companies with a stock ticker — the set the frontend renders stock cards for.',
  })
  @ApiOkEnvelope(CompanyListItemDto, { isArray: true })
  publicCompanies() {
    return this.service.publicCompanies();
  }

  @Get('prices')
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // outbound Yahoo fetch — protect the upstream
  @ApiOperation({
    summary: 'Live stock prices',
    description: 'Current price and daily change for every public company, sourced from Yahoo Finance and cached for 5 minutes.',
  })
  @ApiOkEnvelope(CompanyStockPriceRowDto, { isArray: true })
  prices() {
    return this.service.prices();
  }

  @Get('prices/:ticker')
  @Throttle({ default: { ttl: 60_000, limit: 30 } }) // outbound Yahoo fetch — protect the upstream
  @ApiOperation({
    summary: 'Stock price history (OHLCV)',
    description:
      'Daily (or finer) price history for one ticker over a range, plus current price, daily change and 52-week high/low. Sourced from Yahoo Finance v8 chart API, cached 5 minutes. Non-US tickers are resolved automatically (CAPX→CAPX.BA, BSK→BSK.V).',
  })
  @ApiParam({ name: 'ticker', example: 'YPF' })
  @ApiOkEnvelope(StockHistoryDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Ticker not found or no history from Yahoo.' })
  priceHistory(@Param('ticker') ticker: string, @Query() q: StockHistoryQueryDto) {
    return this.service.priceHistory(ticker, q.range ?? '1mo', q.interval ?? '1d');
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Company detail',
    description:
      'Full profile: logo, website, stock data, mineral project portfolio (with timeline) and — for oil & gas operators — a production summary.',
  })
  @ApiParam({ name: 'slug', example: 'ypf' })
  @ApiOkEnvelope(CompanyDetailDto)
  @ApiNotFoundResponse({ type: ApiErrorDto, description: 'Company slug not found.' })
  detail(@Param('slug') slug: string) {
    return this.service.detail(slug);
  }
}
