import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** A pipeline Document (news_schema.py shape). Stored as-is; validated in the service. */
export type NewsDocumentInput = Record<string, unknown>;

export class IngestNewsBodyDto {
  @ApiProperty({
    description: 'Array of pipeline Documents to upsert (keyed on doc_id).',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @ArrayMaxSize(500) // cap batch size; the pipeline sends far fewer per POST
  documents: NewsDocumentInput[];
}

export class ListNewsQueryDto {
  @ApiPropertyOptional({
    description: 'Legacy alias for pageSize (max rows, ≤200).',
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @ApiPropertyOptional({ description: 'Filter by source_family, e.g. "regulatoria"' })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiPropertyOptional({ description: 'Filter by topic tag, e.g. "GNL"' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity (company or regulator), e.g. "YPF"',
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Filter by region, e.g. "Neuquén"' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Free-text search over title + deck' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Lower bound on publishedAt (ISO date/datetime, inclusive)',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Upper bound on publishedAt (ISO date/datetime, inclusive)',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['importance', 'recent'],
    default: 'importance',
  })
  @IsOptional()
  @IsIn(['importance', 'recent'])
  sort?: 'importance' | 'recent';

  @ApiPropertyOptional({ description: '1-based page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Rows per page (≤200)', default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}
