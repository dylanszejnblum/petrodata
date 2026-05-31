import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty({ example: 'Secretaría de Energía / datos.energia.gob.ar' })
  source!: string;

  @ApiProperty({ example: 'Producción de petróleo y gas por pozo' })
  dataset!: string;

  @ApiProperty({ example: 'CC-BY-4.0' })
  license!: string;

  @ApiProperty({ example: '2026-04-01', nullable: true })
  last_source_update!: string | null;

  @ApiProperty({ example: '2026-05-27T14:30:00.000Z' })
  last_ingested_at!: string;

  @ApiProperty({ example: 'formation + unconventional + sub-tipo' })
  vaca_muerta_filter!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 50 }) limit!: number;
  @ApiProperty({ example: 1000 }) total!: number;
}

export class ApiErrorPayloadDto {
  @ApiProperty({ example: 'NOT_FOUND' }) code!: string;
  @ApiProperty({ example: 'Well not found: 99999' }) message!: string;
}

export class ApiErrorDto {
  @ApiProperty({ type: ApiErrorPayloadDto })
  error!: ApiErrorPayloadDto;
}

interface EnvelopeOpts {
  isArray?: boolean;
  paginated?: boolean;
  description?: string;
}

/**
 * Wraps a payload class in the standard `{ data, meta, pagination? }` envelope
 * and registers it as the 200 response schema.
 */
export function ApiOkEnvelope<T extends Type<unknown>>(model: T, opts: EnvelopeOpts = {}) {
  const dataSchema = opts.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  const properties: Record<string, any> = {
    data: dataSchema,
    meta: { $ref: getSchemaPath(MetaDto) },
  };
  const required = ['data', 'meta'];
  if (opts.paginated) {
    properties.pagination = { $ref: getSchemaPath(PaginationMetaDto) };
    required.push('pagination');
  }

  return applyDecorators(
    ApiExtraModels(MetaDto, PaginationMetaDto, model),
    ApiOkResponse({
      description: opts.description,
      schema: {
        type: 'object',
        properties,
        required,
      },
    }),
  );
}
