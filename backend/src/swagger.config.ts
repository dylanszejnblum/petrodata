import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Petroldata.ar API')
    .setDescription(
      [
        'REST API over Argentina Secretaría de Energía oil & gas production data (focus: Vaca Muerta).',
        '',
        '## Response envelope',
        '',
        'Every non-GeoJSON endpoint returns:',
        '',
        '```json',
        '{',
        '  "data": ...,',
        '  "meta": {',
        '    "source": "Secretaría de Energía / datos.energia.gob.ar",',
        '    "dataset": "Producción de petróleo y gas por pozo",',
        '    "license": "CC-BY-4.0",',
        '    "last_source_update": "2026-04-01",',
        '    "last_ingested_at": "2026-05-27T14:30:00.000Z",',
        '    "vaca_muerta_filter": "formation + unconventional + sub-tipo"',
        '  },',
        '  "pagination": { "page": 1, "limit": 50, "total": 1000 }',
        '}',
        '```',
        '',
        '`pagination` is only present on paginated list endpoints. GeoJSON endpoints (`/geo/*`) return raw GeoJSON.',
        '',
        '## Errors',
        '',
        '```json',
        '{ "error": { "code": "NOT_FOUND", "message": "Well not found: 99999" } }',
        '```',
        '',
        '## Units',
        '',
        '- `oil_m3` — cubic metres of oil',
        '- `oil_bbl` — barrels of oil (1 m³ ≈ 6.2898 bbl)',
        '- `oil_bbl_d` — barrels per day (oil_bbl ÷ days in month)',
        '- `gas_thousand_m3` — thousands of cubic metres of gas (Mm³)',
        '- `gas_mcf` — thousand cubic feet of gas',
        '- `gas_mmcf_d` — million cubic feet per day',
        '- `gas_mm3_d` — million m³ per day',
        '- `boe` — barrels of oil equivalent (oil_bbl + gas_boe)',
        '',
        '## Vaca Muerta flag',
        '',
        '`vm_combined = formation_vaca_muerta AND unconventional AND sub_resource_type ∈ {Shale, Shale Oil, …}` — pre-computed in the Python pipeline.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .setContact('Petroldata.ar', 'https://petroldata.ar', '')
    .setLicense('CC-BY-4.0', 'https://creativecommons.org/licenses/by/4.0/')
    .addServer(`http://localhost:${process.env.PORT || 3001}`, 'Local dev')
    .addTag('production', 'Monthly production facts and summaries')
    .addTag('operators', 'Operator catalog, detail, and time series')
    .addTag('wells', 'Well catalog and per-well production')
    .addTag('geo', 'GeoJSON endpoints for map rendering')
    .addTag('data-status', 'Ingestion freshness and table row counts')
    .addTag('minerals', 'Mining project database (v2): silver, gold, uranium, copper, lithium fact sheets')
    .addTag('prices', 'Commodity prices, energy prices, and gas station fuel prices')
    .addTag('macro', 'Macroeconomic context: USD/ARS exchange rates and Argentina rig count')
    .addTag('system', 'Health and operational endpoints')
    .build();
}
