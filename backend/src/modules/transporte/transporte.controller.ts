import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { TransporteService } from './transporte.service';

@ApiTags('transporte')
@Controller({ path: 'transporte', version: '2' })
export class TransporteController {
  constructor(private readonly service: TransporteService) {}

  @Get('evacuacion')
  @ResponseMeta({
    source:
      'Secretaría de Energía (Planilla 20: volúmenes; Anexo 2A: capacidad de oleoductos) · ENARGAS (GRT: gas recibido por gasoducto) · obras: presentaciones regulatorias, empresas y prensa (ver source_kind por fila)',
    dataset: 'Capacidad de evacuación de la cuenca Neuquina',
    note: 'Gas capacities are approximate (source_kind per row); ENARGAS does not publish capacity per pipeline.',
  })
  @ApiOperation({
    summary: 'Neuquén basin evacuation: capacity vs flow',
    description:
      'Oil pipelines leaving the basin (Oldelval to Puerto Rosales, Trasandino to Chile, YPF to Luján de Cuyo): declared ' +
      'design / max capacity (SE Anexo 2A, last year filed) vs monthly delivered volume (SE Planilla 20) as m3/d and bbl/d, ' +
      'with utilization. Gas: Centro Oeste (TGN) and Neuba I+II (TGS) received volume (ENARGAS) vs approximate capacity. ' +
      'Plus Vaca Muerta production for scale and the expansion projects (VMOS, Duplicar Norte, GPM expansion, San Matías, ' +
      'FLNG) with status and source.',
  })
  @ApiQuery({ name: 'months', required: false, example: 24, description: 'Months of history per pipeline (default 24).' })
  evacuacion(@Query('months') months?: string) {
    return this.service.evacuacion(Math.min(240, Math.max(1, Number(months) || 24)));
  }
}
