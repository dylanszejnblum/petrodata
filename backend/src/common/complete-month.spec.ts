import { isPreliminary, pickCompleteMonth } from './complete-month';

describe('pickCompleteMonth', () => {
  const m = (s: string) => new Date(`${s}-01T00:00:00Z`);

  it('steps back past a half-reported newest month (the Sep 2026 case)', () => {
    const rows = [
      { month: m('2026-09'), wells: 4102 },
      { month: m('2026-08'), wells: 5337 },
      { month: m('2026-07'), wells: 5300 },
    ];
    expect(pickCompleteMonth(rows)).toEqual(m('2026-08'));
    expect(isPreliminary('2026-09-01', m('2026-08'))).toBe(true);
    expect(isPreliminary('2026-08-01', m('2026-08'))).toBe(false);
  });

  it('keeps the newest month when it is within 90%', () => {
    const rows = [
      { month: m('2026-09'), wells: 5000 },
      { month: m('2026-08'), wells: 5337 },
    ];
    expect(pickCompleteMonth(rows)).toEqual(m('2026-09'));
  });
});
