import { ApiProperty } from '@nestjs/swagger';

export class PriceQuoteDto {
  @ApiProperty({ example: 'SI=F' }) ticker!: string;
  @ApiProperty({ example: 74.83, nullable: true }) price!: number | null;
  @ApiProperty({ example: 'USD', nullable: true }) currency!: string | null;
  @ApiProperty({ example: 74.55, nullable: true }) previous_close!: number | null;
  @ApiProperty({ example: 0.28, nullable: true }) change!: number | null;
  @ApiProperty({ example: 0.376, nullable: true }) change_pct!: number | null;
  @ApiProperty({ example: 121.3, nullable: true }) fifty_two_week_high!: number | null;
  @ApiProperty({ example: 32.66, nullable: true }) fifty_two_week_low!: number | null;
  @ApiProperty({ example: '2026-05-28T20:30:00.000Z', nullable: true }) market_time!: string | null;
  @ApiProperty({ example: 'CMX', nullable: true }) exchange!: string | null;
  @ApiProperty({ example: 'FUTURE', nullable: true }) instrument_type!: string | null;
  @ApiProperty({ example: 'Silver May 26', nullable: true }) short_name!: string | null;
}

export class CommodityPriceDto extends PriceQuoteDto {
  @ApiProperty({ example: 'Silver' }) commodity!: string;
  @ApiProperty({ example: 'Silver futures (COMEX)' }) display!: string;
  @ApiProperty({ example: 'USD/oz' }) unit!: string;
  @ApiProperty({ example: false, description: 'True when the ticker is a sector ETF proxy rather than a direct commodity feed.' }) proxy!: boolean;
}

export class StockPriceDto extends PriceQuoteDto {
  @ApiProperty({ example: 'AbraSilver Resource Corp.' }) operator_match!: string;
  @ApiProperty({ example: 'OTC' }) exchange_label!: string;
}

export class ProjectListItemDto {
  @ApiProperty({ example: 'Diablillos' }) project_name!: string;
  @ApiProperty({ example: 'Silver' }) primary_commodity!: string;
  @ApiProperty({ example: 'Gold, Lead, Zinc', nullable: true }) by_products!: string | null;
  @ApiProperty({ example: 'Feasibility', nullable: true }) status!: string | null;
  @ApiProperty({ example: 'High Sulphidation Epithermal Style', nullable: true }) deposit_type!: string | null;
  @ApiProperty({ example: 'Salta', nullable: true }) province!: string | null;
  @ApiProperty({ example: 'Argentina', nullable: true }) country!: string | null;
  @ApiProperty({ example: -25.3, nullable: true }) latitude!: number | null;
  @ApiProperty({ example: -66.833, nullable: true }) longitude!: number | null;
  @ApiProperty({ example: 'AbraSilver Resource Corp.', nullable: true }) operator!: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { Silver: { measured_kOz: 76684 } },
    description: 'Per-commodity headline numbers extracted from resources/reserves for at-a-glance comparison.',
  })
  commodity_highlights!: Record<string, Record<string, number>>;
}

export class ProjectDetailDto extends ProjectListItemDto {
  @ApiProperty({ type: [String], example: ['Gold', 'Lead', 'Zinc'], nullable: true })
  by_products_list!: string[] | null;

  @ApiProperty({ example: 'AbraSilver Resource Corp.', nullable: true })
  owner_controller!: string | null;

  @ApiProperty({ example: 7919, nullable: true })
  area_ha!: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: {
      since_production: 2029,
      estimated_lom_years: 28,
      productive_capacity: '9000 tpd',
      estimated_annual_production: null,
      capex: '620 M USD',
      mining_method: 'Open pit',
      product: 'Concentrate and doré',
    },
  })
  technical_economic!: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Raw resources JSONB, as extracted by the pipeline.',
  })
  resources!: unknown;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Raw reserves JSONB, as extracted by the pipeline.',
  })
  reserves!: unknown;

  @ApiProperty({
    example: 2011,
    nullable: true,
    description: 'Reporting year of the resources/reserves table (when present in the source).',
  })
  resources_year!: number | null;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: { type: 'string' },
    description: 'Free-text geology sections extracted from the deck.',
    example: {
      regional: 'The Laguna Salada Project is located near the western edge of the Cretaceous San Jorge Basin…',
      deposit: 'The mineralization at Laguna Salada is contained in flat-topped mesas…',
    },
  })
  geology!: { regional?: string | null; deposit?: string | null } | null;

  @ApiProperty({ example: 'silver_2026_pptx', nullable: true })
  source_pipeline!: string | null;

  @ApiProperty({ example: '2026-05-27T14:30:00.000Z' })
  ingested_at!: string;

  @ApiProperty({
    type: [CommodityPriceDto],
    description: 'Live commodity prices for the project\'s primary commodity and any by-products we track.',
  })
  commodity_prices!: CommodityPriceDto[];

  @ApiProperty({
    type: StockPriceDto,
    nullable: true,
    description: 'Live stock quote for the operator\'s parent company, if publicly traded and mapped.',
  })
  stock!: StockPriceDto | null;
}

export class CommodityRollupDto {
  @ApiProperty({ example: 'Silver' }) commodity!: string;
  @ApiProperty({ example: 12 }) projects!: number;
  @ApiProperty({ example: 3 }) producing_projects!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Sum of resource values across projects, keyed by category + unit (e.g. measured_kOz).',
    example: { measured_kOz: 250000, indicated_kOz: 400000 },
  })
  resource_totals!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Sum of reserve values across projects.',
    example: { proven_kOz: 50000, probable_kOz: 100000 },
  })
  reserve_totals!: Record<string, number>;
}

export class SummaryDto {
  @ApiProperty({ example: 51 }) total_projects!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { Silver: 6, Gold: 13, Uranium: 4, Copper: 8, Lithium: 20 },
  })
  by_commodity!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { Operation: 8, Feasibility: 6, PEA: 10, Exploration: 18 },
  })
  by_status!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { Salta: 10, Jujuy: 8 },
  })
  by_province!: Record<string, number>;

  @ApiProperty({
    type: [String],
    example: ['silver_2026_pptx', 'gold_2026_pptx', 'uranium', 'copper_2026_pptx', 'lithium_2026_pptx'],
  })
  data_sources!: string[];
}
