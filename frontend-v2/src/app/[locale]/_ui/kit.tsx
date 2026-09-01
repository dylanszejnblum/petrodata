import type { ReactNode } from 'react'
import { formatDelta } from '@/lib/format'

/* Kit del sistema V2. Las piezas son las mismas que tiene el producto —dato,
   ranking, tabla, fila— pero compuestas como pide el sistema medido, no como
   las teníamos.

   Las dos reglas que gobiernan todo lo de acá:
   · La jerarquía es peso y tinta, nunca tamaño. Nada pasa de 21px.
   · Los planos se separan con un anillo de 1px, nunca con sombra difusa. */

/** Cabecera de sección: número, título y descripción en UNA línea alineada
    por línea de base. Es lo que permite repetir la plantilla sin que se lea
    como un formulario: la sección gasta un renglón en presentarse.

    La cabecera va DENTRO del marco (pedido de Mariano, 2026-08-14). Afuera
    quedaba flotando sobre el fondo y el marco arrancaba huérfano; adentro, el
    marco pasa a contener la sección entera —rótulo, contenido y aclaración—
    y se lee como una unidad. El marco es ahora universal: si el rótulo vive
    adentro, no puede haber secciones sin marco donde no tenga dónde vivir. */
export function Seccion({
  n,
  titulo,
  desc,
  ancho,
  children,
}: {
  n: string
  titulo: string
  /** Opcional: hay secciones cuyo título ya dice todo y una bajada sería
      repetirlo con otras palabras. Sin `desc`, el <p> no se dibuja —vacío
      dejaría un renglón de aire en la cabecera. */
  desc?: string
  /** 'lectura' angosta la sección a 636. Es para la página de una nota, que es
      la única de largo aliento: a 672 los párrafos dan unos 81 caracteres por
      renglón. Va en la sección y no adentro para que el aire que sobra quede a
      la derecha de la columna y no de un solo lado del marco. Si una sección de
      la nota se quedara en 672 al lado de otra en 636, el salto se vería. */
  ancho?: 'lectura'
  children: ReactNode
}) {
  return (
    <section
      className={`s-seccion ${ancho === 'lectura' ? 's-seccion--lectura' : ''}`}
      id={`s${n}`}
    >
      <div className="s-marco">
        <header className="mb-3 flex flex-wrap items-baseline gap-2 px-1">
          <span className="s-mono shrink-0 text-[11px]" style={{ color: 'var(--ink-3)' }}>
            {n}
          </span>
          <h2 className="s-titulo m-0 whitespace-nowrap">{titulo}</h2>
          {desc && <p className="s-desc s-desc-trunca m-0 min-w-0 flex-1">{desc}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}

/** Dato: rótulo, cifra, unidad y variación. La cifra manda por peso, no por
    tamaño — 21px la principal, 16px las de apoyo. */
export function Dato({
  rotulo,
  valor,
  unidad,
  delta = null,
  nota,
  grande = false,
}: {
  rotulo: string
  valor: string
  unidad?: string
  delta?: number | null
  nota?: string
  grande?: boolean
}) {
  const d = formatDelta(delta)
  return (
    <div className="min-w-0">
      <p className="s-etq m-0">{rotulo}</p>
      <p className="m-0 mt-1 flex items-baseline gap-1.5">
        <span className={grande ? 's-cifra' : 's-cifra-sm'}>{valor}</span>
        {unidad && (
          <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
            {unidad}
          </span>
        )}
      </p>
      {(nota || d) && (
        <p className="s-micro m-0 mt-1 flex items-center gap-1.5">
          {/* Sin flecha. El delta MEDIDO en la referencia es texto pelado:
              <span class="text-green tabular-nums">+74</span>, sin triángulo,
              sin ícono, sin fondo. Y el menos es el real (U+2212), que a este
              tamaño se alinea con el "+"; el guion queda más corto y más alto
              y la columna se ve despareja. */}
          {d && (
            <span className={`s-delta ${d.dir === 'up' ? 's-delta--sube' : 's-delta--baja'}`}>
              {d.dir === 'up' ? '+' : '\u2212'}
              {d.label}
            </span>
          )}
          {nota && <span style={{ color: 'var(--ink-2)' }}>{nota}</span>}
        </p>
      )}
    </div>
  )
}

/** Barra de cabecera de card — .primitive-card-bar MEDIDO: padding 10×12 y
    borde abajo. Es la ranura más usada de la card en la referencia: cinco
    usos, más que el propio card-pad. */
export function CardBarra({ children }: { children: ReactNode }) {
  return <div className="s-barra-card">{children}</div>
}

/** Pie de card — .primitive-card-footer MEDIDO: mismo padding 10×12, borde
    ARRIBA y fondo --inset. Es donde la referencia baja lo que califica a la
    card entera, separado del cuerpo por el escalón de fondo. */
export function CardPie({ children }: { children: ReactNode }) {
  return <div className="s-pie-card">{children}</div>
}

/** Medidor de tres barras — MEDIDO en la Recommendation Card: 4×10 cada una,
    2px de separación, radio completo, alineadas abajo. Allá dice el nivel de
    confianza del agente; acá, en cuántos tercios cae una proporción. */
export function Medidor({ nivel, de = 3 }: { nivel: number; de?: number }) {
  return (
    <span className="s-medidor shrink-0" aria-hidden>
      {Array.from({ length: de }, (_, i) => (
        <i key={i} className={i < nivel ? 'on' : undefined} />
      ))}
    </span>
  )
}

/** Fila de ranking: rango en mono, nombre, valor a la derecha y barra fina.
    La barra va neutra y sólo el líder toma el acento — el acento es para
    detalles, nunca para llenar superficies. */
export function FilaRanking({
  n,
  nombre,
  valor,
  pct,
  lider = false,
  nota,
  marca = false,
  tag,
  tagColor,
  delta,
  unidad,
  color,
}: {
  n: number
  nombre: string
  valor: string
  /** 0..1 — proporción a dibujar. Sin valor, no hay barra. */
  pct?: number
  lider?: boolean
  nota?: string
  /** pastilla con la inicial, al principio de la fila */
  marca?: boolean
  /** tag categórico al lado del nombre */
  tag?: string
  /** color del tag; sale de asignarColores() */
  tagColor?: string
  /** puestos que se mueve respecto de otro ranking. 0 no se dibuja. */
  delta?: number
  /** unidad de la cifra. Va en CADA fila y no sólo en la cabecera de la card:
      a once filas de distancia la cabecera no alcanza para saber qué se está
      mirando, que es como confundimos pozos con MUSD en provincias. */
  unidad?: string
  /** color categórico de la fila. Si viene, lo toma la barra y desplaza al
      acento del líder: cuando la categoría significa algo, el color tiene que
      decir la categoría y no el puesto. */
  color?: string
}) {
  /* La barra va en su PROPIA columna, no debajo del nombre: pegada al texto
     se lee como un subrayado y no como una magnitud. Y el riel se dibuja
     siempre —aunque el valor sea chico— para que se entienda que hay una
     escala detrás. */
  return (
    <div className="s-fila s-fila-hover">
      <span className="s-mono w-5 shrink-0 text-[11px]" style={{ color: 'var(--ink-3)' }}>
        {String(n).padStart(2, '0')}
      </span>
      {/* El delta va pegado al número de puesto porque es del PUESTO. Al final
          de la fila, después de la cifra, se leería como una variación de la
          cifra, que es otra cosa.

          Ancho fijo aunque esté vacío: seis de las once filas no se mueven, y
          sin la columna reservada los nombres arrancarían en x distintas. El
          cero no se dibuja —un "0" verde o rojo sería color sin significado— y
          así los que sí se mueven saltan solos. */}
      {delta !== undefined && (
        <span
          className={`shrink-0 text-right ${
            delta === 0 ? '' : delta > 0 ? 's-delta s-delta--sube' : 's-delta s-delta--baja'
          }`}
          style={{ width: 18 }}
        >
          {delta === 0 ? '' : delta > 0 ? `+${delta}` : `\u2212${Math.abs(delta)}`}
        </span>
      )}
      {marca && <Marca nombre={nombre} />}
      {/* La nota va en la MISMA línea, como badge, y no en un segundo renglón.
          Con el renglón de abajo la fila medía 60px contra los 40 de las demás
          listas de v2, y era la única de la página con dos alturas. Es el mismo
          arreglo que ya se hizo en provincias. */}
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="s-cuerpo min-w-0 truncate font-medium">{nombre}</span>
        {tag && tagColor && <Tag color={tagColor}>{tag}</Tag>}
        {nota && <span className="s-chip s-chip--neutro s-chip--mini shrink-0">{nota}</span>}
      </span>
      {pct !== undefined && (
        <span
          className={`s-barra hidden w-16 shrink-0 sm:block ${lider && !color ? 's-barra--lider' : ''}`}
          aria-hidden
          style={color ? { ['--barra-color' as string]: color } : undefined}
        >
          <i style={{ width: `${Math.max(3, pct * 100)}%` }} />
        </span>
      )}
      <span className="flex shrink-0 items-baseline justify-end gap-1 sm:w-24">
        {/* min-w y no w: a 375 la caja fija de 40px cortaba «329.176» en
            «329.1…». El nombre de al lado ya es flex-1 truncate, así que
            dejar que la cifra tome su ancho natural no desborda nada — y una
            cifra cortada no es una cifra. */}
        <span className="s-num min-w-10 text-right text-[13px] font-medium">{valor}</span>
        {unidad && (
          <span className="hidden text-[11px] sm:inline" style={{ color: 'var(--ink-3)' }}>
            {unidad}
          </span>
        )}
      </span>
    </div>
  )
}

/** Fila simple de lectura: etiqueta a la izquierda, valor a la derecha. */
export function FilaDato({
  etiqueta,
  valor,
  delta = null,
  unidad,
  color,
}: {
  etiqueta: string
  valor: string
  delta?: number | null
  unidad?: string
  /** color de la categoría a la que pertenece la fila. Un punto y nada más:
      el sistema no tiene filas de color, tiene marcas de color. */
  color?: string
}) {
  const d = formatDelta(delta)
  return (
    <div className="s-fila s-fila-hover">
      {color && (
        <i
          aria-hidden
          className="block size-1.5 shrink-0 rounded-full"
          style={{ background: color }}
        />
      )}
      <span className="s-etq min-w-0 flex-1 truncate">{etiqueta}</span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className="s-num text-[13px] font-medium">{valor}</span>
        {unidad && (
          <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
            {unidad}
          </span>
        )}
      </span>
      {d && (
        <span
          className={`s-delta s-num w-14 shrink-0 text-right ${
            d.dir === 'up' ? 's-delta--sube' : 's-delta--baja'
          }`}
        >
          {d.dir === 'up' ? '+' : '\u2212'}
          {d.label}
        </span>
      )}
    </div>
  )
}

/** Card: el plano que sostiene contenido. Anillo de 1px, nunca sombra. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`s-card ${className}`}>{children}</div>
}

/** Cabecera de card: rótulo a la izquierda, apunte a la derecha. */
export function CardHead({ titulo, nota }: { titulo: string; nota?: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-b px-3 py-2.5"
      style={{ borderColor: 'var(--line)' }}
    >
      <span className="s-etq">{titulo}</span>
      {nota && <span className="s-micro s-num" style={{ color: 'var(--ink-2)' }}>{nota}</span>}
    </div>
  )
}

export function Chip({
  tono = 'neutro',
  children,
}: {
  tono?: 'ok' | 'warn' | 'bad' | 'info' | 'neutro'
  children: ReactNode
}) {
  return <span className={`s-chip s-chip--${tono}`}>{children}</span>
}

/** Pie de sección: la línea de contexto que cierra. Va en ink-2 y no en la
    tinta más tenue — es una aclaración que hay que poder leer, y la regla del
    proyecto (SISTEMA.md §10.1) reserva ink-3 para metadata pura. */
export function Pie({ children }: { children: ReactNode }) {
  return (
    <p className="s-micro m-0 mt-2.5 px-1" style={{ color: 'var(--ink-2)' }}>
      {children}
    </p>
  )
}

/* ── Fila de noticia ────────────────────────────────────────────────────
   La foto ocupa la columna donde antes iba la fecha, y la fecha baja a la
   línea de la fuente (pedido de Mariano, 2026-08-14). Gana la lista: la
   miniatura distingue una nota de otra de un vistazo, cosa que una fecha
   repetida no hace, y la fecha sigue estando donde uno la busca cuando ya
   eligió qué leer.

   Sólo 1 de las 20 notas trae imagen propia, así que las demás caen a una
   por categoría. El mapa es determinista: la misma nota muestra siempre la
   misma foto, y no una al azar en cada visita.

   Van en blanco y negro lavado, el mismo tratamiento que la card del
   índice: veinte miniaturas a todo color competirían con los datos, que es
   lo único que en este sistema tiene permitido llevar color.

   El título se recorta a dos líneas y el resumen también. No es sólo estética:
   con texto de alto libre cada fila medía distinto y la foto —de alto fijo—
   terminaba en un lugar distinto en cada una. Recortado, todas las filas
   miden lo mismo y la foto, que se estira al alto de la fila, mide lo mismo
   en todas. Es además el ritmo invariante que pide el sistema. */

const FOTOS = [
  'news-produccion-rig',
  'news-regulacion-pumpjacks',
  'news-gnl-buque',
  'news-infraestructura-oleoducto',
  'news-empresas-refineria',
  'news-mercado-noche',
]

/** Categorías que tienen una foto que las representa de verdad. */
const FOTO_POR_CATEGORIA: Record<string, string> = {
  produccion: 'news-produccion-rig',
  regulacion: 'news-regulacion-pumpjacks',
  exportacion: 'news-gnl-buque',
  rigi: 'news-infraestructura-oleoducto',
  laboral: 'news-empresas-refineria',
}

/** Recorte a N líneas con alto fijo de N líneas: el bloque mide siempre lo
    mismo, entre el título en una línea o en cuatro. Va inline y no con la
    utilidad line-clamp de Tailwind, que en estas filas no llegaba a aplicarse
    —el display computaba flow-root y el recorte necesita -webkit-box—.

    Exportada porque las cards de empresas la usan por el mismo motivo: las
    reseñas del fixture miden distinto y sin recorte las tres cards de la
    sección medían 171, 189 y 171. El ritmo invariante es una regla del
    sistema, no una casualidad de los datos. */
export function recorte(lineas: number, alturaLinea: number): React.CSSProperties {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lineas,
    overflow: 'hidden',
    height: alturaLinea * lineas,
  }
}

/** Suma determinista del id: la misma nota muestra siempre la misma foto. */
function reparte(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return FOTOS[h % FOTOS.length]
}

/** Foto de una nota: la propia, si no la de su categoría, si no una
    repartida por id. Sin este último paso, las tres categorías genéricas
    —actualidad, inversión, financiamiento— caían todas en la misma imagen y
    once de veinte filas mostraban la misma miniatura, que es justo lo que la
    miniatura viene a evitar. */
function fotoDe(id: string, categoria: string, propia?: string): string {
  return propia ?? `/images/news/${FOTO_POR_CATEGORIA[categoria] ?? reparte(id)}.jpg`
}

export function FilaNoticia({
  id,
  href,
  titulo,
  resumen,
  fuente,
  fecha,
  categoria,
  rotulo,
  minutos,
  imagen,
}: {
  id: string
  href: string
  titulo: string
  resumen?: string
  fuente: string
  /** ISO; se muestra recortada a la fecha */
  fecha: string
  /** la CLAVE de la categoría: manda el color y la foto, no se muestra */
  categoria: string
  /** lo que se muestra en el tag. Va aparte de `categoria` porque el color y
      la foto se indexan por la clave cruda —«exportacion»— y lo que hay que
      leer es la etiqueta —«Exportación»—. Sin este par, la lista mostraba las
      claves del fixture en minúscula y sin acentos. */
  rotulo?: string
  minutos?: number
  /** imagen propia de la nota; si falta, cae a la de su categoría */
  imagen?: string
}) {
  const src = fotoDe(id, categoria, imagen)
  return (
    /* alignItems inline: .s-fila centra por defecto y la clase de Tailwind
       tiene la misma especificidad, así que cuál gana depende del orden del
       CSS compilado. La foto tiene que arrancar a la altura del título. */
    <a
      href={href}
      className="s-fila s-fila-hover s-fila-nota no-underline"
      style={{ color: 'inherit', alignItems: 'flex-start' }}
    >
      {/* La foto ocupa el ALTO DE LA COLUMNA que acompaña (pedido de Mariano,
          2026-08-21). Medía 56 fijos contra un bloque de texto de 100 cuando
          hay resumen, así que flotaba arriba y el texto le pasaba 44px de
          largo — la misma queja que la placa de logo de la card de empresa.

          Las medidas viven en .s-foto-nota, en sistema.css: tienen que poder
          cambiar en una media query y un estilo inline le gana a cualquier
          regla de hoja. */}
      <img
        src={src}
        alt=""
        width={640}
        height={640}
        loading="lazy"
        decoding="async"
        className={`s-foto-nota shrink-0 ${resumen ? 's-foto-nota--grande' : ''}`}
        style={{
          objectFit: 'cover',
          borderRadius: 'var(--radius-control)',
          filter: 'grayscale(1) contrast(0.9)',
        }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="s-cuerpo font-medium" style={recorte(2, 19.5)}>
          {titulo}
        </span>
        {/* El envoltorio existe para poder esconderlo. `recorte()` devuelve un
            `display: -webkit-box` INLINE, y un estilo inline le gana al
            `display: none` de la media query que saca el resumen a 640: la
            regla se aplicaba y no pasaba nada. El de afuera no tiene estilo
            inline, así que sí se puede apagar. */}
        {resumen && (
          <span className="resumen">
            <span className="s-desc" style={{ ...recorte(2, 18.75), marginTop: 2 }}>
              {resumen}
            </span>
          </span>
        )}
        {/* mt-auto: la fuente se apoya en el pie, así el bloque de texto ocupa
            el alto entero y la foto cierra a ras.

            Y NO envuelve. Envolviendo, a 375 «Diario Río Negro · 2026-08-05 ·
            3 min» se partía en dos renglones, el bloque de texto se iba a 79
            contra los 60 de la foto y volvía el desnivel que esto vino a
            arreglar. Con nowrap la fuente se recorta —es el dato más
            prescindible de los tres— y todas las filas miden lo mismo. */}
        <span
          className="s-micro mt-auto flex min-w-0 flex-nowrap items-center gap-x-1.5 pt-1"
          style={{ color: 'var(--ink-2)' }}
        >
          <span className="truncate">{fuente}</span>
          <span className="shrink-0" style={{ color: 'var(--ink-3)' }}>·</span>
          <span className="s-mono shrink-0 text-[10.5px]">{fecha.slice(0, 10)}</span>
          {/* El tiempo de lectura se esconde a 640: con los tres datos en un
              renglón de 180px la fuente se apretaba hasta desaparecer, y de
              los tres es el más prescindible. La fuente es la firma —el dato
              que dice si creerle a la nota— y no puede ser la que se va. */}
          {minutos ? (
            <span className="min-lectura flex shrink-0 items-center gap-x-1.5">
              <span style={{ color: 'var(--ink-3)' }}>·</span>
              {minutos} min
            </span>
          ) : null}
        </span>
      </span>
      <Tag color={colorCategoria(categoria)}>{rotulo ?? categoria}</Tag>
    </a>
  )
}

/* ── Tag categórico y marca de fila ─────────────────────────────────────
   Las dos piezas que le dan acento de color y anclaje visual a las listas,
   con la receta medida de la referencia.

   La paleta son los 8 colores que la referencia inyecta como --tag-color.
   Son CATEGÓRICOS: nombran una categoría sin orden ni valor, y por eso no
   se pisan con los cuatro colores de estado del sistema —verde, naranja,
   rojo y acento—, que sí significan algo. Un tag violeta no dice "malo" ni
   "bueno": dice "esta categoría y no otra". */
export const PALETA_TAGS = [
  '#3f78ff', // azul
  '#f09a2f', // naranja
  '#9a5cff', // violeta
  '#16a6c7', // cian
  '#25a878', // verde
  '#92b72d', // lima
  '#ee6572', // rosa
  '#c84f9d', // magenta
] as const

/* ── Color por fluido ───────────────────────────────────────────────────
   ESTABLE en toda la web, y por eso vive acá y no en cada página.

   El resto de los colores categóricos salen de asignarColores(), que reparte
   la paleta por POSICIÓN dentro de cada lista: "Cuenca Neuquina" es azul en
   provincias porque es la primera por pozos, no porque el azul signifique
   cuenca neuquina. Para eso está bien —dentro de una lista, lo único que hace
   falta es que dos categorías no se repitan—.

   Petróleo y gas son otra cosa: aparecen en cinco pantallas distintas y tienen
   que ser el mismo color en todas, o el color deja de significar. Así que acá
   el color está clavado a la cosa y no al orden. Los dos salen de la paleta
   categórica medida: el 1 y el 4. */
export const FLUIDO = {
  petroleo: PALETA_TAGS[0],
  gas: PALETA_TAGS[3],
} as const

/** Asigna un color distinto a cada categoría de un conjunto.
 *
 *  Va por posición y no por hash del nombre. El hash parecía más elegante
 *  —no hace falta conocer el conjunto— pero colisiona: con seis cuencas y
 *  ocho colores, "Cuenca Neuquina" y "Cuenca Austral" caían las dos en el
 *  mismo naranja. Una paleta categórica que repite color en la misma vista
 *  no distingue nada, que es su único trabajo.
 *
 *  El orden de entrada define el color, así que conviene pasar la lista
 *  siempre ordenada igual —por ejemplo por tamaño— para que una cuenca no
 *  cambie de color entre pantallas. */
export function asignarColores(categorias: string[]): Map<string, string> {
  const m = new Map<string, string>()
  let i = 0
  for (const c of categorias) {
    if (m.has(c)) continue
    m.set(c, PALETA_TAGS[i % PALETA_TAGS.length])
    i++
  }
  return m
}

/* Las nueve categorías de noticias, en orden fijo de frecuencia. El orden
   define el color, así que una categoría lleva siempre el mismo en toda la
   web: en el dashboard y en la página de noticias.

   Son nueve sobre ocho colores, así que la última —la más rara— comparte
   color con la primera. Con 20 notas nunca aparecen juntas; si el corpus
   crece habrá que decidir entre un noveno color o agrupar categorías. */
const CATEGORIAS_NOTICIA = [
  'actualidad', 'produccion', 'inversion', 'financiamiento', 'regulacion',
  'exportacion', 'rigi', 'laboral', 'ambiente',
]
const COLOR_CATEGORIA = asignarColores(CATEGORIAS_NOTICIA)

/** Color estable de una categoría de noticia. */
export function colorCategoria(cat: string): string {
  return COLOR_CATEGORIA.get(cat) ?? PALETA_TAGS[0]
}

/* Sin color, el tag va neutro. Pasa en la fila del Estado Nacional, cuya
   "cuenca" es «Total país» y no es una cuenca: no tiene color categórico
   asignado porque no es una categoría. Antes recibía undefined, el color-mix
   fallaba y el tag salía con borde negro sobre transparente. */
export function Tag({ children, color }: { children: string; color?: string }) {
  return (
    <span
      className={color ? 's-tag' : 's-tag s-tag--neutro'}
      style={color ? { ['--tag-color' as string]: color } : undefined}
    >
      <i aria-hidden />
      {/* El texto va en su propio span porque .s-tag es un contenedor flex y
          ahí text-overflow no aplica: el nodo de texto suelto se vuelve un
          ítem anónimo y el recorte quedaba a hachazo limpio, sin los puntos
          suspensivos. Se ve a 375, donde el tag cede espacio al nombre. */}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}

/** Pastilla con la inicial, al principio de la fila. */
export function Marca({ nombre }: { nombre: string }) {
  return (
    <span className="s-marca" aria-hidden>
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  )
}
