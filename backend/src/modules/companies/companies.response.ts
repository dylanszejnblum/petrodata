import { ApiProperty } from '@nestjs/swagger';

export class CompanyListItemDto {
  @ApiProperty({ example: 'cnea' }) slug!: string;
  @ApiProperty({ example: 'CNEA' }) name!: string;
  @ApiProperty({ example: 'Argentina', nullable: true }) origin_country!: string | null;
  @ApiProperty({ example: 8 }) project_count!: number;
  @ApiProperty({ type: [String], example: ['Uranio'] }) commodities!: string[];
  @ApiProperty({ example: null, nullable: true, description: 'Always null — logos are not scraped; the frontend renders first-letter avatars.' })
  image_url!: string | null;
}

export class CoordinatesDto {
  @ApiProperty({ example: -43.37, nullable: true }) lat!: number | null;
  @ApiProperty({ example: -68.688, nullable: true }) lng!: number | null;
}

export class CompanyProjectDto {
  @ApiProperty({ example: 'Cerro Solo' }) name!: string;
  @ApiProperty({ example: 'Uranio' }) commodity!: string;
  @ApiProperty({ example: 'Chubut', nullable: true }) province!: string | null;
  @ApiProperty({ example: 'Exploración avanzada', nullable: true }) status!: string | null;
  @ApiProperty({ type: CoordinatesDto }) coordinates!: CoordinatesDto;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
    example: { m_and_i_Ag_kOz: 198643, m_and_i_Au_kOz: 1715 },
    description: 'Headline resource figures keyed by category+unit, or null when the source has no resource table.',
  })
  resources_summary!: Record<string, number> | null;
}

export class TimelineStageDto {
  @ApiProperty({ example: 'Exploración avanzada' }) stage!: string;
  @ApiProperty({ example: null, nullable: true, description: 'Source data has no stage dates; always null for now.' })
  date!: string | null;
}

export class CompanyDetailDto {
  @ApiProperty({ example: 'CNEA' }) name!: string;
  @ApiProperty({ example: 'cnea' }) slug!: string;
  @ApiProperty({ example: 'Argentina', nullable: true }) origin_country!: string | null;
  @ApiProperty({ example: null, nullable: true }) description!: string | null;
  @ApiProperty({ type: [CompanyProjectDto] }) projects!: CompanyProjectDto[];
  @ApiProperty({ example: 8 }) total_projects!: number;
  @ApiProperty({ type: [String], example: ['Uranio'] }) commodities_involved!: string[];
  @ApiProperty({ type: [String], example: ['Chubut', 'Salta'] }) provinces!: string[];
  @ApiProperty({ type: [TimelineStageDto] }) project_timeline!: TimelineStageDto[];
}
