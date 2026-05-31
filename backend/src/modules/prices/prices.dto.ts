import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CommoditySeriesQueryDto {
  @ApiPropertyOptional({ example: '2025-06', description: 'Inclusive start (YYYY-MM or YYYY-MM-DD).' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-05' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/)
  to?: string;
}

export class FuelPricesQueryDto {
  @ApiPropertyOptional({ example: 'NEUQUEN', description: 'Province name (case-insensitive exact match).' })
  @IsOptional() @IsString() provincia?: string;

  @ApiPropertyOptional({ example: 'Nafta Premium', description: 'Product label (case-insensitive exact match).' })
  @IsOptional() @IsString() producto?: string;

  @ApiPropertyOptional({ example: 'YPF', description: 'Bandera (brand) — case-insensitive exact match.' })
  @IsOptional() @IsString() bandera?: string;

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Inclusive lower bound on fecha_vigencia.' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 100, minimum: 1, maximum: 1000, default: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  limit?: number = 100;
}

export function parseDateInput(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  const parts = v.split('-').map(Number);
  if (parts.length === 2) return new Date(Date.UTC(parts[0], parts[1] - 1, 1));
  if (parts.length === 3) return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return undefined;
}
