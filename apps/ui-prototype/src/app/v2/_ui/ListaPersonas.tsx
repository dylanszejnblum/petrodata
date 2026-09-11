'use client'

import { Fragment, useCallback, useMemo, useState } from 'react'
import { AvisoDato } from './AvisoDato'
import { Icono, PATH } from './iconos'
import { conVoto, dia, LIMITE, proximoCorte } from './voto-reglas'
import { useVotos } from './votos'
import type { PersonaFila } from '@/fixtures/personas'
import { formatDecimal } from '@/lib/format'

/* LA LISTA DE PERSONALIDADES — el índice, y el voto por fila.

   El voto acá es una MAQUETA. En producción tiene que vivir en el servidor: el
   enunciado es «un voto por semana por IP», y eso no se puede sostener desde el
   navegador —quien vota puede borrar el storage y volver a votar—. Se guarda en
   localStorage para poder ver la interacción, y la card lo dice.

   Y conviene dejar escrito lo que una IP no resuelve, porque es la parte que se
   descubre tarde: una oficina, una universidad o una operadora móvil son miles
   de personas detrás de UNA IP, así que el límite semanal bloquea a todos menos
   al primero; y cualquiera con una VPN vota las veces que quiera. Sirve como
   fricción, no como control. Si el ranking va a significar algo, el voto
   necesita una cuenta.

   La semana arranca el lunes, que es lo que dice la cabecera. El identificador
   de semana se calcula del lado del cliente y con eso se descartan los votos
   viejos: sin eso, «se renueva cada lunes» sería una frase y no un
   comportamiento. */

