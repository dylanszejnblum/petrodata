import { ApiProperty } from '@nestjs/swagger';

export class WellDto {
  @ApiProperty({ example: '93863' }) well_id!: string;
  @ApiProperty({ example: 'ACB.a-402' }) sigla!: string;
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'YPF S.A.' }) operator_name!: string;
  @ApiProperty({ example: 'grupo_chubut' }) formation_slug!: string;
  @ApiProperty({ example: 'Chubut' }) province!: string;
  @ApiProperty({ example: 'GOLFO SAN JORGE' }) basin!: string;
  @ApiProperty({ example: 'MANANTIALES BEHR' }) concession!: string;
  @ApiProperty({ example: 'MANANTIALES BEHR' }) yacimiento!: string;
  @ApiProperty({ example: 'Petrolífero' }) well_type!: string;
  @ApiProperty({ example: 'Bombeo Mecánico' }) extraction_type!: string;
  @ApiProperty({ example: 'En Producción Efectiva' }) status_code!: string;
  @ApiProperty({ example: 'CONVENCIONAL' }) resource_type!: string;
  @ApiProperty({ example: 'No informado' }) sub_resource_type!: string;
  @ApiProperty({ example: 2300, nullable: true }) depth_m!: number | null;
  @ApiProperty({ example: -45.62363321, nullable: true }) latitude!: number | null;
  @ApiProperty({ example: -67.8618809, nullable: true }) longitude!: number | null;
}

export class WellLatestProductionDto {
  @ApiProperty({ example: '2026-04-01' }) date_month!: string;
  @ApiProperty({ example: 152.45 }) oil_m3!: number;
  @ApiProperty({ example: 31.95 }) oil_bbl_d!: number;
  @ApiProperty({ example: 84.32 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 0.099 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 1212.7 }) boe!: number;
  @ApiProperty({ example: true }) vm_combined!: boolean;
}

export class WellDetailDto extends WellDto {
  @ApiProperty({ type: WellLatestProductionDto, nullable: true })
  latest_production!: WellLatestProductionDto | null;
}

export class WellTimeSeriesPointDto {
  @ApiProperty({ example: '2026-01-01' }) date_month!: string;
  @ApiProperty({ example: 152.45 }) oil_m3!: number;
  @ApiProperty({ example: 958.91 }) oil_bbl!: number;
  @ApiProperty({ example: 31.95 }) oil_bbl_d!: number;
  @ApiProperty({ example: 84.32 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 0.0028 }) gas_mm3_d!: number;
  @ApiProperty({ example: 0.099 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 1212.7 }) boe!: number;
  @ApiProperty({ example: true }) vm_combined!: boolean;
}
