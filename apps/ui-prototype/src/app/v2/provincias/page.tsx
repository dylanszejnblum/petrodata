import { Seccion, Card, CardHead, Pie, Tag, asignarColores } from '../_ui/kit'
import { Cifras } from '../_ui/Cifras'
import { FilaProvincia } from './FilaProvincia'
import { COMPANIES } from '@/fixtures/companies'
import { PROVINCES, SOLO_PROVINCIAS } from '@/fixtures/provinces'
import { NATIONAL_SERIES, serieProvincia } from '@/fixtures/production'
import { formatCompactAR, formatDecimal, formatInteger, formatMonth } from '@/lib/format'

/* PROVINCIAS — pocas filas, así que acá SÍ va la barra en cada una: con ocho
   ítems la magnitud relativa es el mensaje, y una barra lo dice más rápido
   que ocho números. Es la contracara de la decisión de Empresas. */

export default function V2Provincias() {
  const porPozos = PROVINCES.slice().sort((a, b) => b.wells - a.wells)
  const porExpo = PROVINCES.slice().sort((a, b) => b.exportsMUSD - a.exportsMUSD)
  const maxPozos = Math.max(...PROVINCES.map((p) => p.wells))
  const maxExpo = Math.max(...PROVINCES.map((p) => p.exportsMUSD))
  /* Los totales SÍ incluyen al Estado Nacional: son el total del país. Los
     denominadores que dicen "provincias" no, ver SOLO_PROVINCIAS. */
  const totalPozos = PROVINCES.reduce((s, p) => s + p.wells, 0)
  const totalExpo = PROVINCES.reduce((s, p) => s + p.exportsMUSD, 0)
  /* Ranking de exportaciones sólo entre provincias, que es el que se muestra
     en el desplegable. Sacar al Estado Nacional corre un puesto para arriba a
     todo lo que estaba debajo suyo: La Pampa era 7ª de 11 y es 6ª de 10. */
  const puestoExpoDe = new Map(
    SOLO_PROVINCIAS.slice()
      .sort((a, b) => b.exportsMUSD - a.exportsMUSD)
      .map((p, i) => [p.slug, i + 1]),
  )
  const puestoPozosProvDe = new Map(
    SOLO_PROVINCIAS.slice()
      .sort((a, b) => b.wells - a.wells)
      .map((p, i) => [p.slug, i + 1]),
  )
  const cuencas = [...SOLO_PROVINCIAS.reduce((m, p) => {
    const x = m.get(p.basin) ?? { nombre: p.basin, provincias: 0, pozos: 0 }
    x.provincias++
    x.pozos += p.wells
    return m.set(p.basin, x)
  }, new Map<string, { nombre: string; provincias: number; pozos: number }>()).values()]
    .sort((a, b) => b.pozos - a.pozos)
  const pozosEnCuencas = cuencas.reduce((s, c) => s + c.pozos, 0)
  /* El color se asigna por posición sobre las cuencas ordenadas por pozos,
     así cada una tiene el suyo y no cambia entre secciones ni pantallas. */
  const colorCuenca = asignarColores(cuencas.map((c) => c.nombre))
  /* La vara de intensidad exportadora: MUSD por pozo activo en todo el país. */
  const promedioPorPozo = totalExpo / totalPozos
  /* El reparto por cuenca de cada cifra del resumen, con el mismo color que la
     cuenca tiene en los tags y en la card de cuencas. El Estado Nacional no
     está en ninguna cuenca y va como segmento neutro —sin color— para que las
     tres pilas sumen exacto su cifra en vez de dejar un resto mudo. */
  const repartoPorCuenca = (
    medir: (p: (typeof PROVINCES)[number]) => number,
    rotular: (v: number) => string,
  ) => {
    const total = PROVINCES.reduce((s, p) => s + medir(p), 0)
    /* Un decimal debajo del 10%: Noroeste son 24 pozos sobre 14.441, o sea
       0,17%, y redondeado a entero decía "0%", que se lee como error. Arriba
       del 10% el decimal es ruido. */
    const parte = (v: number) => {
      const pct = (v / total) * 100
      return `${rotular(v)} · ${pct >= 10 ? Math.round(pct) : formatDecimal(pct, 1)}%`
    }
    return [
      ...cuencas.map((c) => {
        const valor = SOLO_PROVINCIAS.filter((p) => p.basin === c.nombre).reduce(
          (s, p) => s + medir(p),
          0,
        )
        return {
          nombre: c.nombre,
          color: colorCuenca.get(c.nombre),
          valor,
          detalle: parte(valor),
        }
      }),
      ...PROVINCES.filter((p) => p.esProvincia === false).map((p) => ({
        nombre: 'Sin cuenca',
        valor: medir(p),
        detalle: parte(medir(p)),
      })),
    ].filter((x) => x.valor > 0)
  }
  /* Los doce rótulos de mes son los mismos para todas las filas: se formatean
     una vez acá, en el servidor, y no once veces en el cliente. */
  const meses = NATIONAL_SERIES.slice(-12).map((m) => formatMonth(`${m.period}-01`))
  /* slug de operadora → nombre, para las empresas que operan en cada provincia */
  const NOMBRES = new Map(COMPANIES.map((c) => [c.slug, c.name]))

  return (
    <>
      <Seccion
        n="01"
        titulo="Provincias de Argentina"
        desc="Pozos y exportaciones sumados, y cómo se reparten por cuenca."
      >
        <Cifras
          items={[
            {
              rotulo: 'Pozos activos',
              valor: formatInteger(totalPozos),
              apoyo: `en ${cuencas.length} cuencas`,
              partes: repartoPorCuenca((p) => p.wells, (v) => `${formatInteger(v)} pozos`),
            },
            {
              rotulo: 'Exportaciones',
              valor: formatCompactAR(totalExpo),
              apoyo: 'MUSD · año móvil',
              partes: repartoPorCuenca(
                (p) => p.exportsMUSD,
                (v) => `${formatCompactAR(v)} MUSD`,
              ),
            },
            {
              /* El apoyo explica por qué las listas de abajo tienen once filas
                 y esta card dice diez: la número once es el Estado Nacional,
                 que suma al total del país pero no es una provincia. */
              rotulo: 'Provincias',
              valor: String(SOLO_PROVINCIAS.length),
              apoyo: '+ Estado Nacional',
              partes: repartoPorCuenca(
                () => 1,
                (v) => `${v} ${v === 1 ? 'provincia' : 'provincias'}`,
              ),
            },
          ]}
        />
      </Seccion>

      <Seccion
        n="02"
        titulo="Pozos activos"
        desc="Cuántos aporta cada provincia, sobre el total del país."
      >
        <Card>
          <CardHead titulo="Por cantidad de pozos" nota={`${formatInteger(totalPozos)} pozos`} />
          {porPozos.map((p, i) => (
            <FilaProvincia
              key={p.slug}
              p={p}
              n={i + 1}
              valor={formatInteger(p.wells)}
              unidad={p.wells === 1 ? 'pozo' : 'pozos'}
              pct={p.wells / maxPozos}
              lider={i === 0}
              tagColor={colorCuenca.get(p.basin)}
              operadoras={(p.operators ?? []).map((s) => NOMBRES.get(s) ?? s)}
              metrica="pozos"
              pctPozos={(p.wells / totalPozos) * 100}
              pctExpo={(p.exportsMUSD / totalExpo) * 100}
              promedioPorPozo={promedioPorPozo}
              puestoPozos={puestoPozosProvDe.get(p.slug)}
              puestoExpo={puestoExpoDe.get(p.slug)}
              totalProvincias={SOLO_PROVINCIAS.length}
              serie={serieProvincia(p.slug, p.wells)}
              meses={meses}
            />
          ))}
        </Card>
        {/* El pie dice de dónde sale cada dato y nada más. Llegó a tener 824
            caracteres —siete veces la mediana de los otros veinte pies de v2—
            porque le fui apilando cosas, y la mitad no le hablaba al lector:

            - por qué la fila se despliega en el lugar en vez de navegar: es la
              justificación de una decisión de diseño, o sea un comentario de
              código que se me escapó a la pantalla;
            - que las barras se comparan dentro del rango y no desde cero: si
              ya dije que la serie es inventada, cómo la escalé no cambia nada;
            - qué es «Estado Nacional»: la propia fila lo dice al desplegarse
              («Áreas bajo administración del Estado Nacional») y su tag es
              neutro justamente porque no es una categoría;
            - que «sin dato» es un hueco nuestro: lo dice el badge, en su fila.

            Una advertencia va donde está lo que advierte. Al pie sólo queda lo
            que no tiene dónde vivir en la pantalla: la procedencia. */}
        <Pie>
          Pozos y exportaciones salen del sitio. La producción mensual no: no se publica
          por provincia y esta serie es ilustrativa. Las operadoras son las destacadas,
          no todas las que operan.
        </Pie>
      </Seccion>

      <Seccion
        n="03"
        titulo="Perfil exportador"
        desc="Cuánto exporta cada provincia y cuánto pesa en el total del país."
      >
        <Card>
          {/* La cifra llevaba unidad pero no período, que en una cifra de
              dinero es la mitad del dato. El sitio la publica como año móvil,
              o sea los últimos doce meses. */}
          <CardHead titulo="Por exportaciones" nota={`${formatCompactAR(totalExpo)} MUSD · año móvil`} />
          {/* La MISMA fila que la sección 02. Antes era FilaRanking con la nota
              en un segundo renglón, y entre las dos listas no coincidía nada:
              60px de alto contra 40, dos renglones contra uno, sin tag de
              cuenca y las cinco columnas corridas entre 24 y 28px. El "% del
              total nacional" que estaba en ese segundo renglón no se pierde:
              ya vivía adentro del desglose, como badge del paso de
              exportaciones. */}
          {porExpo.map((p, i) => (
            <FilaProvincia
              key={p.slug}
              p={p}
              n={i + 1}
              valor={formatCompactAR(p.exportsMUSD)}
              unidad="MUSD"
              pct={p.exportsMUSD / maxExpo}
              lider={i === 0}
              tagColor={colorCuenca.get(p.basin)}
              operadoras={(p.operators ?? []).map((s) => NOMBRES.get(s) ?? s)}
              metrica="exportaciones"
              pctPozos={(p.wells / totalPozos) * 100}
              pctExpo={(p.exportsMUSD / totalExpo) * 100}
              promedioPorPozo={promedioPorPozo}
              puestoPozos={puestoPozosProvDe.get(p.slug)}
              puestoExpo={puestoExpoDe.get(p.slug)}
              totalProvincias={SOLO_PROVINCIAS.length}
              serie={serieProvincia(p.slug, p.wells)}
              meses={meses}
            />
          ))}
        </Card>
        {/* Acá vivía una columna de color con los puestos que cada provincia
            ganaba o perdía respecto del ranking por pozos, y el pie la
            explicaba. Las dos cosas fuera: era una sección de exportaciones
            midiéndose contra pozos, que es exactamente lo contrario de lo que
            la cabecera anuncia con sus 6.879 MUSD.

            La comparación entre los dos rankings no se pierde, vive donde
            corresponde: en el desglose de la sección 02, cada provincia dice
            "Nª de 10 en exportaciones", que es el puesto que ahí no se ve. */}
        {/* La aclaración importa porque las dos cifras existen y se llevan un
            factor de 2,5: la Argentina exportó US$ 17,1B en el año móvil según
            el propio sitio —minería incluida— y estas once filas suman 6.879,
            o sea el 40,2%. Neuquén es 69,6% de esta tabla y 28,0% del país. */}
        <Pie>
          Los 6.879 MUSD son la suma de estas filas. Las exportaciones totales del país en
          el año móvil son US$ 17,1B, así que «del total» y «del país» no son lo mismo:
          Neuquén es 69,6% de esta tabla y 28,1% del país.
        </Pie>
      </Seccion>

      <Seccion
        n="04"
        titulo="Cuencas"
        desc="Las cinco cuencas con actividad y cuántas provincias abarca cada una."
      >
        <Card>
          {/* La cabecera decía "5 cuencas", que es un conteo de filas y no el
              total de la columna. Las otras dos cards anuncian ahí su total
              —14.441 y 6.879 MUSD— y ésta no anunciaba nada, así que la columna
              de la derecha quedaba sin unidad y sin referencia: números sueltos.
              Ahora dice el total, y cuántas cuencas son se lee en el rótulo de
              la sección y contando cinco filas. */}
          <CardHead titulo="Por cuenca" nota={`${formatInteger(pozosEnCuencas)} pozos`} />
          {/* Misma gramática de fila que las otras dos listas: número de orden,
              identidad, barra de magnitud y cifra con su unidad. Era la tercera
              forma de fila de la página —sin orden, sin barra y sin unidad— y no
              hay motivo: es una lista rankeada como las otras dos. */}
          {cuencas.map((c, i) => (
            <div key={c.nombre} className="s-fila s-fila-hover">
              <span className="s-mono w-5 shrink-0 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <Tag color={colorCuenca.get(c.nombre)!}>{c.nombre}</Tag>
              </span>
              <span className="s-micro hidden shrink-0 sm:block" style={{ color: 'var(--ink-2)' }}>
                {c.provincias} {c.provincias === 1 ? 'provincia' : 'provincias'}
              </span>
              <span
                className={`s-barra hidden w-16 shrink-0 sm:block ${i === 0 ? 's-barra--lider' : ''}`}
                aria-hidden
              >
                <i style={{ width: `${Math.max(3, (c.pozos / cuencas[0].pozos) * 100)}%` }} />
              </span>
              <span className="flex shrink-0 items-baseline justify-end gap-1 sm:w-24">
                <span className="s-num w-10 text-right text-[13px] font-medium sm:w-auto">
                  {formatInteger(c.pozos)}
                </span>
                <span className="hidden text-[11px] sm:inline" style={{ color: 'var(--ink-3)' }}>
                  pozos
                </span>
              </span>
            </div>
          ))}
        </Card>
        {/* Misma poda que el pie de la sección 02, que es de donde salió el
            problema: la explicación de por qué el color es categórico y no
            semántico es una regla del sistema, no un dato de esta tabla. Vive
            en SISTEMA.md, que es donde alguien la va a buscar. Acá queda la
            reconciliación de la suma, que es lo único que el lector no puede
            deducir mirando. */}
        <Pie>
          Suman {formatInteger(pozosEnCuencas)} pozos y no {formatInteger(totalPozos)}: los{' '}
          {totalPozos - pozosEnCuencas} del Estado Nacional no están asignados a una cuenca.
        </Pie>
      </Seccion>
    </>
  )
}
