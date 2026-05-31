import { Module } from '@nestjs/common';
import { MineralsController } from './minerals.controller';
import { MineralsService } from './minerals.service';
import { PricesService } from './prices.service';
import { UraniumController } from './uranium.controller';
import { UraniumService } from './uranium.service';
import { TradeFlowController } from './trade-flow.controller';
import { TradeFlowService } from './trade-flow.service';

@Module({
  controllers: [MineralsController, UraniumController, TradeFlowController],
  providers: [MineralsService, PricesService, UraniumService, TradeFlowService],
})
export class MineralsModule {}
