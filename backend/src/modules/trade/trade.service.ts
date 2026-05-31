import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EnergyBalanceQueryDto } from './trade.dto';

@Injectable()
export class TradeService {
  constructor(private readonly prisma: PrismaService) {}

  async energyBalance(q: EnergyBalanceQueryDto) {
    const where: Prisma.FactEnergyBalanceWhereInput = {};
    if (q.energy_type) where.formaDeEnergia = { equals: q.energy_type, mode: 'insensitive' };
    if (q.concepto) where.concepto = { equals: q.concepto, mode: 'insensitive' };
    if (q.from || q.to) {
      where.ano = {};
      if (q.from) (where.ano as Prisma.IntFilter).gte = q.from;
      if (q.to) (where.ano as Prisma.IntFilter).lte = q.to;
    }

    const rows = await this.prisma.factEnergyBalance.findMany({
      where,
      orderBy: [{ ano: 'asc' }, { formaDeEnergia: 'asc' }, { concepto: 'asc' }],
    });

    return rows.map((r) => ({
      ano: r.ano,
      energy_type: r.formaDeEnergia,
      concepto: r.concepto,
      ktep: r.ktepRedond,
    }));
  }
}
