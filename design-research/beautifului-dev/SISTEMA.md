# Sistema de diseño — guía de construcción

**Este es el único archivo que hay que leer para construir algo con esta identidad.**
Es autosuficiente: los tokens están acá adentro, no hay que abrir nada más.

Los otros archivos de la carpeta son para otra cosa: `audit.md` documenta **cómo se
midió** (metodología, evidencia, verificación) y sirve si alguien duda de un valor;
`raw/` son los datos crudos; `replica.html` es una prueba viva. Para producir, alcanza
con este archivo.

Todo lo de acá salió de medir el sitio, no de mirarlo.

---

## 0. Cómo usar esta guía

Leé las secciones 1 y 2 completas antes de escribir una línea. Son las que explican
**por qué** el sistema es así, y sin eso lo único que se puede hacer es copiar valores —
que es exactamente lo que no queremos.

Las secciones 3 a 8 son material de consulta mientras construís.
La sección 9 dice qué **no** hacer, y es la más importante si quien construye es un modelo
de lenguaje: son todas cosas que un LLM hace por defecto y que acá están prohibidas.
La 11 es la lista de autoverificación.

---

## 1. Las cinco decisiones que cargan peso

Si sólo te llevás una cosa, que sea esta sección. Todo el resto del sistema se deriva de
acá, y cinco decisiones bien entendidas producen mejores resultados que 33 tokens
copiados.

### 1.1 El borde de 1px reemplaza a la sombra

Los planos no se separan con desenfoque, se separan con un anillo de 1px.

```css
box-shadow: 0 0 0 1px var(--line);   /* así se ve una card acá */
```

Todo lo demás se desprende de esto:

- **La escala de superficies puede estar comprimida.** Entre peldaños contiguos hay menos
  de 3 puntos de luminosidad. No hace falta más: el anillo hace el trabajo.
- **No hace falta desenfoque.** Ni sombra difusa, ni glass, ni blur de fondo.
- **La pila de z-index queda plana.** El máximo del sistema es 10. No hay teatro de
  elevación que administrar.

Hay tokens de sombra definidos, pero se usan poquísimo, y **todos empiezan por el anillo**;
el desenfoque es un agregado casi invisible. Si dudás entre borde y sombra: es borde.

### 1.2 No hay escalas numeradas, y es a propósito

No existe `gray-400`. Existen `ink`, `ink-2` e `ink-3`, y cada uno significa algo:
lo que se lee, lo que acompaña, lo que está pero no se lee.

Una escala 50–950 es más flexible y por eso es peor: te deja inventar un cuarto nivel de
gris cuando no sabés cuál de los tres querías. Acá el vocabulario te obliga a decidir.

**Regla:** si necesitás un color que no está en la tabla de la sección 3, la respuesta
casi siempre es que estás resolviendo mal el problema, no que falta un token.

### 1.3 Se mantiene constante lo que se percibe, no lo que se mide

Esta es la regla generativa: la que te deja producir valores nuevos que **pertenecen** al
sistema aunque no estén en ninguna tabla.

El sistema rompe sus propias reglas en cuatro lugares, siempre por el mismo motivo:

| Dónde | Un sistema perezoso pondría | Este pone | Por qué |
|---|---|---|---|
| Trazo de íconos | 2 siempre | **1.8** en los grandes, **2.2–2.5** en los chicos | al escalar un dibujo de 24 a una caja de 11px, un trazo de 2 se adelgaza a 0,9px reales y desaparece |
| Peso tipográfico | 600 siempre | **650** a 10px, **600** a 13px | a 10px un 600 se ve más liviano que a 14px |
| Interlineado | 1,5 siempre | **1,7** en código, **1,385** en campos | el código necesita que el ojo siga la columna; el campo necesita entrar en 28px de alto |
| Radio | uno solo | **6 / 8 / 10 / 14** según el tamaño de la caja | así el grosor visual de la esquina se mantiene |

**Cómo aplicarla cuando aparezca un caso nuevo:** preguntá qué cantidad **percibida** tiene
que quedar igual, y movés el número hasta lograrlo. Nunca al revés.

### 1.4 El ritmo lo hace la estructura, no el espacio

Entre secciones hay **cero píxeles de margen**. Lo que separa es una línea punteada.

