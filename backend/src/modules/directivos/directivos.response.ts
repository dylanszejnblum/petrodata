import { ApiProperty } from '@nestjs/swagger';

export class DirectivoDto {
  @ApiProperty({ example: 'ypf', description: 'Slug de la EMPRESA — la clave del cruce, no del directivo.' })
  company_slug!: string;

  @ApiProperty({ example: 'YPF S.A.' }) company_name!: string;
  @ApiProperty({ example: 'Horacio Daniel Marín' }) name!: string;
  @ApiProperty({ example: 'Presidente & CEO' }) role!: string;

  @ApiProperty({
    example: '2023-12',
    nullable: true,
    description:
      'Desde cuándo ocupa el cargo. Año, año-mes o fecha completa, según lo que diga la fuente. NO es la fecha de verificación.',
  })
  in_role_since!: string | null;

  @ApiProperty({ example: 'Ingeniero químico de la UNLP…', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/directivos/ypf.jpg', nullable: true })
  photo_url!: string | null;

  @ApiProperty({
    example: 96.5,
    description:
      'Índice de la EMPRESA, atribuido a quien la dirige. La parte de producción —escala, ' +
      'rendimiento por pozo y prima de valor, con pesos que no se publican— va de 0 a 100. ' +
      'Los votos de la semana suman hasta ±6 encima de eso, así que el total puede pasar de 100: ' +
      'no se recorta, porque recortarlo empataría a los de arriba justo cuando el voto los separa.',
  })
  index!: number;

  @ApiProperty({ example: 1 }) rank!: number;
}

export class DirectivosSourceDto {
  @ApiProperty({ example: '2025-06-01' }) window_from!: string;
  @ApiProperty({ example: '2026-05-01' }) window_to!: string;
  @ApiProperty({
    example: ['Escala de producción', 'Rendimiento por pozo', 'Prima de valor'],
    description: 'Los insumos del índice, por su nombre. La ponderación no se publica.',
  })
  inputs!: string[];
}

export class VotacionResumenDto {
  @ApiProperty({ example: '2026-08-31', description: 'Lunes de la semana en curso.' })
  week_start!: string;

  @ApiProperty({ example: 1284, description: 'Votos emitidos esta semana. Es un COUNT, no una estimación.' })
  votes!: number;

  @ApiProperty({ example: 377, description: 'Votantes distintos esta semana (IPs distintas — una IP no es una persona).' })
  voters!: number;

  @ApiProperty({ example: 5 }) weekly_limit!: number;
}

export class DirectivosResponseDto {
  @ApiProperty({ type: [DirectivoDto] }) directivos!: DirectivoDto[];
  @ApiProperty({ type: VotacionResumenDto }) votacion!: VotacionResumenDto;
  @ApiProperty({ type: DirectivosSourceDto }) source!: DirectivosSourceDto;
}

export class VotoEmitidoDto {
  @ApiProperty({ example: 'ypf' }) company_slug!: string;
  @ApiProperty({ example: 1, enum: [1, -1] }) value!: number;

  @ApiProperty({
    example: false,
    description:
      'false = se emitió hoy y entra en el corte de mañana. El orden se recalcula una vez por día.',
  })
  counted!: boolean;
}

export class VotoEstadoDto {
  @ApiProperty({ example: '2026-08-31' }) week_start!: string;
  @ApiProperty({ example: 5 }) weekly_limit!: number;
  @ApiProperty({ example: 2 }) used!: number;
  @ApiProperty({ example: 3 }) remaining!: number;
  @ApiProperty({ type: [VotoEmitidoDto] }) votes!: VotoEmitidoDto[];
}
