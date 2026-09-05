import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class VotarDto {
  @ApiProperty({ enum: [1, -1], example: 1, description: '+1 sube, -1 baja. No hay otro valor.' })
  @IsIn([1, -1])
  value!: 1 | -1;
}
