import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope } from '../../common/swagger';
import { TradeFlowQueryDto } from './trade-flow.dto';
import { TradeFlowDto } from './trade-flow.response';
import { TradeFlowService } from './trade-flow.service';

@ApiTags('minerals')
@Controller({ path: 'minerals/trade', version: '2' })
export class TradeFlowController {
  constructor(private readonly service: TradeFlowService) {}

  @Get('flow')
  @ApiOperation({
    summary: 'Mineral trade flow (Sankey)',
    description:
      'Imports (exporting countries → Argentina) and exports (Argentina → importing countries) for a commodity, aggregated by country and sorted by value. Filter by `year`; omit to aggregate all years.',
  })
  @ApiOkEnvelope(TradeFlowDto)
  flow(@Query() q: TradeFlowQueryDto) {
    return this.service.flow(q);
  }
}
