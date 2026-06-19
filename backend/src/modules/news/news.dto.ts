import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** A pipeline Document (news_schema.py shape). Stored as-is; validated in the service. */
export type NewsDocumentInput = Record<string, unknown>;

export class IngestNewsBodyDto {
  @ApiProperty({
    description: 'Array of pipeline Documents to upsert (keyed on doc_id).',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  documents: NewsDocumentInput[];
}

export class ListNewsQueryDto {
  @ApiPropertyOptional({ description: 'Max rows (≤200)', default: 50 })
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
}