export function ListaPersonas({ personas }: { personas: PersonaFila[] }) {
  const { votos, votar, restantes } = useVotos()
  /* UNA SOLA FILA ABIERTA A LA VEZ. Con varias abiertas la lista deja de ser
     una tabla de posiciones —los puestos quedan a cuarenta píxeles unos de
     otros y a trescientos otros— y el orden, que es lo único que la fila tiene
     que comunicar, se pierde. */
  const [abierta, setAbierta] = useState<string | null>(null)

  /* EL VOTO ENTRA EN EL NÚMERO. Antes se guardaba y no pasaba nada: la página
     decía que la votación semanal pesa y el ranking no se movía nunca. Ahora
     cada voto suma o resta (ver PESO_VOTO) y la lista se reordena acá mismo,
     en el render, sin esperar nada.

     Se ordena por el valor ya ajustado, no por el del fixture. El orden del
     fixture se guarda aparte para poder mostrar cuánto se movió cada uno. */
  const base = useMemo(() => {
    const m: Record<string, number> = {}
    personas.forEach((p, i) => {
      m[p.slug] = i + 1
    })
    return m
  }, [personas])

  /* EL CORTE. La lista se ordena SÓLO con los votos de días anteriores. Los de
     hoy están emitidos y no se pueden deshacer, pero no mueven a nadie hasta
     medianoche. Ver voto-reglas.ts. */
  const hoy = dia()
  const filas = useMemo(
    () =>
      personas
        .map((p, i) => {
          const e = votos[p.slug]
          const dentro = e && e.d !== hoy ? e.v : undefined
          return {
            ...p,
            orden: i,
            puntos: conVoto(p.indice, dentro),
            pendiente: !!e && e.d === hoy,
          }
        })
        /* EL DESEMPATE ES EXPLÍCITO y no el que regala el sort estable: con
           veinticinco personas empatadas, dejarlo librado a la implementación
           es dejar librado el puesto de la mitad de la lista. Se cae al orden
           del fixture, que es el del ranking de empresas —el mismo que produjo
           el índice—, así que dentro de un empate manda la empresa más
           grande. */
        .sort((a, b) => b.puntos - a.puntos || a.orden - b.orden),
    [personas, votos, hoy],
  )

  /* PUESTO ÚNICO, 01 a 48 (pedido de Mariano, 2026-09-01: «no tiene que haber
     empates de puestos»). Antes se compartía el puesto entre empatados, que es
     la convención de las tablas deportivas.

     Lo que hay que tener presente, porque el dato no cambió: los empates SIGUEN
     ESTANDO. Dieciséis personas tienen exactamente 7,3 y otras nueve están en
     grupos de dos y tres —veinticinco de cuarenta y ocho—. Con puesto único, el
     orden adentro de cada grupo lo pone el desempate y no una diferencia de
     puntos: entre el 24.º y el 39.º no hay nada que los separe salvo el tamaño
     de la empresa. La pastilla de Puntos, que va al lado, lo deja ver. */
  const puestos = useMemo(() => {
    const m: Record<string, number> = {}
    filas.forEach((p, i) => {
      m[p.slug] = i + 1
    })
    return m
  }, [filas])

  const sinCredito = `Ya usaste tus ${LIMITE} votos de esta semana`
  const yaVoto = 'Ya votaste a esta persona; el voto no se edita hasta el lunes'
  const enCorte = 'Tu voto quedó registrado y entra en el próximo corte'

  return (
    <>
      {/* Los rótulos de columna. Sin ellos el número y los chevrones no se
          sabe qué son — el badge podía leerse como un precio o un porcentaje.
          Los anchos repiten los de la fila para que caigan a plomo. */}
      {/* La cabecera usa la MISMA grilla que la fila —.s-persona y .s-pcab
          comparten grid-template-columns— así que las columnas caen a plomo
          sin que nadie sincronice anchos a mano. Antes eran dos flex y la
          cabecera reservaba 100px para un voto que medía 98. */}
      <div className="s-pcab hidden sm:grid">
        <span />
        {/* «Persona» arranca en la FOTO y no en el nombre: la columna que
            rotula empieza ahí. Ocupando sólo la del nombre, el rótulo quedaba
            60px corrido a la derecha del bloque que describe. */}
        <span style={{ gridColumn: '2 / 4' }}>Persona</span>
        <span className="text-right">Puntos</span>
        <span className="text-center">Voto semanal</span>
      </div>
      {filas.map((p, i) => {
        const mio = votos[p.slug]?.v
        const votado = mio !== undefined
        const agotado = !votado && restantes === 0
        /* Cuántos puestos se movió respecto del orden sin votos. Positivo =
           subió.

           SE MUESTRA EN LA FICHA Y NO EN LA FILA (pedido de Mariano,
           2026-09-02: «tampoco sé qué es ese número abajo del puesto»). Estaba
           debajo del número de puesto como un chevrón y una cifra, sin rótulo:
           quien no lo construyó no tiene forma de saber que son puestos y no
           votos, ni contra qué se compara. Un indicador que hay que explicar no
           está funcionando.

           En la ficha va con la palabra adelante y deja de ser adivinanza. Y de
           paso la columna de 28px se queda sólo con el puesto, que es lo único
           que tiene que decir. */
        const salto = p.pendiente ? 0 : base[p.slug] - puestos[p.slug]
        /* LA FILA VOTADA QUEDA TEÑIDA toda la semana, no un instante. El voto
           dura hasta el lunes, así que la marca dura lo mismo: al volver, las
           filas teñidas son las cinco que elegiste. Un destello al hacer clic
           se pierde apenas mirás para otro lado. */
        const marca = votado ? (mio === 1 ? ' s-persona--favor' : ' s-persona--contra') : ''
        const abre = abierta === p.slug
        return (
          <Fragment key={p.slug}>
          {/* La fila ENTERA abre la ficha. No hay un chevrón de «ver más»: la
              fila ya tiene dos chevrones que son el voto, y un tercero al lado
              se lee como un tercer control de lo mismo. El cursor y el fondo
              del hover, que ya existían, alcanzan para decir que se toca.

              Es un div con role/tabIndex y no un <button>: adentro viven los
              dos botones del voto, y un botón dentro de otro botón es HTML
              inválido y un lector de pantalla que no sabe qué anunciar. */}
          <div
            className={`s-persona s-persona--abre${marca}${abre ? ' s-persona--abierta' : ''}`}
            role="button"
            tabIndex={0}
            aria-expanded={abre}
            aria-controls={`ficha-${p.slug}`}
            onClick={() => setAbierta(abre ? null : p.slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setAbierta(abre ? null : p.slug)
              }
            }}
          >
            <span className="flex flex-col items-start gap-0.5">
              <span
                className="s-mono text-[11px]"
                /* EL PUESTO VA EN ink-2, SIEMPRE. En ink-3 medía 2,72 en
                   claro y 3,08 en oscuro: reprobado, y cuarenta y ocho veces.
                   La §10.1 deja ink-3 sólo para «metadata que nadie precisa
                   leer» y advierte que la referencia lo usa mal justamente
                   así; en un ranking el puesto no es decoración, es lo que
                   cada uno viene a buscar. En ink-2 pasa a 5,84 sobre la card
                   y 5,21 sobre el tinte de una fila votada.

                   Antes subía sólo en las filas votadas, que arreglaba cinco
                   de cuarenta y ocho. */
                style={{ color: 'var(--ink-2)' }}
              >
                {/* Sin el «=» del empate y sin el espacio duro que le
                    reservaba el lugar: ese carácter corría el número tres
                    píxeles a la derecha y lo dejaba desalineado con todo lo
                    que caía debajo en la misma columna. */}
                {String(puestos[p.slug]).padStart(2, '0')}
              </span>

            </span>

            {/* La cara es un ancla de identidad, no una foto: 32px, que es lo
                que deja la fila en la altura del resto de las listas del sitio.
                Cuando no hay imagen cae al monograma, que es la misma pieza que
                usa la lista de empresas. */}
            <Cara slug={p.slug} nombre={p.nombre} hay={p.foto} />

            {/* Tres renglones —nombre, cargo, empresa— y no dos: 19,5 + 17,25
                + 17,25 llenan el alto de la foto de 60. En dos, la foto quedaba
                23px más alta que la columna que acompaña. */}
            <span className="flex min-w-0 flex-col justify-center">
              {/* SIN EL CHIP DE «SIN CONFIRMAR» (pedido de Mariano,
                  2026-09-01). El campo `confirmado` ni siquiera llega acá: se
                  quedó del lado del servidor, ver `PersonaFila`.

                  Lo que se pierde y conviene tener escrito: dieciocho de los
                  cuarenta y ocho cargos no están verificados, y varios salen de
                  registros de 2017 y 2018. La página los publica sin distinguir
                  de los que sí lo están. La apuesta es que si alguno está mal,
                  la empresa escriba. */}
              <span className="s-cuerpo flex items-center gap-1.5 font-medium">
                <span className="truncate">{p.nombre}</span>
              </span>
              <span className="s-micro block truncate" style={{ color: 'var(--ink-2)' }}>
                {p.cargo || '—'}
              </span>
              {/* La empresa en ink-2 y no en ink-3: medido daba 2,72 en claro.
                  ink-3 es para metadata que nadie necesita leer —un número de
                  sección, una unidad— y qué empresa dirige esta persona es el
                  dato que sostiene toda la fila. Queda del mismo tono que el
                  cargo, que es correcto: los dos son el contexto del nombre. */}
              <span className="s-micro block truncate" style={{ color: 'var(--ink-2)' }}>
                {p.empresa}
              </span>
            </span>

            {/* El voto NO abre la ficha: se para la propagación en el
                envoltorio de los controles. Sin esto, votar abría la ficha de
                la fila que acabás de votar. */}
            <span className="s-pcontrol" onClick={(e) => e.stopPropagation()}>
            {/* EL PUNTO COMO SEPARADOR DECIMAL (pedido de Mariano,
                2026-09-01), y sólo acá. El resto del sitio va en es-AR con
                coma, que es la convención del país: el puntaje queda como la
                única cifra de la web con punto. Se pide el locale en vez de
                reemplazar el carácter, así el formateo sigue saliendo de
                `formatDecimal` y nadie lo hardcodea en la fila. */}
            <span className="s-idx">{formatDecimal(p.puntos, 1, 'en')}</span>

            {/* Sin el conteo (pedido de Mariano): quedan los dos chevrones. Lo
                único que se pierde es el número; el estado del voto propio se
                sigue viendo, porque el botón elegido queda con su tinte.

                VOTADA LA FILA, EL PAR SE VA Y QUEDA EL BADGE. No conviven: el
                voto no se edita hasta el lunes, así que los dos botones que
                quedaban eran controles muertos, y sumarles un chip abajo daba
                tres piezas diciendo lo mismo en una celda de 100px.

                Con una sola pieza por celda la fila vuelve a tener una altura
                y un eje: el badge mide 22, igual que el de Puntos al lado, y
                los dos caen centrados en el mismo renglón. */}
            <span className="s-voto">
              {votado ? (
                <span
                  className={`s-chip ${mio === 1 ? 's-chip--ok' : 's-chip--bad'}`}
                  title={p.pendiente ? enCorte : yaVoto}
                >
                  {/* EL ÍCONO DICE EN QUÉ ESTADO ESTÁ EL VOTO. Contado, es el
                      chevrón del botón que apretaste: el badge ocupa su lugar y
                      hereda su gramática. Emitido hoy y todavía sin contar, es
                      el reloj.

                      El reloj estaba suelto en la columna del puesto, debajo
                      del número, en una celda de 28px que no es suya: ahí no se
                      entendía a qué se refería y quedaba desalineado. Acá
                      califica al badge que tiene al lado, que es exactamente lo
                      que hace. */}
                  <Icono
                    d={p.pendiente ? PATH.reloj : mio === 1 ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                    size={11}
                    grosor={p.pendiente ? 2.2 : 2.6}
                  />
                  {mio === 1 ? 'A favor' : 'En contra'}
                </span>
              ) : (
              <span className="par">
                {/* Queda UN motivo para apagar los botones: te quedaste sin
                    crédito. El otro —«ya votaste a esta persona»— dejó de
                    existir acá, porque en esa fila ya no hay botones sino el
                    badge. Dejarlos vivos y que el clic no haga nada es peor:
                    parece que se rompió. */}
                <button
                  type="button"
                  className="arriba"
                  aria-label={`Votar a favor de ${p.nombre}`}
                  disabled={agotado}
                  title={agotado ? sinCredito : undefined}
                  onClick={() => votar(p.slug, 1)}
                >
                  <Icono d="M18 15l-6-6-6 6" size={13} grosor={2.4} />
                </button>
                <button
                  type="button"
                  className="abajo"
                  aria-label={`Votar en contra de ${p.nombre}`}
                  disabled={agotado}
                  title={agotado ? sinCredito : undefined}
                  onClick={() => votar(p.slug, -1)}
                >
                  <Icono d="M6 9l6 6 6-6" size={13} grosor={2.4} />
                </button>
              </span>
              )}
            </span>
            </span>
          </div>
          {abre && <Ficha p={p} puesto={puestos[p.slug]} total={filas.length} salto={salto} />}
          </Fragment>
        )
      })}
    </>
  )
}

