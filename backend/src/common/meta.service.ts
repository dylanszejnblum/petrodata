import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ResponseMeta {
  source: string;
  dataset: string;
  license: string;
  last_source_update: string | null;
  last_ingested_at: string;
  vaca_muerta_filter: string;
}

@Injectable()
export class MetaService {
  private cachedLastSourceUpdate: string | null = null;
  private cachedAt = 0;
  private readonly TTL_MS = 60_000;
  private readonly ingestedAt: string;

  constructor(private readonly prisma: PrismaService) {
    this.ingestedAt = new Date().toISOString();
  }

  async buildMeta(): Promise<ResponseMeta> {
    return {
      source: 'Secretaría de Energía / datos.energia.gob.ar',
      dataset: 'Producción de petróleo y gas por pozo',
      license: 'CC-BY-4.0',
      last_source_update: await this.getLatestMonth(),
      last_ingested_at: this.ingestedAt,
      vaca_muerta_filter: 'formation + unconventional + sub-tipo',
    };
  }

  async getLatestMonth(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedLastSourceUpdate && now - this.cachedAt < this.TTL_MS) {
      return this.cachedLastSourceUpdate;
    }
    const latest = await this.prisma.factProductionMonthly.findFirst({
      orderBy: { dateMonth: 'desc' },
      select: { dateMonth: true },
    });
    this.cachedLastSourceUpdate = latest ? latest.dateMonth.toISOString().slice(0, 10) : null;
    this.cachedAt = now;
    return this.cachedLastSourceUpdate;
  }
}
