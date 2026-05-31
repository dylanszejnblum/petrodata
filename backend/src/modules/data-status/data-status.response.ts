import { ApiProperty } from '@nestjs/swagger';

export class TableRowCountDto {
  @ApiProperty({ example: 327686 }) rows!: number;
}

export class TableRowCountWithMonthDto {
  @ApiProperty({ example: 327686 }) rows!: number;
  @ApiProperty({ example: '2026-04-01', nullable: true }) latest_month!: string | null;
}

export class DataFreshnessTablesDto {
  @ApiProperty({ type: TableRowCountDto }) dim_operator!: TableRowCountDto;
  @ApiProperty({ type: TableRowCountDto }) dim_formation!: TableRowCountDto;
  @ApiProperty({ type: TableRowCountDto }) dim_well!: TableRowCountDto;
  @ApiProperty({ type: TableRowCountWithMonthDto }) fact_production_monthly!: TableRowCountWithMonthDto;
  @ApiProperty({ type: TableRowCountWithMonthDto }) agg_monthly_by_operator!: TableRowCountWithMonthDto;
}

export class DataFreshnessDto {
  @ApiProperty({ example: 'Secretaría de Energía / datos.energia.gob.ar' }) source!: string;
  @ApiProperty({ example: 'Producción de petróleo y gas por pozo' }) dataset!: string;
  @ApiProperty({ example: 'CC-BY-4.0' }) license!: string;
  @ApiProperty({ example: '2026-04-01', nullable: true }) latest_month!: string | null;
  @ApiProperty({ example: '2026-01-01', nullable: true }) earliest_month!: string | null;
  @ApiProperty({ type: DataFreshnessTablesDto }) tables!: DataFreshnessTablesDto;
}

export class HealthDto {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ example: 'petroldata-api' }) service!: string;
}
