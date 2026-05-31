import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TradeService } from './trade.service';
import { EnergyBalanceQueryDto } from './trade.dto';
import { EnergyBalancePointDto } from './trade.response';

@ApiTags('Trade')
@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get('energy-balance')
  @ApiOperation({ summary: 'Historical energy balance (BEN), 1960-2016' })
  @ApiQuery({ name: 'energy_type', required: false, description: 'Filter by energy type (e.g. Petroleo, Gas Natural)' })
  @ApiQuery({ name: 'concepto', required: false, description: 'Filter by concept (Oferta, Consumo, Transformacion)' })
  @ApiQuery({ name: 'from', required: false, description: 'Start year' })
  @ApiQuery({ name: 'to', required: false, description: 'End year' })
  async getEnergyBalance(
    @Query() query: EnergyBalanceQueryDto,
  ): Promise<EnergyBalancePointDto[]> {
    return this.tradeService.energyBalance(query);
  }
}
