import { calcularIndices } from './directivos.service';

/* El índice ordena una lista de personas con nombre y apellido, así que un
   error acá no se ve: da un ranking plausible y equivocado. Estos casos son
   los que fallaron alguna vez, o los que romperían la promesa que la página
   hace en el pie de la card. */
describe('calcularIndices', () => {
  const fila = (escala: number, valorUsd: number, pozos: number, id = '') => ({
    id,
    escala,
    valorUsd,
    pozos,
  });

  it('pone en 100 a la empresa que lidera los tres insumos', () => {
    const [primera] = calcularIndices([fila(0.5, 100, 100, 'a'), fila(0.1, 10, 100, 'b')], 110);
    expect(primera.index).toBe(100);
  });

  it('EL PISO DE POZOS evita que una empresa chica se cuele arriba', () => {
    /* El caso real: GeoPark entraba séptima con el 0,1% del valor porque opera
       nueve pozos. Sin el piso, valor/pozos la dispara; con el piso, no. */
    const grande = fila(0.4, 10_000_000, 5000, 'grande');
    const chica = fila(0.001, 20_000, 9, 'chica');
    const r = calcularIndices([grande, chica], 10_020_000).sort((a, b) => b.index - a.index);
    expect(r[0].id).toBe('grande');
  });

  it('una empresa sin producción queda en cero, no en NaN', () => {
    const r = calcularIndices([fila(0.9, 900, 100, 'a'), fila(0, 0, 0, 'vacia')], 900);
    const vacia = r.find((x) => x.id === 'vacia');
    expect(vacia?.index).toBe(0);
  });

  it('no divide por cero cuando no hay valor en toda la ventana', () => {
    const r = calcularIndices([fila(0, 0, 0, 'a'), fila(0, 0, 0, 'b')], 0);
    expect(r.every((x) => Number.isFinite(x.index))).toBe(true);
  });

  it('el índice se mueve con la producción y no con el orden de entrada', () => {
    const filas = [fila(0.2, 200, 50, 'a'), fila(0.6, 600, 50, 'b')];
    const directo = calcularIndices(filas, 800);
    const invertido = calcularIndices([...filas].reverse(), 800);
    const idx = (rs: typeof directo, id: string) => rs.find((r) => r.id === id)!.index;
    expect(idx(directo, 'a')).toBe(idx(invertido, 'a'));
    expect(idx(directo, 'b')).toBeGreaterThan(idx(directo, 'a'));
  });

  it('NO devuelve los componentes del índice — los pesos se despejarían', () => {
    const [r] = calcularIndices([fila(0.5, 100, 100, 'a')], 100);
    expect(Object.keys(r).sort()).toEqual(['escala', 'id', 'index', 'pozos', 'valorUsd']);
    expect(r).not.toHaveProperty('rinde');
    expect(r).not.toHaveProperty('prima');
  });
});