Es la misma jugada que 1.1, un nivel más arriba: que una línea haga lo que normalmente
hace el aire. El aire va **adentro** de cada sección (`40px 32px`), no entre ellas.

Y hay una distinción semántica que se respeta sin excepción:

- **Punteado** = juntura de la estructura de la página (entre secciones, alrededor del
  panel lateral, en el footer).
- **Sólido** = separación de datos dentro de un componente (filas de tabla, divisiones de
  una card).

### 1.5 La voz y el sistema visual dicen lo mismo

Tipografía chica y densa. Títulos de dos palabras. Descripciones que explican **el
mecanismo, nunca el beneficio**. Las dos cosas dicen "nombro el hecho y me callo".

Si escribís copy de venta sobre este sistema visual, se rompe. Las reglas de texto están
en la sección 8 y **no son opcionales**: son parte de la identidad, igual que los colores.

---

## 2. La jerarquía es peso y color, no tamaño

Toda la escala tipográfica del sistema va de **10 a 21px**. El titular más grande es de
21px. No hay nada de 32, ni de 48, ni de 64.

Eso significa que **agrandar la fuente no es una herramienta disponible**. Para destacar
algo tenés exactamente dos palancas:

1. Subir el peso: 400 → 500 → 600.
2. Subir la tinta: `ink-3` → `ink-2` → `ink`.

Si te encontrás queriendo poner un título de 40px, estás peleando contra el sistema.

---

## 3. Tokens

Copiá este bloque tal cual. El tema se cambia poniendo o sacando la clase `dark` en
`<html>`.

```css
:root {
  /* Superficies — del fondo hacia adelante */
  --page:#fafafb; --canvas:#f1f2f3; --surface:#fff; --inset:#f7f8f9;
  --hover:#f4f5f6; --hover-2:#e7e9eb;

  /* Tinta — tres niveles, nunca un cuarto */
  --ink:#1f2124; --ink-2:#62656b; --ink-3:#9a9da3;

  /* Líneas */
  --line:#ecedef; --line-strong:#e0e2e5;

  /* Campos */
  --field:#f2f2f3;

  /* La trama de fondo */
  --stripe:#49494913; --stripe-bg:#f5f5f5;

  /* Acento — uno solo */
  --accent:#0285ff; --accent-ink:#0170dd; --accent-tint:#e9f3ff;

  /* Estados */
  --green:#189a4d; --green-tint:#e8f5ed;
  --orange:#ef720c; --orange-tint:#fdf1e5;
  --red:#e3474c;   --red-tint:#fcecec;

  /* Tooltip — tiene sus propias superficies, no usa las del tema */
  --tooltip-bg:#25272b; --tooltip-fg:#f6f7f8;
  --tooltip-muted:#a5a8ad; --tooltip-border:#3a3c40;

  /* Elevación — todas empiezan por el anillo */
  --shadow-hairline:0 0 0 1px var(--line);
  --shadow-btn:0 0 0 1px var(--line-strong),0 1px 2px #1018280d;
  --shadow-card:0 0 0 1px var(--line),0 1px 2px #1018280a,0 2px 6px #10182808;
  --shadow-raised:0 0 0 1px var(--line),0 2px 10px #0000000b;
  --shadow-overlay:0 0 0 1px var(--line),0 8px 28px #0001;
  --shadow-inset-field:inset 0 1px 2px #0000001f;

  /* Radios — crecen con la caja */
  --radius-chip:6px; --radius-control:8px; --radius-card:10px; --radius-window:14px;

  /* Curvas */
  --ease-out:cubic-bezier(0,0,.2,1);
  --ease-in-out:cubic-bezier(.4,0,.2,1);
  --ease-out-strong:cubic-bezier(.23,1,.32,1);
  --ease-link:cubic-bezier(.16,1,.3,1);

  /* Tiempos */
  --dur-instant:100ms; --dur-fast:120ms; --dur-base:150ms;
  --dur-slow:300ms; --dur-slower:400ms;

  --font-sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
  --font-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace;
}

.dark {
  --page:#17181a; --canvas:#1c1d1f; --surface:#232427; --inset:#1f2022;
  --hover:#2a2b2e; --hover-2:#313236;
  --ink:#f2f3f4; --ink-2:#a5a8ad; --ink-3:#6c6f75;
  --line:#2e3033; --line-strong:#3a3c40;
  --field:#2b2c2f;
  --stripe:#ffffff0e; --stripe-bg:#1b1c1e;
  --accent:#3d9aff; --accent-ink:#7ec0ff; --accent-tint:#3d9aff29;
  --green:#3dbb72; --green-tint:#3dbb7224;
  --orange:#f68f3c; --orange-tint:#f68f3c24;
  --red:#ee5c61;   --red-tint:#ee5c6124;
  --tooltip-bg:#111214; --tooltip-fg:#f2f3f4;
  --tooltip-muted:#a5a8ad; --tooltip-border:#2e3033;
  --shadow-hairline:0 0 0 1px var(--line);
  --shadow-btn:0 0 0 1px var(--line-strong),0 1px 2px #0000004d;
  --shadow-card:0 0 0 1px var(--line),0 1px 2px #0003,0 2px 6px #0003;
  --shadow-raised:0 0 0 1px var(--line),0 2px 10px #00000038;
  --shadow-overlay:0 0 0 1px var(--line-strong),0 8px 28px #00000057;
  --shadow-inset-field:inset 0 1px 2px #0006;
}
```

