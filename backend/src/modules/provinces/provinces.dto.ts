import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListProvincesQueryDto {
  @ApiPropertyOptional({ example: 'Uranio', description: 'Only provinces with at least one project of this commodity (case-insensitive).' })
  @IsOptional() @IsString() commodity?: string;
}
