import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class FxQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Inclusive start (YYYY-MM-DD).' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({ example: '2026-05-29' })
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}
