import { ApiProperty } from '@nestjs/swagger';

export class GeoPointGeometryDto {
  @ApiProperty({ example: 'Point' }) type!: 'Point';

  @ApiProperty({
    example: [-69.36352, -37.40809],
    description: '[longitude, latitude] in WGS84, per GeoJSON spec.',
    type: [Number],
  })
  coordinates!: [number, number];
}

export class GeoWellPropertiesDto {
  @ApiProperty({ example: '10000' }) well_id!: string;
  @ApiProperty({ example: 'SJ.Nq.ET"E".x-1' }) sigla!: string;
  @ApiProperty({ example: 'chevron' }) operator_slug!: string;
  @ApiProperty({ example: 'CHEVRON ARGENTINA S.R.L.' }) operator_name!: string;
  @ApiProperty({ example: 'huitr_n' }) formation_slug!: string;
  @ApiProperty({ example: 'NEUQUINA' }) basin!: string;
  @ApiProperty({ example: 'Neuquén' }) province!: string;
  @ApiProperty({ example: 'EL TRAPIAL ESTE' }) concession!: string;
  @ApiProperty({ example: 'EL TRAPIAL' }) yacimiento!: string;
  @ApiProperty({ example: 'Petrolífero' }) well_type!: string;
  @ApiProperty({ example: 'En Estudio' }) status_code!: string;
  @ApiProperty({ example: 1315, nullable: true }) depth_m!: number | null;
}

export class GeoWellFeatureDto {
  @ApiProperty({ example: 'Feature' }) type!: 'Feature';
  @ApiProperty({ type: GeoPointGeometryDto }) geometry!: GeoPointGeometryDto;
  @ApiProperty({ type: GeoWellPropertiesDto }) properties!: GeoWellPropertiesDto;
}

export class GeoWellFeatureCollectionDto {
  @ApiProperty({ example: 'FeatureCollection' }) type!: 'FeatureCollection';
  @ApiProperty({ type: [GeoWellFeatureDto] }) features!: GeoWellFeatureDto[];
}
