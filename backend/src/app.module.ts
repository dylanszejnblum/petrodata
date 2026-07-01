import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ApiKeyGuard } from './common/api-key.guard';
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
    // Global rate limit: 120 req/min per IP. Tighter caps on the external-API
    // proxy routes live on their controllers via @Throttle.
    // ponytail: in-memory store — fine for a single Coolify container. If you
    // scale to >1 replica, each holds its own counters (effective limit ×N);
    // move to a Redis ThrottlerStorage then, which you'll want anyway for the
    // paid-tier per-key metering.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
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
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {}
