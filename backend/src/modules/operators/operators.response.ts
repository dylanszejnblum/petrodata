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

export class ContributionWindowDto {
  @ApiProperty({ example: '2025-05-01' }) from!: string;
  @ApiProperty({ example: '2026-04-01' }) to!: string;
  @ApiProperty({ example: 12 }) months!: number;
}

export class ContributionAssumptionsDto {
  @ApiProperty({ example: 72.4, nullable: true, type: 'number' }) brent_avg_usd_bbl!: number | null;
  @ApiProperty({ example: 5 }) oil_discount_usd_bbl!: number;
  @ApiProperty({ example: 3.1, nullable: true, type: 'number' }) gas_pist_avg_usd_mmbtu!: number | null;
  @ApiProperty({ example: 1.037 }) mcf_to_mmbtu!: number;
  @ApiProperty({ example: 0.12 }) royalty_rate!: number;
}

export class ContributionTotalsDto {
  @ApiProperty({ example: 265386496.4 }) oil_bbl!: number;
  @ApiProperty({ example: 2001528276.9 }) gas_mcf!: number;
  @ApiProperty({ example: 611974108.9 }) boe!: number;
  @ApiProperty({ example: 24310098765.4 }) gross_value_usd!: number;
  @ApiProperty({ example: 24310098765.4 }) gross_value_annualized_usd!: number;
  @ApiProperty({ example: 2917211851.8 }) royalties_usd!: number;
  @ApiProperty({ example: 10874000000, nullable: true, type: 'number' }) energy_exports_usd!: number | null;
  @ApiProperty({ example: 645511218799, nullable: true, type: 'number' }) gdp_usd!: number | null;
  @ApiProperty({ example: 2025, nullable: true, type: 'number' }) gdp_year!: number | null;
  @ApiProperty({ example: 0.0377, nullable: true, type: 'number' }) value_share_of_gdp!: number | null;
}

export class OperatorContributionItemDto {
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ example: 'YPF S.A.' }) operator_name!: string;
  @ApiProperty({ example: 132693248.2 }) oil_bbl!: number;
  @ApiProperty({ example: 500382069.2 }) gas_mcf!: number;
  @ApiProperty({ example: 219371053.4 }) boe!: number;
  @ApiProperty({ example: 0.358, description: 'Share of national BOE in the window.' }) share_boe!: number;
  @ApiProperty({ example: 0.5 }) share_oil!: number;
  @ApiProperty({ example: 0.25 }) share_gas!: number;
  @ApiProperty({ example: 8944000000 }) oil_value_usd!: number;
  @ApiProperty({ example: 1609000000 }) gas_value_usd!: number;
  @ApiProperty({ example: 10553000000 }) gross_value_usd!: number;
  @ApiProperty({ example: 10553000000 }) gross_value_annualized_usd!: number;
  @ApiProperty({ example: 3897000000, nullable: true, type: 'number', description: 'Energy exports × BOE share.' })
  attributed_exports_usd!: number | null;
  @ApiProperty({ example: 1266360000, description: 'Statutory 12% of gross wellhead value.' })
  royalties_usd!: number;
  @ApiProperty({ example: 0.0163, nullable: true, type: 'number', description: 'Annualized gross value / GDP.' })
  value_share_of_gdp!: number | null;
}

export class OperatorContributionDto {
  @ApiProperty({ type: ContributionWindowDto }) window!: ContributionWindowDto;
  @ApiProperty({ type: ContributionTotalsDto }) totals!: ContributionTotalsDto;
  @ApiProperty({ type: ContributionAssumptionsDto }) assumptions!: ContributionAssumptionsDto;
  @ApiProperty({ type: [OperatorContributionItemDto] }) operators!: OperatorContributionItemDto[];
}

export class OperatorTimeSeriesPointDto {
  @ApiProperty({ example: '2026-01-01' }) date_month!: string;
  @ApiProperty({ example: 1927666.93 }) oil_m3!: number;
  @ApiProperty({ example: 404155.15 }) oil_bbl_d!: number;
  @ApiProperty({ example: 836299.35 }) gas_thousand_m3!: number;
  @ApiProperty({ example: 984.46 }) gas_mmcf_d!: number;
  @ApiProperty({ example: 42633610.05 }) boe!: number;
  @ApiProperty({ example: 5087 }) active_wells!: number;
  @ApiProperty({ example: false, description: 'true = month still being filed by operators; totals will rise. See /data-freshness latest_complete_month.' })
  preliminary!: boolean;
}

export class OperatorSeriesDto {
  @ApiProperty({ example: 'ypf' }) operator_slug!: string;
  @ApiProperty({ type: [OperatorTimeSeriesPointDto] }) points!: OperatorTimeSeriesPointDto[];
}