**Tres cosas que hay que saber sobre estos valores:**

1. **Los dos temas tienen exactamente los mismos nombres.** Ninguno existe sólo en claro o
   sólo en oscuro. Si agregás un token, agregalo a los dos.
2. **No es una inversión.** En claro `surface` es blanco puro; en oscuro **no** es negro
   puro sino un gris medio, por encima de `page`. La relación entre roles se conserva, los
   valores no.
3. **Los tintes cambian de técnica.** En claro son colores opacos precalculados; en oscuro
   son el color de estado con alfa (0.14–0.16). Un tinte opaco sobre fondo oscuro se ve
   sucio.

### La paleta categórica de tags

Además de los colores de arriba hay **ocho categóricos**, que el sitio inyecta
inline como `--tag-color`. Es un hallazgo tardío: la primera versión de esta
guía decía que había un solo acento, y no es así.

```css
/* nombran una categoría, no un estado ni un valor */
--tag-azul:    #3f78ff;   --tag-naranja: #f09a2f;
--tag-violeta: #9a5cff;   --tag-cian:    #16a6c7;
--tag-verde:   #25a878;   --tag-lima:    #92b72d;
--tag-rosa:    #ee6572;   --tag-magenta: #c84f9d;

.tag {
  display: inline-flex; align-items: center;
  height: 23px; padding: 0 7px; border-radius: 6px;
  font-size: 11px; font-weight: 500;
  border: 1px solid color-mix(in srgb, var(--tag-color) 24%, var(--surface));
  color:            color-mix(in srgb, var(--tag-color) 82%, var(--ink));
  background:       color-mix(in srgb, var(--tag-color) 13%, var(--surface));
}
.tag > i { width: 5px; height: 5px; border-radius: 50%; margin-right: 5px;
  background: var(--tag-color); }
```

**No compiten con la regla del acento único** porque no significan nada: el
azul de marca dice "acción", el verde dice "bien", el rojo dice "mal", y un
tag violeta dice "esta categoría y no otra". Nunca los uses para valor,
magnitud ni estado.

Un detalle que vale copiar: al mezclarse con `--ink` y `--surface`, el mismo
color funciona en los dos temas sin definir una variante por tema.

**Asigná el color por POSICIÓN en el conjunto, no por hash del nombre.** Con
hash, dos categorías distintas caen en el mismo color y la paleta deja de
distinguir, que es su único trabajo.

### La pastilla de fila

La referencia abre cada fila de sus tablas con la inicial en una pastilla:

```css
.marca {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 6px;
  background: var(--field); color: var(--ink-2);
  font-size: 10px; font-weight: 650;   /* 650 es compensación óptica a 10px */
}
```

### Los grises no son neutros

Están teñidos de azul frío: croma entre 0.0013 y 0.0102, matiz entre 248 y 286 en OKLCH.
Un gris neutro real se ve fuera de lugar. Si generás un gris nuevo, dale ese tinte.

---

## 4. La base

Estas tres reglas van sí o sí, en todo proyecto que use este sistema.

