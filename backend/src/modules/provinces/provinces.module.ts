import { Module } from '@nestjs/common';
import { MineralProjectsModule } from '../shared/mineral-projects.module';
import { ProvincesController } from './provinces.controller';
import { ProvincesService } from './provinces.service';

@Module({
  imports: [MineralProjectsModule],
  controllers: [ProvincesController],
  providers: [ProvincesService],
})
export class ProvincesModule {}
