import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { ProductionModule } from './modules/production/production.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { WellsModule } from './modules/wells/wells.module';
import { GeoModule } from './modules/geo/geo.module';
import { DataStatusModule } from './modules/data-status/data-status.module';
import { MineralsModule } from './modules/minerals/minerals.module';
import { PricesModule } from './modules/prices/prices.module';
import { MacroModule } from './modules/macro/macro.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ProvincesModule } from './modules/provinces/provinces.module';
import { NewsModule } from './modules/news/news.module';
import { InversionesModule } from './modules/inversiones/inversiones.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ProductionModule,
    OperatorsModule,
    WellsModule,
    GeoModule,
    DataStatusModule,
    MineralsModule,
    PricesModule,
    MacroModule,
    CompaniesModule,
    ProvincesModule,
    NewsModule,
    InversionesModule,
    NewsletterModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
