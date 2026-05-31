import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export const SORT_VALUES = ['oil_m3', 'gas_thousand_m3', 'boe', 'active_wells'] as const;
export type OperatorSort = (typeof SORT_VALUES)[number];

export class ListOperatorsQueryDto {
  @ApiPropertyOptional({
    enum: SORT_VALUES,
    default: 'boe',
    description: 'Sort key for the latest-month totals.',
  })
  @IsOptional() @IsIn(SORT_VALUES as unknown as string[])
  sort?: OperatorSort = 'boe';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}

export class OperatorProductionQueryDto {
  @ApiPropertyOptional({ example: '2026-01', description: 'Inclusive lower bound (YYYY-MM or YYYY-MM-DD).' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-04', description: 'Inclusive upper bound (YYYY-MM or YYYY-MM-DD).' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/)
  to?: string;
}
