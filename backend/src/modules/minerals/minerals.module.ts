import { Module } from '@nestjs/common';
import { MineralsController } from './minerals.controller';
import { MineralsService } from './minerals.service';
import { PricesService } from './prices.service';

@Module({
  controllers: [MineralsController],
  providers: [MineralsService, PricesService],
})
export class MineralsModule {}