/* LA FICHA. Lo que la fila no puede mostrar en 76px de alto.

   NO ES UN COMPONENTE NUEVO: es .s-ficha-fila, que estaba declarado en el CSS
   y sin usar en ningún .tsx —«el desglose que se abre al clickear una fila de
   la lista: etiqueta a la izquierda, valor a la derecha, un renglón por
   dato»—. Estaba escrito para esto exactamente. Lo mismo que pasó con
   .s-creditos en la cabecera.

   LA FOTO VA A 161×200, que es el tamaño NATIVO del archivo: no se amplía
   nada, así que no hay borrón. Y 161 ya es una medida del sistema —el lado de
   .s-placa--grande— así que no se inventa un número.

   LA COMPOSICIÓN es la que enseña .s-placa--grande: la imagen iguala el alto
   de la columna que acompaña para que las dos terminen a ras. Acá no se puede
   clavar, porque la bio cambia de largo y veintiséis fichas no tienen; se
   resuelve al revés, con la columna estirada a la altura de la foto y los
   datos empujados al pie. El bloque cierra parejo tenga bio o no, que es la
   condición para que la ausencia no se lea como una ficha rota.

   NO LLEVA CIFRAS DE LA EMPRESA: producción, valor y pozos son los tres
   insumos del índice. Ver el comentario de `PersonaFila`.

   TAMPOCO REPITE LOS PUNTOS. Estaban como cuarto renglón y son el mismo número
   que la fila de arriba muestra a ocho píxeles: no agregaba nada y estiraba la
   columna 27px por encima del alto de la foto, que es justo lo que rompía el
   cierre a ras. El puesto sí queda, porque «07 de 48» es contexto que la fila
   sola no da. */
