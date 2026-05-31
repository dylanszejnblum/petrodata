import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const GROUP_BY_VALUES = ['operator', 'concession', 'formation', 'province'] as const;
export type GroupBy = (typeof GROUP_BY_VALUES)[number];

export class MonthlyQueryDto {
  @ApiPropertyOptional({ example: 'ypf', description: 'Filter by operator slug (see /operators for valid values).' })
  @IsOptional() @IsString()
  operator?: string;

  @ApiPropertyOptional({ example: 'vaca_muerta', description: 'Filter by formation slug.' })
  @IsOptional() @IsString()
  formation?: string;

  @ApiPropertyOptional({ example: 'Neuquén', description: 'Filter by province name (matches CSV exactly, e.g. "Neuquén").' })
  @IsOptional() @IsString()
  province?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Restrict to Vaca Muerta production (`vm_combined` = formation + unconventional + sub-tipo). Use "true" or "false".',
    enum: ['true', 'false'],
  })
  @IsOptional() @IsBooleanString()
  vm?: string;

  @ApiPropertyOptional({
    example: '2026-01',
    description: 'Inclusive lower bound for `date_month` (YYYY-MM or YYYY-MM-DD).',
  })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/, { message: 'from must be YYYY-MM or YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-04',
    description: 'Inclusive upper bound for `date_month` (YYYY-MM or YYYY-MM-DD).',
  })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/, { message: 'to must be YYYY-MM or YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({
    description: 'Aggregate on the fly instead of returning per-well rows. The grouped result includes oil/gas totals, BOE, and `active_wells`.',
    enum: GROUP_BY_VALUES,
  })
  @IsOptional() @IsIn(GROUP_BY_VALUES as unknown as string[])
  group_by?: GroupBy;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 500, default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number = 50;
}

export function parseMonthInput(v?: string): Date | undefined {
  if (!v) return undefined;
  const s = v.length === 7 ? `${v}-01` : v;
  const d = new Date(s + 'T00:00:00.000Z');
  return isNaN(d.getTime()) ? undefined : d;
}

export function parseVmFlag(v?: string): boolean | undefined {
  if (v === undefined || v === '') return undefined;
  return v === 'true' || v === '1';
}
