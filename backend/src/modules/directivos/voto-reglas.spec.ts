import { diaDe, hashVotante, puntosPorVoto, PUNTOS_MAX_VOTO, semanaDe } from './voto-reglas';

describe('semanaDe', () => {
  it('devuelve el lunes, y el mismo para todos los días de la semana', () => {
    // 2026-09-04 es viernes; su lunes es el 2026-08-31.
    const lunes = semanaDe(new Date('2026-09-04T23:59:00Z')).toISOString().slice(0, 10);
    expect(lunes).toBe('2026-08-31');
    for (const d of ['2026-08-31', '2026-09-01', '2026-09-06']) {
      expect(semanaDe(new Date(`${d}T12:00:00Z`)).toISOString().slice(0, 10)).toBe('2026-08-31');
    }
  });

  it('el domingo pertenece a la semana que ya pasó, no a la que empieza', () => {
    // Es el bug clásico de getDay(): domingo = 0 lo manda a la semana siguiente.
    expect(semanaDe(new Date('2026-09-06T12:00:00Z')).toISOString().slice(0, 10)).toBe('2026-08-31');
    expect(semanaDe(new Date('2026-09-07T12:00:00Z')).toISOString().slice(0, 10)).toBe('2026-09-07');
  });
});

describe('diaDe', () => {
  it('trunca a medianoche UTC', () => {
    expect(diaDe(new Date('2026-09-04T23:45:00Z')).toISOString()).toBe('2026-09-04T00:00:00.000Z');
  });
});

describe('hashVotante', () => {
  it('es estable y depende del secreto', () => {
    expect(hashVotante('1.2.3.4', 's')).toBe(hashVotante('1.2.3.4', 's'));
    expect(hashVotante('1.2.3.4', 's')).not.toBe(hashVotante('1.2.3.4', 'otro'));
    expect(hashVotante('1.2.3.4', 's')).not.toContain('1.2.3.4');
  });
});

describe('puntosPorVoto', () => {
  it('EL RANGO NO CAMBIA CON EL VOLUMEN — es la razón de ser de esta función', () => {
    const pocos = puntosPorVoto(new Map([['a', 10], ['b', 5]]));
    const muchos = puntosPorVoto(new Map([['a', 10_000], ['b', 5_000]]));
    expect(pocos.get('a')).toBe(PUNTOS_MAX_VOTO);
    expect(muchos.get('a')).toBe(PUNTOS_MAX_VOTO);
    expect(pocos.get('b')).toBeCloseTo(muchos.get('b')!);
  });

  it('los votos negativos restan', () => {
    const p = puntosPorVoto(new Map([['a', 4], ['b', -4]]));
    expect(p.get('b')).toBe(-PUNTOS_MAX_VOTO);
  });

  it('sin votos no reparte nada', () => {
    expect(puntosPorVoto(new Map()).size).toBe(0);
    expect(puntosPorVoto(new Map([['a', 0]])).size).toBe(0);
  });
});