/** Cuánto lleva en el cargo, a partir de un año, un año-mes o una fecha
    completa: casi ninguna fuente da el día.

    Bajo el año se cuenta en meses —«10 meses» dice más que «0 años»— y arriba
    se trunca, que es como se lee «años en el cargo»: quien lleva dos años y
    nueve meses lleva dos años, no tres. El arranque exacto queda en el title,
    así que redondear no esconde nada. */
function calcularAntiguedad(desde?: string) {
  if (!desde) return null
  const [a, m] = desde.split('-').map(Number)
  const inicio = new Date(a, (m || 1) - 1, 1)
  if (Number.isNaN(inicio.getTime())) return null
  const hoy = new Date()
  const meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() - ((m || 1) - 1))
  if (meses < 0) return null
  const años = Math.floor(meses / 12)
  const MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return {
    txt: años >= 1 ? `${años} ${años === 1 ? 'año' : 'años'}` : `${meses} ${meses === 1 ? 'mes' : 'meses'}`,
    desde: m ? `En el cargo desde ${MES[m - 1]} de ${a}` : `En el cargo desde ${a}`,
  }
}

function Ficha({
  p,
  puesto,
  total,
  salto,
}: {
  p: PersonaFila
  puesto: number
  total: number
  /** puestos ganados desde el orden sin votos. Positivo = subió. */
  salto: number
}) {
  const antiguedad = calcularAntiguedad(p.enElCargoDesde)
  return (
    <div className="s-ficha s-entra" id={`ficha-${p.slug}`}>
      <CaraGrande slug={p.slug} nombre={p.nombre} hay={p.foto} />

      <div className="s-ficha-col">
        {/* EL TÍTULO ES EL NOMBRE (pedido de Mariano). Repite el de la fila de
            arriba, sí, y es lo correcto: con la foto de 200 la ficha pesa como
            una card propia y una card sin nombre no se entiende sola. Antes
            encabezaba el cargo, que ahorraba la repetición y dejaba el bloque
            sin sujeto.

            13/600 —.s-titulo—, no más: la jerarquía la hace el peso y la
            tinta, nunca el tamaño.

            Debajo, el cargo ENTERO, que en la fila va truncado: es una de las
            razones de que la ficha exista. */}
        <div className="s-titulo">{p.nombre}</div>
        <div className="s-micro" style={{ color: 'var(--ink-2)' }}>
          {p.cargo || '—'} · {p.empresa}
        </div>

        {/* La bio si existe, en la prosa del sistema —13/19,5— y con el ancho
            cortado en ch: a 380px de columna una línea de 13px entra en unos
            60 caracteres y ahí se lee sin que el ojo se pierda al volver.

            Veintiséis de las cuarenta y ocho no tienen, y no se rellena con
            prosa plausible: es el error que ya costó doce caras inventadas.
            Lo que sostiene la ficha cuando falta es el pie, que va siempre. */}
        {p.bio && (
          <p className="s-cuerpo s-ficha-bio" style={{ color: 'var(--ink-2)' }}>
            {p.bio}
          </p>
        )}

        {/* El pie, empujado abajo por el margin-top:auto de .s-ficha-datos. Es
            lo que hace verificable la fila y por eso va siempre, con bio o
            sin ella. */}
        <div className="s-ficha-datos">
          <div className="s-ficha-fila">
            <span style={{ color: 'var(--ink-2)' }}>Puesto</span>
            <span className="s-ficha-valor ml-auto">
              {String(puesto).padStart(2, '0')}
              {/* «de 48» en ink-3 medía 2,56. Es la mitad de la frase —sin eso
                  el 02 no dice de cuántos— así que sube a ink-2: 5,5. */}
              <span className="font-normal" style={{ color: 'var(--ink-2)' }}>
                {' '}
                de {total}
              </span>
            </span>
          </div>
          {/* EL MOVIMIENTO, rotulado. Es .s-delta, la primitiva del sistema
              para una variación, que estaba en el CSS con la receta medida:
              11,5 en peso 400, sin fondo, sin padding, sin radio y —textual—
              «no lleva flecha ni triangulito: es texto de color y nada más».
              En la fila yo le había puesto un chevrón, que es justo lo que la
              primitiva descarta.

              El menos es el real (U+2212) y no un guion, como pide el mismo
              comentario: a 11,5px el guion queda más corto y más alto que el
              «+» y la columna se ve desprolija.

              Sin movimiento no hay renglón: «0 puestos» ocupa lugar para decir
              que no pasó nada. */}
          {salto !== 0 && (
            <div className="s-ficha-fila">
              <span style={{ color: 'var(--ink-2)' }}>Movimiento</span>
              <span className={`s-delta ml-auto ${salto > 0 ? 's-delta--sube' : 's-delta--baja'}`}>
                {salto > 0 ? '+' : '\u2212'}
                {Math.abs(salto)} {Math.abs(salto) === 1 ? 'puesto' : 'puestos'}
              </span>
            </div>
          )}
          {/* AÑOS EN EL CARGO, no la fecha en que se verificó (pedido de
              Mariano, 2026-09-02: «lo del cargo registrado no sirve»). El
              renglón anterior mostraba `desde`, que es la fecha de la FUENTE:
              la ficha de Marín decía 2026 cuando asumió en diciembre de 2023, y
              la de Mindlin decía 2026 estando en el directorio desde 2006.

              Sale de `enElCargoDesde`, que es un campo aparte y verificado uno
              por uno. Hay trece de cuarenta y ocho; el resto omite el renglón
              en vez de calcular sobre un dato que no es. */}
          {antiguedad && (
            <div className="s-ficha-fila">
              <span style={{ color: 'var(--ink-2)' }}>Años en el cargo</span>
              <span className="s-ficha-valor ml-auto" title={antiguedad.desde}>
                {antiguedad.txt}
              </span>
            </div>
          )}
          {/* EL RENGLÓN DE «FUENTE» SALIÓ (pedido de Mariano) y en su lugar va
              el canal de corrección. El link probaba que el cargo se verificó,
              pero dieciocho de cuarenta y ocho no tienen fuente: aparecía en
              unas filas y en otras no, que es marcar cuáles están sin
              confirmar —justo lo que se sacó con el chip—. El aviso va en las
              cuarenta y ocho por igual. */}
          <div className="s-ficha-fila">
            <span style={{ color: 'var(--ink-2)' }}>Correcciones</span>
            <span className="ml-auto">
              <AvisoDato nombre={p.nombre} empresa={p.empresa} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** La cara de la ficha, en 161×200, con la misma caída al monograma.

    VA CON srcset PORQUE 161×200 ES LA MEDIDA EN CSS, NO EN PÍXELES. En una
    pantalla Retina —devicePixelRatio 2, que es cualquier Mac— esa caja son 322
    por 400 píxeles reales, y el archivo de 161 se agranda al doble: se ve
    exactamente igual de borroso que ampliar cualquier imagen, que es lo que
    --placa-tope evita en la placa de logo.

    En la fila no hace falta: la cara chica se muestra a 60 y el archivo de 161
    ya cubre los 120 que pide Retina. Por eso el @2x existe sólo para la ficha,
    que además se monta recién al abrir la fila: en la lista no se baja ninguno.

    El navegador elige: 1x en pantalla común, 2x en Retina. El `src` queda como
    respaldo para quien no entienda srcset. */
function CaraGrande({ slug, nombre, hay }: { slug: string; nombre: string; hay: boolean }) {
  const { rota, alMontar, marcarRota } = useCaidaAMonograma()
  if (!hay || rota) return <span className="s-cara-gr s-cara--mono">{iniciales(nombre)}</span>
  return (
    <img
      ref={alMontar}
      className="s-cara-gr"
      src={`/images/ceos/${slug}.jpg`}
      srcSet={`/images/ceos/${slug}.jpg 1x, /images/ceos/${slug}@2x.jpg 2x`}
      alt=""
      width={161}
      height={200}
      loading="lazy"
      decoding="async"
      onError={marcarRota}
    />
  )
}

/** La cara, con caída al monograma. El `onError` es la caída de verdad: el
    archivo puede no estar —las imágenes no se versionan— y una cara rota es
    peor que dos iniciales. */
/** LA CAÍDA AL MONOGRAMA. Es la segunda línea: quién tiene cara lo decide el
    servidor (ver page.tsx), así que acá no debería fallar ninguna. Queda para
    el archivo que se borre después del build.

    `onError` NO ALCANZA por sí solo: la lista se renderiza en el servidor,
    así que el navegador empieza a bajar las imágenes mientras parsea el HTML.
    Las que fallan ahí lo hacen ANTES de que React hidrate y enganche el
    manejador, así que el evento se dispara contra nadie y la fila queda con el
    ícono de imagen rota para siempre. Medido: dieciséis de cuarenta y ocho.

    Las de más abajo se salvaban de casualidad, porque con loading="lazy" no
    empiezan a bajar hasta que se las scrollea y para entonces ya hidrató. Por
    eso se veía sólo a veces, y arriba de todo.

    El ref se ejecuta al montar y pregunta por el estado que quedó: `complete`
    con `naturalWidth` en cero es exactamente «terminó y no cargó». Es la única
    forma de enterarse de un error que pasó antes de existir. */
function useCaidaAMonograma() {
  const [rota, setRota] = useState(false)
  const alMontar = useCallback((n: HTMLImageElement | null) => {
    if (n && n.complete && n.naturalWidth === 0) setRota(true)
  }, [])
  return { rota, alMontar, marcarRota: () => setRota(true) }
}

/** Primera y última inicial. La usan la cara de la fila y la de la ficha. */
function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((x) => x[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join('')
    .toUpperCase()
}

function Cara({ slug, nombre, hay }: { slug: string; nombre: string; hay: boolean }) {
  const { rota, alMontar, marcarRota } = useCaidaAMonograma()
  if (!hay || rota) return <span className="s-cara s-cara--mono">{iniciales(nombre)}</span>
  return (
    <img
      ref={alMontar}
      className="s-cara"
      src={`/images/ceos/${slug}.jpg`}
      alt=""
      width={161}
      height={200}
      loading="lazy"
      decoding="async"
      onError={marcarRota}
    />
  )
}
