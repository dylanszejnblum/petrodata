import { ApiProperty } from '@nestjs/swagger';

export class ProductionFactDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '2026-04-01' }) date_month!: string;
  @ApiProperty({ example: '111979' }) well_id!: string;
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'vaca_muerta' }) formation_slug!: string;
  @ApiProperty({ example: 'BAJO DEL TORO NORTE' }) concession!: string;
  @ApiProperty({ example: 'BAJO DEL TORO NORTE' }) yacimiento!: string;
  @ApiProperty({ example: 'NEUQUINA' }) basin!: string;
  @ApiProperty({ example: 'Neuquén' }) province!: string;
  @ApiProperty({ example: 'Petrolífero' }) well_type!: string;
  @ApiProperty({ example: 'Bombeo Mecánico' }) extraction_type!: string;
  @ApiProperty({ example: 'En Producción Efectiva' }) status_code!: string;
  @ApiProperty({ example: 'NO CONVENCIONAL' }) tipo_recurso!: string;
  @ApiProperty({ example: 2500.0, nullable: true }) depth_m!: number | null;
  @ApiProperty({ example: -69.36352, nullable: true }) coord_x!: number | null;
  @ApiProperty({ example: -37.40809, nullable: true }) coord_y!: number | null;
  @ApiProperty({ example: 12006.85 }) oil_m3!: number;
  @ApiProperty({ example: 680.86 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 75520.9 }) oil_bbl!: number;
  @ApiProperty({ example: 2517.3 }) oil_bbl_d!: number;
  @ApiProperty({ example: 75520.9 }) oil_boe!: number;
  @ApiProperty({ example: 0.02 }) gas_mm3_d!: number;
  @ApiProperty({ example: 24044.34 }) gas_mcf!: number;
  @ApiProperty({ example: 0.8 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 24838.3 }) gas_boe!: number;
  @ApiProperty({ example: 100359.2 }) boe!: number;
  @ApiProperty({ example: true }) formation_vaca_muerta!: boolean;
  @ApiProperty({ example: true }) unconventional!: boolean;
  @ApiProperty({ example: true }) vm_combined!: boolean;
}

export class GroupedProductionRowDto {
  @ApiProperty({ example: '2026-04-01' }) date_month!: string;

  @ApiProperty({
    example: 'ypf',
    description: 'The group key. Field name varies with `group_by`: `operator`, `concession`, `formation`, or `province`.',
  })
  operator?: string;

  @ApiProperty({ example: 1478788.97 }) oil_m3!: number;
  @ApiProperty({ example: 9301301.71 }) oil_bbl!: number;
  @ApiProperty({ example: 310043.31 }) oil_bbl_d!: number;
  @ApiProperty({ example: 690500.26 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 23.01 }) gas_mm3_d!: number;
  @ApiProperty({ example: 24384809.66 }) gas_mcf!: number;
  @ApiProperty({ example: 812.82 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 34491371.36 }) boe!: number;
  @ApiProperty({ example: 2465 }) active_wells!: number;
}

export class VmShareDto {
  @ApiProperty({ example: 0.6848 }) oil!: number;
  @ApiProperty({ example: 0.6649 }) gas!: number;
  @ApiProperty({ example: 0.6678 }) boe!: number;
}

export class TopOperatorDto {
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'YPF S.A.' }) operator_name!: string;
  @ApiProperty({ example: 1757724.93 }) oil_m3!: number;
  @ApiProperty({ example: 870517.38 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 42813011.69 }) boe!: number;
}

export class LatestSummaryDto {
  @ApiProperty({ example: '2026-04-01', nullable: true }) date_month!: string | null;
  @ApiProperty({ example: 3962125.07 }) oil_m3!: number;
  @ApiProperty({ example: 830700.44 }) oil_bbl_d!: number;
  @ApiProperty({ example: 4049482.51 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 4766.88 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 172649772.14 }) boe!: number;
  @ApiProperty({ example: 22561 }) active_wells!: number;
  @ApiProperty({ type: VmShareDto }) vm_share!: VmShareDto;
  @ApiProperty({ type: [TopOperatorDto] }) top_operators!: TopOperatorDto[];
}