```css
*,::before,::after { box-sizing: border-box; }

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 1 — LA TRAMA. Es la firma del sistema. −45°, período de 8px, fija al scroll:
       el contenido pasa por delante de una textura que no se mueve. */
body {
  margin: 0;
  background-color: var(--stripe-bg);
  background-image: repeating-linear-gradient(-45deg,
    transparent 0, transparent 7px, var(--stripe) 7px, var(--stripe) 8px);
  background-attachment: fixed;
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.01em;    /* tracking negativo GLOBAL — sin esto se ve genérico */
}

/* 2 — EL FOCO. Una sola regla global. No se define por componente. */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
input:focus-visible, textarea:focus-visible, select:focus-visible {
  outline: none;   /* el campo se marca por su contenedor, ver 6.5 */
}

/* 3 — EL CORTE DE MOVIMIENTO. Global y total. */
@media (prefers-reduced-motion: reduce) {
  *,::before,::after {
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## 5. Layout y composición de página

### 5.1 El esqueleto

Panel lateral fijo de **288px** + columna de contenido de **672px** = **960px**, y ahí se
topea. En una pantalla de 1920 el contenido sigue midiendo 960 y **se ve la trama a los
costados**: eso es composición, no relleno.

```css
.shell { display: grid; max-width: 960px; }
@media (min-width: 1024px) { .shell { grid-template-columns: 288px 672px; } }
```

### 5.2 Breakpoints

Sólo **dos** producen cambios reales:

- **640px** — el interior de los bloques de contenido pasa de apilado a fila.
- **1024px** — el panel lateral pasa de estar arriba (con borde inferior punteado) a estar
  al costado (`sticky`, `100vh`, con borde derecho punteado).

Nada más. **No se oculta contenido, no cambia ningún tamaño de fuente, no se reordenan
columnas.** Si tu diseño necesita cinco breakpoints, algo está mal.

### 5.3 La plantilla de sección, repetida sin excepción

```
[ 01 ]  [ Título ]  [ descripción de una línea ]     ← todo en UNA línea, alineado
┌──────────────────────────────────────────────┐        por línea de base
│              contenido / demo                │
└──────────────────────────────────────────────┘
──────────── línea punteada ────────────────────     ← y arranca la siguiente, sin margen
```

Los tres elementos de la cabecera van en **una sola línea con `align-items: baseline`**, no
apilados. Es lo que permite repetir la plantilla veinte veces sin que se sienta un
formulario: cada sección gasta un renglón en presentarse y todo el resto es contenido.

```css
.seccion { padding: 40px 32px; border-bottom: 1px dashed var(--line); }
.sec-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.sec-num { font-family: var(--font-mono); font-size: 11px; line-height: 16.5px;
  color: var(--ink-3); font-variant-numeric: tabular-nums; }
.sec-title { margin: 0; font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; }
.sec-desc { margin: 0; font-size: 12.5px; line-height: 18.75px; color: var(--ink-3);
  text-wrap: pretty; }
@media (min-width: 640px) { .sec-desc { overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; } }   /* el layout impone el largo, ver 8 */
```

### 5.4 El ritmo es invariante

Mismo ancho, mismo padding, mismo alto mínimo, **siempre**. No hay secciones destacadas, ni
de ancho completo, ni con fondo distinto, ni bloques editoriales intercalados.

Es contraintuitivo —casi toda página larga rompe el ritmo para no cansar— y funciona porque
lo que varía es el contenido. **El marco es el metrónomo; el contenido, la melodía.**

### 5.5 Numerar

La numeración explícita (`01`…`19`) en mono y en `ink-3` no es decorativa: convierte la
página en un índice recorrible y es lo que le da sentido al panel lateral como tabla de
contenidos.

### 5.6 El orden

Ordená por **ciclo de vida**, no por importancia ni alfabéticamente. Y poné primero lo
menos vistoso si es ahí donde se demuestra el criterio: la referencia abre con un estado
de carga, que es la pieza más aburrida del catálogo, y esa es justamente la declaración.

---

## 6. Componentes

### 6.1 Espaciado

Hay **dos escalas superpuestas** y conviven a propósito:

- **Entre bloques**, múltiplos de 4: `4, 8, 12, 32, 40`. Los gaps de 4 y 8 son el 95% de
  los casos.
- **Dentro de un control**, lo que haga falta: `1, 2, 3, 5, 6, 7, 10`. En un control de
  24px de alto, un salto de 4px es enorme.

Paddings con nombre, tal cual los define la referencia:

```css
.card-pad    { padding: 12px; }
.table-cell  { padding: 10px 12px; }
.icon-button { width: 28px; height: 28px; border-radius: var(--radius-control); }
```

**El padding horizontal siempre supera al vertical** en los controles (`5px 8px`,
`10px 12px`, `4px 6px`). La única excepción es la sección, que invierte la relación
(`40px 32px`) porque es la que separa bloques que se tocan.

### 6.2 Card

```css
.card { border-radius: var(--radius-card); background: var(--surface);
  box-shadow: var(--shadow-card); overflow: hidden; }
