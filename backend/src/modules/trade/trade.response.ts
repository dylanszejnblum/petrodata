import { ApiProperty } from '@nestjs/swagger';

export class EnergyBalancePointDto {
  @ApiProperty({ example: 2016 }) ano!: number;
  @ApiProperty({ example: 'Petroleo' }) energy_type!: string;
  @ApiProperty({ example: 'Oferta' }) concepto!: string;
  @ApiProperty({ example: 28453.7, description: 'kTEP (thousand tons of oil equivalent).' }) ktep!: number;
}
