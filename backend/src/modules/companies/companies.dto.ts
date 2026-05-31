import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListCompaniesQueryDto {
  @ApiPropertyOptional({ example: 'cnea', description: 'Case-insensitive substring search across company name.' })
  @IsOptional() @IsString() q?: string;

  @ApiPropertyOptional({ example: 'Uranio', description: 'Only companies with at least one project of this commodity (case-insensitive).' })
  @IsOptional() @IsString() commodity?: string;

  @ApiPropertyOptional({ example: 'Canadá', description: 'Filter by origin country (case-insensitive exact match).' })
  @IsOptional() @IsString() origin_country?: string;
}
