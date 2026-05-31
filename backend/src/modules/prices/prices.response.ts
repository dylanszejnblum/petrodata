import { ApiProperty } from '@nestjs/swagger';

export class CommodityLatestDto {
  @ApiProperty({ example: 'gold' }) commodity!: string;
  @ApiProperty({ example: 'Gold' }) name!: string;
  @ApiProperty({ example: 'USD/troy oz' }) unit!: string;
  @ApiProperty({ example: 4569.9, nullable: true }) latest!: number | null;
  @ApiProperty({ example: '2026-05', nullable: true }) latest_date!: string | null;
}

export class CommoditySeriesPointDto {
  @ApiProperty({ example: '2025-06' }) date!: string;
  @ApiProperty({ example: 3890.0 }) value!: number;
}

export class EnergyLatestDto {
  @ApiProperty({ example: 'brent' }) series!: string;
  @ApiProperty({ example: 'Brent Crude' }) name!: string;
  @ApiProperty({ example: 'USD/bbl' }) unit!: string;
  @ApiProperty({ example: 78.5, nullable: true }) latest!: number | null;
  @ApiProperty({ example: '2026-04', nullable: true }) latest_date!: string | null;
}

export class FuelPriceRowDto {
  @ApiProperty({ example: 'NEUQUEN' }) provincia!: string;
  @ApiProperty({ example: 'NEUQUEN', nullable: true }) localidad!: string | null;
  @ApiProperty({ example: 'Nafta Premium' }) producto!: string;
  @ApiProperty({ example: 'YPF', nullable: true }) empresa_bandera!: string | null;
  @ApiProperty({ example: '10 DE SETIEMBRE S.A.', nullable: true }) empresa!: string | null;
  @ApiProperty({ example: 1250.0 }) precio!: number;
  @ApiProperty({ example: '2026-05-01' }) fecha_vigencia!: string;
  @ApiProperty({ example: 'Diurno', nullable: true }) tipo_horario!: string | null;
  @ApiProperty({ example: -38.95, nullable: true }) latitude!: number | null;
  @ApiProperty({ example: -68.06, nullable: true }) longitude!: number | null;
}

export class FuelLatestEntryDto {
  @ApiProperty({ example: 'NEUQUEN' }) provincia!: string;
  @ApiProperty({ example: 'Nafta Premium' }) producto!: string;
  @ApiProperty({ example: 1250.0 }) precio_promedio!: number;
  @ApiProperty({ example: 1190.0 }) precio_min!: number;
  @ApiProperty({ example: 1310.0 }) precio_max!: number;
  @ApiProperty({ example: 142 }) sample_size!: number;
  @ApiProperty({ example: '2026-05-29' }) fecha_vigencia!: string;
}
