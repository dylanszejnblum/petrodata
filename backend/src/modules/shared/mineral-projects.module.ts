import { Module } from '@nestjs/common';
import { MineralProjectsService } from './mineral-projects.service';

@Module({
  providers: [MineralProjectsService],
  exports: [MineralProjectsService],
})
export class MineralProjectsModule {}
