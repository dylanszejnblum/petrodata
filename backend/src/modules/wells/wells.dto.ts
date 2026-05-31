import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class ListWellsQueryDto {
  @ApiPropertyOptional({ example: 'ypf', description: 'Filter by operator slug.' })
  @IsOptional() @IsString() operator?: string;

  @ApiPropertyOptional({ example: 'vaca_muerta', description: 'Filter by formation slug.' })
  @IsOptional() @IsString() formation?: string;

  @ApiPropertyOptional({ example: 'NEUQUINA', description: 'Filter by basin (matches CSV exactly).' })
  @IsOptional() @IsString() basin?: string;

  @ApiPropertyOptional({ example: 'Neuquén', description: 'Filter by province.' })
  @IsOptional() @IsString() province?: string;

  @ApiPropertyOptional({ example: 'BANDURRIA SUR', description: 'Filter by concession (matches CSV exactly).' })
  @IsOptional() @IsString() concession?: string;

  @ApiPropertyOptional({
    example: 'BAN',
    description: 'Case-insensitive substring search on `sigla` (well name).',
  })
  @IsOptional() @IsString() search?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 500, default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number = 50;
}

export class WellProductionQueryDto {
  @ApiPropertyOptional({ example: '2026-01' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-04' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}(-\d{2})?$/)
  to?: string;
}