```

### 6.3 Botones

**No existe un botón primario con fondo de acento.** El acento es para foco, enlaces y
detalles; nunca para llenar un botón. Las variantes que sí existen:

```css
/* Pill — el llamado a la acción más fuerte del sistema */
.btn-pill { display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 10px;
  border:0; border-radius:999px; background:var(--field); box-shadow:var(--shadow-btn);
  color:var(--ink); font-size:11.5px; font-weight:500; cursor:pointer;
  transition: background-color var(--dur-base), transform var(--dur-base); }
.btn-pill:hover  { background: var(--hover); }
.btn-pill:active { transform: scale(0.98); }

/* Ícono — 28×28 con radio 8, o 24×24 con radio 6 */
.btn-icon { display:inline-flex; align-items:center; justify-content:center;
  width:28px; height:28px; border:0; border-radius:var(--radius-control);
  background:transparent; color:var(--ink-3); cursor:pointer;
  transition: background-color var(--dur-instant), color var(--dur-instant); }
.btn-icon:hover { background: var(--hover); color: var(--ink); }

/* Fila fantasma — el realce SOBRESALE del texto vía margen negativo */
.btn-row { display:flex; align-items:center; gap:8px;
  width:calc(100% + 12px); margin-inline:-6px; padding:6px;
  border:0; border-radius:7px; background:transparent; color:var(--ink);
  font-size:12.5px; text-align:left; cursor:pointer;
  transition: background-color var(--dur-instant); }
.btn-row:hover { background: var(--hover-2); }
```

El margen negativo de `.btn-row` es importante: hace que el fondo de hover llegue más allá
de la caja de contenido **sin que el texto se mueva**.

### 6.4 Segmentado

Contenedor `rounded-full` sobre `--field`, con un **pulgar absoluto que se desliza con
`transform`** (200ms). Los botones van encima con `z-index: 10`.

### 6.5 Campos

**El campo no tiene estilo propio.** Es transparente y sin borde; quien dibuja el control
y reacciona al foco es el contenedor.

```css
.field { display:flex; align-items:center; gap:6px; padding:5px 8px;
  border:1px solid var(--line); border-radius:var(--radius-control);
  background:var(--surface);
  transition: border-color var(--dur-base), background-color var(--dur-base); }
.field:focus-within { border-color:var(--line-strong); background:var(--hover);
  box-shadow: 0 1px 2px rgba(0,0,0,.025); }
.field input { flex:1; min-width:0; border:0; background:transparent; outline:none;
  font:inherit; font-size:13px; line-height:19.5px; color:var(--ink); }
