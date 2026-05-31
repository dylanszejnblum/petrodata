import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class GeoWellsQueryDto {
  @ApiPropertyOptional({ example: 'ypf' })
  @IsOptional() @IsString() operator?: string;

  @ApiPropertyOptional({ example: 'vaca_muerta' })
  @IsOptional() @IsString() formation?: string;

  @ApiPropertyOptional({ example: 'NEUQUINA' })
  @IsOptional() @IsString() basin?: string;

  @ApiPropertyOptional({ example: 'Neuquén' })
  @IsOptional() @IsString() province?: string;

  @ApiPropertyOptional({
    example: '-70,-39,-68,-37',
    description: 'Bounding box `west,south,east,north` in WGS84 decimal degrees. Use for viewport-based loading.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/, { message: 'bbox must be "west,south,east,north"' })
  bbox?: string;

  @ApiPropertyOptional({ example: 1000, minimum: 1, maximum: 1000, default: 1000 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  limit?: number = 1000;
}

export function parseBbox(bbox?: string): { west: number; south: number; east: number; north: number } | null {
  if (!bbox) return null;
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [west, south, east, north] = parts;
  return { west, south, east, north };
}
