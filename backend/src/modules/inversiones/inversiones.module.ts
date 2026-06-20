import { Module } from '@nestjs/common';
import { InversionesController } from './inversiones.controller';
import { InversionesService } from './inversiones.service';

@Module({
  controllers: [InversionesController],
  providers: [InversionesService],
})
export class InversionesModule {}