.field input::placeholder { color: var(--ink-3); }
```

### 6.6 Tabla

Cabecera 12px/500 en `ink-3`; celdas 13px/**500** en `ink` con `tabular-nums`; padding
`10px 12px`; filas con borde **sólido** de 1px y hover a 400ms.

**Todas las celdas van en peso 500**, no sólo las numéricas.

### 6.7 Código

Mono a 11.5px con interlineado **1,7** sobre `--inset`, padding `10px 12px`. La numeración
de línea va a 10.5px, `ink-3` al 60% de alfa, ancho fijo de 20px alineado a la derecha,
`user-select: none`.

### 6.8 Íconos

Rejilla de 24, `fill="none"`, `stroke-linecap` y `stroke-linejoin` en `round`. Tamaños de
caja entre **11 y 16px** — nunca más grandes.

Grosor de trazo **compensado ópticamente** (ver 1.3):

| Caja del ícono | stroke-width |
|---|---|
| 15–16px | **1.8** |
| 13–14px | **2** |
| 11–12px | **2.2–2.5** |

---

## 7. Movimiento

Todo en CSS. **Sin librerías** — ni Framer Motion, ni GSAP, ni nada.

**La regla, y cabe en una línea:** si lo provocó el usuario, **100–150ms**; si pasó solo,
**300–400ms**.

| Duración | Para qué |
|---|---|
| 100ms | hover de botones de ícono y filas |
| 120ms | hover de controles (la más frecuente) |
| 150ms | navegación, pills |
| 200ms | el pulgar del segmentado |
| 300ms | entradas |
| 400ms | cambios de estado en tablas |

Curvas: `--ease-in-out` para lo estándar, `--ease-out-strong` para entradas con carácter
(es muy frontal: el 77% del recorrido ocurre en el primer 23% del tiempo).

Los nueve keyframes de la referencia, listos para copiar:

```css
@keyframes fade-in     { 0% { opacity:0 } to { opacity:1 } }
@keyframes fade-up     { 0% { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes pop-in      { 0% { opacity:0; transform:scale(.95) } to { opacity:1; transform:scale(1) } }
@keyframes stream-in   { 0% { opacity:0; filter:blur(4px) } to { opacity:1; filter:blur(0) } }
@keyframes shimmer-text{ 0% { background-position:150% } to { background-position:-50% } }
@keyframes pixel-on    { 0%,to { opacity:.15 } 18%,42% { opacity:1 } 62% { opacity:.15 } }
@keyframes eq-bounce   { 0%,to { transform:scaleY(.35) } 50% { transform:scaleY(1) } }
@keyframes caret-blink { 0%,to { opacity:1 } 50% { opacity:0 } }
@keyframes spin        { to { transform:rotate(1turn) } }
```

**Advertencia:** en la referencia hay ~29 animaciones corriendo a la vez en reposo. El
sistema visual está calibrado para tener movimiento permanente. Si construís una página
quieta con estos tokens, va a quedar prolija y muerta — la identidad depende de que algo
se esté moviendo.

---

## 8. Voz y texto

Estas reglas son parte de la identidad, igual que los colores.

1. **Título: dos palabras.** Sustantivo, nunca verbo, nunca una frase. Cuando el concepto
   entra en una palabra, se usa una; nunca se estira a tres para sonar más completo.
2. **Descripción: una línea que explica el mecanismo, no el beneficio.** "Cargador de
   grilla con brillo y tiempo transcurrido" —qué hace— y no "para que tus usuarios sepan
   que algo está pasando". **Ni una línea de venta.**
3. **~50 caracteres**, porque la descripción comparte renglón con el título y el layout la
   trunca si se pasa. El límite lo impone la composición, no una guía de estilo.
4. **Arrancar con el sustantivo**, no con artículo ni con verbo.
5. **Números siempre en `tabular-nums`**, sin excepción: contadores, duraciones,
   cantidades, celdas.
6. **La mono es para lo que se cuenta, no para lo que se lee**: números, códigos,
   duraciones, dominios. Nunca texto corrido.

---

## 9. Lo que NO se hace

**Esta sección es la más importante si quien construye es un LLM.** Todo lo que sigue es
un comportamiento por defecto de un modelo que acá está prohibido.

| Prohibido | En su lugar |
|---|---|
| Hero grande con título de 48px+ | Empezar directo por la sección 01. El titular más grande del sistema es de **21px** |
| Sombras difusas para elevar (`box-shadow: 0 4px 12px rgba(0,0,0,.1)`) | Anillo de 1px: `box-shadow: 0 0 0 1px var(--line)` |
| Gradientes decorativos, fondos con degradado de marca | Sólo hay tres gradientes y los tres son funcionales: la trama y dos indicadores de carga |
| `backdrop-filter: blur()`, glassmorphism | Nada. **Cero** elementos con blur de fondo en toda la referencia |
| Tipografía fluida con `clamp()` | Tamaños fijos. Son **idénticos** a 375 y a 1920 |
| Escalas de color `50`–`950` | Los tres niveles de tinta, las seis superficies y los ocho tags categóricos |
| Botón primario con fondo de acento | El acento es para foco, enlaces y detalles. El CTA más fuerte es un pill gris |
| `rounded-2xl`, `rounded-3xl` | 6 / 8 / 10 / 14 según el tamaño de la caja |
| Márgenes generosos entre secciones (`my-24`) | **Cero** margen. Separa una línea punteada |
| `z-index: 9999` | El máximo del sistema es **10** |
| Ruido, grano, texturas de fondo | La única textura es la trama diagonal |
| Íconos grandes o decorativos | Ninguno pasa de **16px** |
| Librerías de animación | CSS y nada más |
| Secciones de precios, testimonios, logos de clientes, FAQ | No existen. El producto se muestra, no se argumenta |
| Cambiar el header al scrollear (sombra, blur, fondo) | Medido antes y después: **no cambia nada** |
| Ocultar contenido en mobile | El conteo de elementos ocultos **no cambia** en ningún ancho |
| `aspect-ratio` | Alturas fijas con `min-height` en px, para que el contenido animado no haga saltar el layout |

---

## 10. Trampas conocidas

Dos cosas que la referencia hace mal y que **no** hay que copiar.

### 10.1 El gris terciario no llega a AA

`ink-3` está calibrado para desaparecer, y para eso funciona perfecto: números de sección,
unidades, marcas de tiempo, placeholders. Pero en la referencia **también lo usan para
contenido real** ("Needs review", "Add calculation"), y ahí falla:

| Combinación | Contraste |
|---|---|
| `ink-3` sobre `surface`, tema oscuro | **3.08:1** |
| `ink-3` sobre `surface`, tema claro | **2.72:1** |
| `ink-3` sobre `field`, tema claro | **2.43:1** |

Ninguna llega a los 4.5:1 de AA.

**Regla para nosotros:** `ink-3` **sólo** para metadata que nadie necesita leer. Todo lo
que haya que leer va en `ink-2` como mínimo. Es una línea de código y elimina el problema
entero.

### 10.2 La densidad hay que justificarla

Tipografía de 10–13px y paddings de 12px funcionan para una galería de componentes que
miran desarrolladores en desktop. **No se transfieren solos** a un producto donde alguien
entra dos minutos a buscar un dato.

Si el público es otro, la palanca correcta es **subir el piso tipográfico de 12 a 14px**
manteniendo todo lo demás. El sistema aguanta ese cambio sin romperse; lo que no aguanta
es que le agrandes los títulos.

---

## 11. Autoverificación

Antes de dar algo por terminado, revisá contra esta lista. Todas son verificables mirando
el CSS o midiendo en el navegador.

- [ ] ¿La trama diagonal a −45°, período 8px, está en el `body` y es `fixed`?
- [ ] ¿El cuerpo está en 14px y **nada** supera los 21px?
- [ ] ¿Hay `letter-spacing: -0.01em` global?
- [ ] ¿La jerarquía se resuelve con peso y tinta, y no agrandando la fuente?
- [ ] ¿Los planos se separan con anillo de 1px y **no** con sombra difusa?
- [ ] ¿Las secciones se separan con línea **punteada** y **cero** margen?
- [ ] ¿El punteado es sólo estructura y el sólido sólo datos?
- [ ] ¿Los radios siguen 6 / 8 / 10 / 14 según el tamaño de la pieza?
- [ ] ¿El acento aparece **sólo** en foco, enlaces y detalles — nunca llenando un botón?
- [ ] ¿Los grises tienen matiz azul (OKLCH H entre 248 y 286)?
- [ ] ¿Las transiciones de hover están entre 100 y 150ms, y las autónomas entre 300 y 400?
- [ ] ¿El anillo de foco es único y global, `2px solid accent` con offset 2?
- [ ] ¿Todos los números usan `tabular-nums`?
- [ ] ¿Los íconos están entre 11 y 16px, con el grosor de trazo compensado?
- [ ] ¿La mono se usa sólo para números, código y dominios?
- [ ] ¿El contenido está topeado y deja ver la trama en pantallas anchas?
- [ ] ¿Existe el corte global de `prefers-reduced-motion`?
- [ ] ¿Los dos temas tienen exactamente los mismos nombres de token?
- [ ] ¿Los tintes son opacos en claro y con alfa en oscuro?
- [ ] ¿Ningún texto que haya que leer quedó en `ink-3`?
- [ ] ¿Los títulos son de dos palabras y las descripciones explican el mecanismo?
- [ ] ¿Hay algo en movimiento, o quedó una página quieta?

---

*Medido sobre https://www.beautifului.dev/ el 2026-08-14. La evidencia de cada valor está
en `audit.md`; los datos crudos, en `raw/`; una implementación verificada, en
`replica.html`.*
