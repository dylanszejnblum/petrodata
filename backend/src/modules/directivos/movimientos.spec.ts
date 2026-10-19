import { DirectivosService } from './directivos.service';

/* Los cortes viejos se recalculan con la producción de entonces: si hace un mes
   lideraba B y hoy lidera A, A tiene que figurar entre los que subieron en el
   mes y el año, B entre los que bajaron, y el día —misma producción, sin
   votos— no puede mover a nadie. */
describe('DirectivosService.movimientos', () => {
  const hace = (dias: number) => Date.now() - dias * 86_400_000;
  const contribucion = (a: number, b: number) => ({
    totals: { gross_value_usd: a + b },
    operators: [
      { operator_slug: 'a', share_boe: a / (a + b), gross_value_usd: a },
      { operator_slug: 'b', share_boe: b / (a + b), gross_value_usd: b },
    ],
  });
  const prisma = {
    companyExecutive: {
      findMany: async () =>
        ['a', 'b'].map((s) => ({ companySlug: s, name: s.toUpperCase(), role: 'CEO', photoUrl: null })),
    },
    company: {
      findMany: async () => ['a', 'b'].map((s) => ({ slug: s, name: s, projectCountOilGas: 100 })),
    },
    executiveVote: { groupBy: async () => [] },
  };
  const operators = {
    contribution: async (dia: Date) => (dia.getTime() < hace(20) ? contribucion(1, 9) : contribucion(9, 1)),
  };
  const service = new DirectivosService(prisma as never, operators as never);

  it('A sube y B baja en el mes y el año; en el día no se mueve nadie', async () => {
    const r = (await service.movimientos())!;
    expect(r.top.map((d) => d.company_slug)).toEqual(['a', 'b']);
    for (const p of [r.periods.month!, r.periods.year!]) {
      expect(p.risers.map((d) => [d.company_slug, d.rank_change])).toEqual([['a', 1]]);
      expect(p.fallers.map((d) => [d.company_slug, d.rank_change])).toEqual([['b', -1]]);
    }
    expect(r.periods.day!.risers).toEqual([]);
    expect(r.periods.day!.fallers).toEqual([]);
  });
});
