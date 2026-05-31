import { ApiProperty } from '@nestjs/swagger';

export class ProvinceListItemDto {
  @ApiProperty({ example: 'chubut' }) slug!: string;
  @ApiProperty({ example: 'Chubut' }) name!: string;
  @ApiProperty({ example: 'CT', nullable: true }) iso_code!: string | null;
  @ApiProperty({ example: 8 }) project_count!: number;
  @ApiProperty({ type: [String], example: ['Uranio'] }) commodities!: string[];
  @ApiProperty({ example: null, nullable: true, description: 'Reserved for a province-level resource total; null until a comparable per-province aggregate exists.' })
  total_resources!: number | null;
}

export class ProvinceCommodityDto {
  @ApiProperty({ example: 'Uranio' }) name!: string;
  @ApiProperty({ example: 8 }) project_count!: number;
  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: true,
    description: 'Per-commodity resource total when derivable, else null.',
    example: null,
  })
  total_resources!: { value: number; unit: string } | null;
}

export class ProvinceCoordinatesDto {
  @ApiProperty({ example: -43.37, nullable: true }) lat!: number | null;
  @ApiProperty({ example: -68.688, nullable: true }) lng!: number | null;
}

export class ProvinceControllerDto {
  @ApiProperty({ example: 'CNEA' }) name!: string;
  @ApiProperty({ example: 'cnea' }) slug!: string;
  @ApiProperty({ example: 'Argentina', nullable: true }) origin_country!: string | null;
  @ApiProperty({ example: '1.0', nullable: true }) ownership_pct!: string | null;
}

export class ProvinceProjectDto {
  @ApiProperty({ example: 'Cerro Solo' }) name!: string;
  @ApiProperty({ example: 'Exploración avanzada', nullable: true }) status!: string | null;
  @ApiProperty({ example: 'Uranio' }) commodity!: string;
  @ApiProperty({ type: [ProvinceControllerDto] }) controllers!: ProvinceControllerDto[];
  @ApiProperty({ type: ProvinceCoordinatesDto }) coordinates!: ProvinceCoordinatesDto;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
    example: null,
  })
  resources_summary!: Record<string, number> | null;
}

export class ProvinceTradeStatsDto {
  @ApiProperty({ type: [String], example: [] }) major_exports!: string[];
  @ApiProperty({ example: null, nullable: true }) employment!: number | null;
}

export class ProvinceDetailDto {
  @ApiProperty({ example: 'Chubut' }) name!: string;
  @ApiProperty({ example: 'chubut' }) slug!: string;
  @ApiProperty({ example: 'CT', nullable: true }) iso_code!: string | null;
  @ApiProperty({ example: 8 }) project_count!: number;
  @ApiProperty({ type: [ProvinceCommodityDto] }) commodities!: ProvinceCommodityDto[];
  @ApiProperty({ type: [ProvinceProjectDto] }) projects!: ProvinceProjectDto[];
  @ApiProperty({ type: ProvinceTradeStatsDto, nullable: true }) trade_stats!: ProvinceTradeStatsDto | null;
  @ApiProperty({ example: 0 }) active_mines!: number;
  @ApiProperty({ example: 6 }) exploration_projects!: number;
  @ApiProperty({ type: [String], example: ['CNEA', 'UrAmérica Ltd.'] }) companies_operating!: string[];
}
