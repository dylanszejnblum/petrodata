import { Module } from '@nestjs/common';
import { MineralProjectsModule } from '../shared/mineral-projects.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [MineralProjectsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
