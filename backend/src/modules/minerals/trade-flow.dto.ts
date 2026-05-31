import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TradeFlowQueryDto {
  @ApiPropertyOptional({ example: 'Uranio', default: 'Uranio', description: 'Commodity name. Currently only uranium trade data is available; other minerals return empty flows.' })
  @IsOptional() @IsString() mineral?: string = 'Uranio';

  @ApiPropertyOptional({ example: 2024, description: 'Filter the flow to a single year. Omit to aggregate across all available years.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100)
  year?: number;
}
