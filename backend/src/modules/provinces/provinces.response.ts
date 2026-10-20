import { ApiProperty } from '@nestjs/swagger';

export class ProvinceListItemDto {
  @ApiProperty({ example: 'chubut' }) slug!: string;
  @ApiProperty({ example: 'Chubut' }) name!: string;
  @ApiProperty({ example: 'CT', nullable: true }) iso_code!: string | null;
  @ApiProperty({ example: 6714 }) oil_gas_wells!: number;
  @ApiProperty({ example: 8 }) mining_projects!: number;
  @ApiProperty({ example: 6722 }) combined_project_count!: number;
  @ApiProperty({ type: [String], example: ['Uranio'] }) commodities!: string[];
  @ApiProperty({ example: true }) has_oil_gas!: boolean;
  @ApiProperty({ example: true }) has_mining!: boolean;
}

export class ProvinceTopOperatorDto {
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'YPF S.A.' }) operator_name!: string;
  @ApiProperty({ example: 12345.6 }) boe!: number;
}

export class ProvinceOilGasDto {
  @ApiProperty({ example: 245678.9 }) production_oil_bbl_d!: number;
  @ApiProperty({ example: 1234.5 }) production_gas_mmcf_d!: number;
  @ApiProperty({ example: 6714 }) active_wells!: number;
  @ApiProperty({ example: 0.42, description: 'Share of BOE from Vaca Muerta (0–1).' }) vm_pct!: number;
  @ApiProperty({ type: [ProvinceTopOperatorDto] }) top_operators!: ProvinceTopOperatorDto[];
  @ApiProperty({ example: '2026-03-01', nullable: true }) latest_month!: string | null;
}

class ProvinceControllerDto {
  @ApiProperty({ example: 'CNEA' }) name!: string;
  @ApiProperty({ example: 'cnea' }) slug!: string;
  @ApiProperty({ example: 'Argentina', nullable: true }) origin_country!: string | null;
  @ApiProperty({ example: '1.0', nullable: true }) ownership_pct!: string | null;
}

class ProvinceMiningProjectDto {
  @ApiProperty({ example: 'Cerro Solo' }) name!: string;
  @ApiProperty({ example: 'Uranio' }) commodity!: string;
  @ApiProperty({ example: 'Exploración avanzada', nullable: true }) status!: string | null;
  @ApiProperty({ type: [ProvinceControllerDto] }) controllers!: ProvinceControllerDto[];
  @ApiProperty({ type: 'object', additionalProperties: false, example: { lat: -43.37, lng: -68.688 } })
  coordinates!: { lat: number | null; lng: number | null };
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, nullable: true })
  resources_summary!: Record<string, number> | null;
}

export class ProvinceMiningDto {
  @ApiProperty({ example: 8 }) project_count!: number;
  @ApiProperty({ type: [String], example: ['Uranio'] }) commodities!: string[];
  @ApiProperty({ type: [String], example: ['CNEA', 'Jaguar Uranium Corp.'] }) controllers!: string[];
  @ApiProperty({ type: [ProvinceMiningProjectDto] }) projects!: ProvinceMiningProjectDto[];
}

export class ProvinceExportRowDto {
  @ApiProperty({ example: 'petróleo' }) sector!: string;
  @ApiProperty({ example: 'Petróleo crudo' }) product!: string;
  @ApiProperty({ example: 781080206 }) value_annual_usd!: number;
}

export class ProvinceDetailDto {
  @ApiProperty({ example: 'Chubut' }) name!: string;
  @ApiProperty({ example: 'chubut' }) slug!: string;
  @ApiProperty({ example: 'CT', nullable: true }) iso_code!: string | null;
  @ApiProperty({ type: ProvinceOilGasDto, nullable: true }) oil_gas!: ProvinceOilGasDto | null;
  @ApiProperty({ type: ProvinceMiningDto, nullable: true }) mining!: ProvinceMiningDto | null;
  @ApiProperty({ type: [ProvinceExportRowDto] }) exports!: ProvinceExportRowDto[];
  @ApiProperty({ example: 6722 }) combined_project_count!: number;
}

export class ProvinceProductionPointDto {
  @ApiProperty({ example: '2026-03-01' }) date_month!: string;
  @ApiProperty({ example: 245678.9 }) oil_bbl_d!: number;
  @ApiProperty({ example: 1234.5 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 123456.7 }) oil_m3!: number;
  @ApiProperty({ example: 98765.4 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 567890.1 }) boe!: number;
  @ApiProperty({ example: 6714 }) active_wells!: number;
  @ApiProperty({ example: false, description: 'true = month still being filed by operators; totals will rise. See /data-freshness latest_complete_month.' })
  preliminary!: boolean;
}

export class ProvinceExportSummaryRowDto {
  @ApiProperty({ example: 'chubut' }) slug!: string;
  @ApiProperty({ example: 'Chubut' }) name!: string;
  @ApiProperty({ example: 822502694 }) total_export_usd!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, example: { 'petróleo': 781080206, gas: 41422488 } })
  by_sector!: Record<string, number>;
}

export class ProvinceExportSummaryDto {
  @ApiProperty({ type: [ProvinceExportSummaryRowDto] }) provinces!: ProvinceExportSummaryRowDto[];
  @ApiProperty({ example: 17050000000 }) national_total_usd!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, example: { 'petróleo': 8500000000, gas: 3200000000 } })
  national_by_sector!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'How these figures were built. They are an ESTIMATE over production, not recorded exports (`publishable: false`).',
    example: { kind: 'estimate', computed_at: '2026-05-31', publishable: false },
  })
  estimate!: Record<string, unknown>;
}
