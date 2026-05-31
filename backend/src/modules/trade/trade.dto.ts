import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class EnergyBalanceQueryDto {
  @ApiPropertyOptional({ example: 'Petroleo', description: 'Energy form (forma_de_energia). Case-insensitive exact match.' })
  @IsOptional() @IsString() energy_type?: string;

  @ApiPropertyOptional({ example: 'Oferta', description: 'Concept: Oferta, Consumo, or Transformacion. Case-insensitive exact match.' })
  @IsOptional() @IsString() concepto?: string;

  @ApiPropertyOptional({ example: 2010, description: 'Inclusive start year.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(9999)
  from?: number;

  @ApiPropertyOptional({ example: 2016, description: 'Inclusive end year.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(9999)
  to?: number;
}
