import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class VotarDto {
  @ApiProperty({ enum: [1, -1], example: 1, description: '+1 sube, -1 baja. No hay otro valor.' })
  @IsIn([1, -1])
  value!: 1 | -1;

  @ApiPropertyOptional({
    description:
      'Token de Cloudflare Turnstile. Obligatorio sólo si el servidor tiene TURNSTILE_SECRET.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstile_token?: string;
}
