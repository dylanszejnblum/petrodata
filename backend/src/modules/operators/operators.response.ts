import { ApiProperty } from '@nestjs/swagger';

export class OperatorListItemDto {
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'YPF S.A.' }) operator_name!: string;
  @ApiProperty({ example: '2026-04-01' }) latest_month!: string;
  @ApiProperty({ example: 1848981.5 }) oil_m3!: number;
  @ApiProperty({ example: 387657.95 }) oil_bbl_d!: number;
  @ApiProperty({ example: 888132.1 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 1045.49 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 44029598.96 }) boe!: number;
  @ApiProperty({ example: 15290 }) active_wells!: number;

  @ApiProperty({
    example: 0.811,
    description: 'Share of total BOE in the latest month coming from Vaca Muerta wells.',
  })
  vm_share_boe!: number;
}

export class OperatorLatestDto {
  @ApiProperty({ example: 1757724.93 }) oil_m3!: number;
  @ApiProperty({ example: 368525.06 }) oil_bbl_d!: number;
  @ApiProperty({ example: 870517.38 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 1024.74 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 42813011.69 }) boe!: number;
  @ApiProperty({ example: 5044 }) active_wells!: number;
}

export class OperatorYtdDto {
  @ApiProperty({ example: 2026 }) year!: number;
  @ApiProperty({ example: 7217666.24 }) oil_m3!: number;
  @ApiProperty({ example: 45397749.4 }) oil_bbl!: number;
  @ApiProperty({ example: 3520367.61 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 124320726.67 }) gas_mcf!: number;
  @ApiProperty({ example: 173823921.59 }) boe!: number;
}

export class OperatorDetailDto {
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'YPF S.A.' }) operator_name!: string;
  @ApiProperty({ example: ['YPF S.A.'], type: [String] }) aliases!: string[];
  @ApiProperty({ example: '2026-04-01', nullable: true }) latest_month!: string | null;
  @ApiProperty({ example: 1, nullable: true }) latest_month_rank!: number | null;
  @ApiProperty({ type: OperatorLatestDto, nullable: true }) latest!: OperatorLatestDto | null;
  @ApiProperty({ type: OperatorYtdDto }) ytd!: OperatorYtdDto;
}

export class OperatorTimeSeriesPointDto {
  @ApiProperty({ example: '2026-01-01' }) date_month!: string;
  @ApiProperty({ example: 1927666.93 }) oil_m3!: number;
  @ApiProperty({ example: 404155.15 }) oil_bbl_d!: number;
  @ApiProperty({ example: 836299.35 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 984.46 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 42633610.05 }) boe!: number;
  @ApiProperty({ example: 5087 }) active_wells!: number;
}
