import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const PROJECT_SORT_FIELDS = [
  'project_name',
  'primary_commodity',
  'status',
  'province',
] as const;

export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ example: 'Silver', description: 'Filter by primary commodity (case-insensitive exact match).' })
  @IsOptional() @IsString() commodity?: string;

  @ApiPropertyOptional({ example: 'Feasibility', description: 'Filter by project status (case-insensitive exact match).' })
  @IsOptional() @IsString() status?: string;

  @ApiPropertyOptional({ example: 'Salta', description: 'Filter by province (case-insensitive exact match).' })
  @IsOptional() @IsString() province?: string;

  @ApiPropertyOptional({ example: 'Diabl', description: 'Case-insensitive substring search across project_name, operator, province.' })
  @IsOptional() @IsString() q?: string;

  @ApiPropertyOptional({ enum: PROJECT_SORT_FIELDS, default: 'project_name' })
  @IsOptional() @IsIn(PROJECT_SORT_FIELDS as unknown as string[])
  sort?: ProjectSortField = 'project_name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional() @IsIn(['asc', 'desc'])
  order?: SortOrder = 'asc';

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 500, default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number = 50;
}

export class CommodityProjectsQueryDto {
  @ApiPropertyOptional({ example: 'Operation' })
  @IsOptional() @IsString() status?: string;

  @ApiPropertyOptional({ example: 'Salta' })
  @IsOptional() @IsString() province?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'If true, only include projects that have at least one resource entry.',
  })
  @IsOptional()
  @Type(() => Boolean)
  min_resources?: boolean;
}

export class MapQueryDto {
  @ApiPropertyOptional({ example: 'Silver' })
  @IsOptional() @IsString() commodity?: string;

  @ApiPropertyOptional({ example: 'Feasibility' })
  @IsOptional() @IsString() status?: string;

  @ApiPropertyOptional({ example: 'Salta' })
  @IsOptional() @IsString() province?: string;
}
