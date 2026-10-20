import { ApiProperty } from '@nestjs/swagger';

export class FxPointDto {
  @ApiProperty({ example: '2026-05-29' }) date!: string;
  @ApiProperty({ example: 1432.0, nullable: true }) oficial_sell!: number | null;
  @ApiProperty({ example: 1380.0, nullable: true }) oficial_buy!: number | null;
  @ApiProperty({ example: 1430.0, nullable: true }) blue_sell!: number | null;
  @ApiProperty({ example: 1410.0, nullable: true }) blue_buy!: number | null;
}

export class FxLatestDto {
  @ApiProperty({ example: '2026-05-29' }) date!: string;
  @ApiProperty({ example: 1432.0, nullable: true }) oficial_sell!: number | null;
  @ApiProperty({ example: 1380.0, nullable: true }) oficial_buy!: number | null;
  @ApiProperty({ example: 1430.0, nullable: true }) blue_sell!: number | null;
  @ApiProperty({ example: 1410.0, nullable: true }) blue_buy!: number | null;
}

export class RigCountPointDto {
  @ApiProperty({ example: '2026-04' }) date!: string;
  @ApiProperty({ example: 38, nullable: true }) oil_rigs!: number | null;
  @ApiProperty({ example: 14, nullable: true }) gas_rigs!: number | null;
  @ApiProperty({ example: 52, nullable: true }) total_rigs!: number | null;
}

export class WellsDrillingPointDto {
  @ApiProperty({ example: '2026-09' }) date!: string;
  @ApiProperty({ example: 106, description: 'Wells in drilling that month (sum of the provinces returned).' }) total!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, example: { 'Neuquén': 78, Chubut: 22, 'Santa Cruz': 5 } })
  by_province!: Record<string, number>;
}
