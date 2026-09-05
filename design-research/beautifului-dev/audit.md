# Ingeniería inversa de la identidad visual — beautifului.dev

**Sitio:** https://www.beautifului.dev/ · *Beautiful UI — Crafted primitives for AI-native interfaces*
**Fecha de la auditoría:** 2026-08-14
**Método:** Playwright + Chromium (deviceScaleFactor 2), CSS servido descargado con `curl`.
Todos los números salen de `getComputedStyle`, `getBoundingClientRect`, las custom properties
reales o la hoja compilada. Los scripts de extracción y los volcados crudos están en `raw/`.

## Cómo leer este documento

- **[MEDIDO]** — sale de una medición directa. Se indica dónde.
- **[INFERIDO]** — conclusión mía a partir de mediciones. Se explica el razonamiento.
- **[NO DETERMINADO]** — no se pudo establecer. Se dice por qué.

Cuando hay conteos de uso son elementos del DOM cuya propiedad computada a 1280px es
exactamente ese valor. Los conteos de color de texto son altos porque el color se hereda:
sirve la proporción entre ellos, no el número absoluto.

---

## 0. Qué es este sitio (contexto necesario para leer el resto)

Una galería de 19 primitivas de interfaz para productos de IA, en **una sola página** con
anclas. No hay rutas internas más que `/license`. La estructura es:
un panel lateral fijo de 288px con la marca, el titular, el índice de componentes y un
bloque de autoría; y una columna de contenido de 672px con 19 secciones apiladas, cada
una con un número, un título, una descripción de una línea y un cuadro de demostración
en vivo.

Esto importa porque **la identidad está construida para un contenido denso y repetitivo**:
tipografía chica, jerarquía por peso más que por tamaño, y separadores en lugar de espacio.

**[MEDIDO]** `raw/index.html`: 19 anclas internas, 1 ruta (`/license`), 24 enlaces externos
(la mayoría dominios `example.com` de datos ficticios en las demos).

---

## A. Tokens

Entregados en `tokens.json` (formato W3C-ish, con extensiones para tema, OKLCH y frecuencia)
y en `theme.css` (custom properties listas para usar).

**[MEDIDO]** El sitio define **33 custom properties semánticas por tema** en `:root` y otras
33 espejadas en `.dark`, más 41 del theme layer de Tailwind v4 en `:host,:root`.
Evidencia: `raw/css-var-blocks.json`, bloques `:root`, `.dark` y `:host,:root`.

El dato estructural más importante: **los dos temas tienen exactamente los mismos nombres
de token, sin excepciones**. No hay un token que exista sólo en claro o sólo en oscuro. El
tema es una sustitución de valores, nunca un cambio de vocabulario.

---

## B. Color

### B.1 Paleta completa

Los 27 tokens de color, con HEX, RGB, OKLCH y usos medidos (claro / oscuro).
OKLCH calculado con la transformación de Ottosson; la implementación se validó contra
valores de referencia publicados antes de usarla (`color.js`).

| Token | Rol | Claro | OKLCH claro | Oscuro | OKLCH oscuro | Usos c/o |
|---|---|---|---|---|---|---|
| `page` | Fondo de la página (el nivel más bajo) | `#fafafb` | 98.5% 0.0013 286 | `#17181a` | 20.9% 0.0042 265 | 1 / 1 |
| `canvas` | Fondo de zonas hundidas / segundo plano | `#f1f2f3` | 96.1% 0.0017 248 | `#1c1d1f` | 23.1% 0.0041 265 | 28 / 28 |
| `surface` | Superficie de card — el plano que sostiene contenido | `#fff` | 100.0% 0.0000 90 | `#232427` | 26.0% 0.0058 271 | 164 / 111 |
| `inset` | Superficie hundida dentro de una card | `#f7f8f9` | 97.9% 0.0017 248 | `#1f2022` | 24.3% 0.0041 265 | 20 / 20 |
| `hover` | Realce de fila/ítem al pasar el mouse | `#f4f5f6` | 97.0% 0.0017 248 | `#2a2b2e` | 28.9% 0.0056 271 | 3 / 3 |
| `hover-2` | Realce más fuerte (presionado / activo) | `#e7e9eb` | 93.3% 0.0035 248 | `#313236` | 31.8% 0.0072 275 | 2 / 0 |
| `ink` | Texto primario | `#1f2124` | 24.7% 0.0064 258 | `#f2f3f4` | 96.4% 0.0017 248 | 1801 / 1754 |
| `ink-2` | Texto secundario | `#62656b` | 50.6% 0.0102 265 | `#a5a8ad` | 73.1% 0.0080 261 | 498 / 498 |
| `ink-3` | Texto terciario / metadata | `#9a9da3` | 69.5% 0.0094 265 | `#6c6f75` | 54.1% 0.0100 265 | 759 / 747 |
| `line` | Borde por defecto | `#ecedef` | 94.6% 0.0029 265 | `#2e3033` | 30.8% 0.0061 258 | 57 / 56 |
| `line-strong` | Borde de énfasis | `#e0e2e5` | 91.2% 0.0046 258 | `#3a3c40` | 35.6% 0.0074 265 | 6 / 6 |
| `field` | Fondo de campo de formulario | `#f2f2f3` | 96.1% 0.0013 286 | `#2b2c2f` | 29.3% 0.0056 271 | 43 / 44 |
| `stripe` | Trama diagonal del fondo (color de la veta) | `#49494913` (α 0.075) | — | `#ffffff0e` (α 0.055) | — | 0 / 0 |
| `stripe-bg` | Fondo sobre el que se dibuja la trama | `#f5f5f5` | 97.0% 0.0000 90 | `#1b1c1e` | 22.6% 0.0041 265 | 1 / 1 |
| `accent` | Color de marca / acción primaria | `#0285ff` | 62.6% 0.2050 255 | `#3d9aff` | 68.0% 0.1728 253 | 19 / 21 |
| `accent-ink` | Variante del acento para texto o enlace | `#0170dd` | 55.6% 0.1869 256 | `#7ec0ff` | 78.8% 0.1127 248 | 134 / 132 |
| `accent-tint` | Fondo teñido de acento | `#e9f3ff` | 96.0% 0.0194 253 | `#3d9aff29` (α 0.161) | — | 3 / 0 |
| `green` | Estado positivo | `#189a4d` | 60.3% 0.1555 151 | `#3dbb72` | 70.5% 0.1535 154 | 27 / 23 |
| `green-tint` | Fondo teñido positivo | `#e8f5ed` | 95.8% 0.0173 159 | `#3dbb7224` (α 0.141) | — | 2 / 0 |
| `orange` | Estado de atención | `#ef720c` | 68.9% 0.1794 50 | `#f68f3c` | 74.6% 0.1560 56 | 12 / 13 |
| `orange-tint` | Fondo teñido de atención | `#fdf1e5` | 96.4% 0.0206 68 | `#f68f3c24` (α 0.141) | — | 0 / 0 |
| `red` | Estado negativo / destructivo | `#e3474c` | 62.1% 0.1924 23 | `#ee5c61` | 66.6% 0.1803 21 | 20 / 20 |
| `red-tint` | Fondo teñido negativo | `#fcecec` | 95.6% 0.0174 18 | `#ee5c6124` (α 0.141) | — | 0 / 0 |
| `tooltip-bg` | Fondo del tooltip | `#25272b` | 27.2% 0.0079 264 | `#111214` | 18.2% 0.0044 265 | ver nota |
| `tooltip-fg` | Texto del tooltip | `#f6f7f8` | 97.6% 0.0017 248 | `#f2f3f4` | 96.4% 0.0017 248 | ver nota |
| `tooltip-muted` | Texto secundario del tooltip | `#a5a8ad` | 73.1% 0.0080 261 | `#a5a8ad` | 73.1% 0.0080 261 | ver nota |
| `tooltip-border` | Borde del tooltip | `#3a3c40` | 35.6% 0.0074 265 | `#2e3033` | 30.8% 0.0061 258 | ver nota |

> **Nota sobre los tooltips [NO DETERMINADO]:** no se pudo medir su frecuencia de uso. El
> tooltip sólo se monta al hacer hover y no estaba en el DOM durante el censo. Además, en
> tema oscuro `tooltip-fg`/`tooltip-muted`/`tooltip-border` comparten HEX con `ink`/`ink-2`/`line`,
> así que un conteo por color no los distinguiría aunque estuvieran montados.

### B.2 ¿Hay ramps 50–950?

**[MEDIDO] No.** No existe ninguna variable con sufijo numérico (`-50`, `-100`, …) en toda
la hoja. El sistema es **puramente semántico**: cada token nombra un rol, no una posición en
una escala. Los únicos "escalones" son los pares `x` / `x-2` (`hover`/`hover-2`,
`ink`/`ink-2`/`ink-3`, `line`/`line-strong`, `accent`/`accent-ink`).

**[INFERIDO]** Aun sin ramp declarada, las superficies **sí forman una escala de luminancia
monótona**. Ordenadas por L de OKLCH (calculado, no estimado):

- **Claro** (de más claro a más oscuro): `surface` 100.0 → `page` 98.5 → `inset` 97.9 →
  `hover` 97.0 = `stripe-bg` 97.0 → `canvas` 96.1 = `field` 96.1 → `line` 94.6 →
  `hover-2` 93.3.
- **Oscuro** (de más oscuro a más claro): `page` 20.9 → `stripe-bg` 22.6 → `canvas` 23.1 →
  `inset` 24.3 → `surface` 26.0 → `hover` 28.9 → `field` 29.3 → `line` 30.8 →
  `hover-2` 31.8.

Los pasos son **muy chicos**: 0.0–1.5 puntos de L en claro, 0.4–2.9 en oscuro.
Es una escala deliberadamente comprimida — el contraste entre planos lo hace el borde de
1px, no la diferencia de luminancia (ver F).

Nótese que en claro hay **dos pares exactamente empatados** en luminancia
(`hover` = `stripe-bg`, `canvas` = `field`): tokens distintos por rol que resuelven al mismo
peldaño visual.

### B.3 ¿Es perceptualmente uniforme?

**[INFERIDO] No, y no lo intenta.** Los saltos consecutivos de L son, en claro:
1.5, 0.6, 0.9, 0.0, 0.9, 0.0, 1.5, 1.3. En oscuro: 1.7, 0.5, 1.2, 1.7, 2.9, 0.4, 1.5, 1.0.
No hay delta constante ni progresión. La escala está afinada rol por rol, no generada por
fórmula.

Donde sí hay una regla clara es en el **croma**: todas las superficies y tintas neutras
tienen croma entre **0.0013 y 0.0102**, con **matiz entre 248 y 286** (azul). O sea:
los grises no son neutros, están **teñidos de azul frío**, de forma consistente en los dos
temas. Es lo que da la sensación de "pantalla" y no de "papel".

### B.4 Relación entre tema claro y oscuro

**[MEDIDO] No es una inversión.** Si lo fuera, `L_oscuro ≈ 100 − L_claro`. Los tres
contraejemplos más claros (L medido / L que daría una inversión):

| Token | L claro | L oscuro real | L si fuera inversión | Error |
|---|---|---|---|---|
| `surface` | 100.0 | **26.0** | 0.0 | 26.0 |
| `ink` | 24.7 | **96.4** | 75.3 | 21.1 |
| `canvas` | 96.1 | **23.1** | 3.9 | 19.2 |
| `ink-3` | 69.5 | **54.1** | 30.5 | 23.6 |

**[INFERIDO]** Es una **ramp separada, afinada a mano, que conserva el orden y el matiz**:

1. **El orden de los roles se conserva, los valores no.** En claro `surface` es el más claro
   de todos (blanco puro, L 100); en oscuro `surface` no es el más oscuro sino que está en
   el **medio** de la escala (L 26.0), por encima de `page` (20.9). En los dos temas la card
   se separa de la página en la misma dirección: hacia el frente.
2. **El matiz se mantiene en la familia azul, con tolerancia.** Los neutros oscilan entre
   H 248 y 286, no en un valor fijo: `page` va de 286 a 265, `canvas` de 248 a 265,
   `line` de 265 a 258. `surface` en claro es blanco puro, así que su matiz (90) es un
   artefacto de croma cero y no significa nada. **[INFERIDO]** El tinte azul frío es
   invariante como *familia*, no como número.
3. **Los colores de estado suben de luminosidad y bajan de croma.** Medido:
   `red` L62.1/C0.192 → L66.6/C0.180; `green` L60.3/C0.156 → L70.5/C0.154;
   `accent` L62.6/C0.205 → L68.0/C0.173; `orange` L68.9/C0.179 → L74.6/C0.156.
   **Los cuatro suben L y bajan C, sin excepción.** Se aclaran para leerse sobre oscuro y se
   desaturan para no vibrar.
4. **Los tintes cambian de técnica.** En claro son **colores opacos** precalculados
   (`#e9f3ff`, `#e8f5ed`); en oscuro son **el color de estado con alfa** (`#3d9aff29` = α.16,
   `#3dbb7224` = α.14). No es una inconsistencia: sobre fondo oscuro un tinte opaco se vería
   sucio, mientras que el alfa deja pasar la superficie de abajo.
5. **Una inversión de rol real:** `accent-ink` es **más oscuro** que `accent` en claro
   (L 55.6 vs 62.6) y **más claro** en oscuro (L 78.8 vs 68.0). El token no significa "más
   oscuro", significa "la variante que se lee como texto".
6. **`ink-3` es el único token que baja de luminosidad al pasar a oscuro** (69.5 → 54.1).
   Todos los demás textos y acentos suben. **[INFERIDO]** Es coherente con su rol: es el
   color que tiene que *desaparecer*, y sobre fondo oscuro desaparecer significa acercarse
   al fondo, no alejarse.

### B.5 Gradientes

**[MEDIDO]** Sólo hay **tres** en todo el sitio. Evidencia: censo de `background-image`
sobre todos los elementos (`raw/analisis.json` → `forma.gradientes`).

1. **La trama diagonal** — la firma visual del sitio:
   ```css
   background-image: repeating-linear-gradient(
     -45deg, transparent 0, transparent 7px, var(--stripe) 7px, var(--stripe) 8px
   );
   background-attachment: fixed;
   ```
   Ángulo **−45°**, período **8px** (7 transparentes + 1 de veta). Va en el `<body>` y es
   `fixed`, así que **no se mueve con el scroll**: el contenido pasa por delante de una
   textura estática. Espacio de interpolación: sRGB (el default; el sitio no declara
   `in oklab` ni nada).

2. y 3. **Los dos shimmer** del estado de carga, ambos a 90° con tres paradas simétricas:
   ```css
   linear-gradient(90deg, #6c6f75 35%, #f2f3f4 50%, #6c6f75 65%)   /* neutro */
   linear-gradient(90deg, #3d9aff 35%, #7ec0ff 50%, #3d9aff 65%)   /* acento */
   ```
   Se animan con `@keyframes shimmer-text` moviendo `background-position` de 150% a −50%.

**[INFERIDO]** No hay gradientes decorativos, ni de marca, ni en botones, ni en fondos de
sección. Los tres que existen son **funcionales**: uno es textura de papel, dos son
indicadores de actividad.

### B.8 La paleta categórica de tags — un hallazgo tardío

**[MEDIDO]** Además de los colores semánticos hay **ocho colores categóricos**
que el sitio inyecta *inline* como `--tag-color`, no como clases. Por eso no
aparecían buscando utilidades de color y la primera versión de este informe
los pasó por alto.

| Color | Usos |
|---|---|
| `#92b72d` lima | 10 |
| `#f09a2f` naranja | 8 |
| `#16a6c7` cian | 8 |
| `#9a5cff` violeta | 7 |
| `#3f78ff` azul | 7 |
| `#25a878` verde | 6 |
| `#ee6572` rosa | 5 |
| `#c84f9d` magenta | 4 |

La receta deriva las tres capas de un solo color con `color-mix`:

```css
.records-tag {
  border: 1px solid color-mix(in srgb, var(--tag-color) 24%, var(--surface));
  color:            color-mix(in srgb, var(--tag-color) 82%, var(--ink));
  background:       color-mix(in srgb, var(--tag-color) 13%, var(--surface));
  height: 23px; padding: 0 7px; border-radius: 6px;
  font-size: 11px; font-weight: 500;
}
.records-tag-dot { width: 5px; height: 5px; border-radius: 50%; margin-right: 5px;
  background: var(--tag-color); }
```

**[INFERIDO]** Es lo que resuelve la tensión con la regla del acento único:
estos ocho no compiten con el azul de marca ni con los tres de estado porque
**no significan nada** — nombran una categoría sin orden ni valor. Y al
mezclarse con `--ink` y `--surface`, el mismo color funciona en los dos temas
sin definir una variante por tema.

### B.6 Alphas, overlays y tinte de sombras

**[MEDIDO]**

- La trama usa alfa **0.075** en claro (`#49494913`) y **0.055** en oscuro (`#ffffff0e`).
  Más tenue en oscuro, porque sobre negro un blanco al 7.5% grita más.
- Los tintes de estado en oscuro usan alfa **0.14** (`24` hex) y el de acento **0.16** (`29`).
- **Sí hay `color-mix()`**, y es central en un lugar: los tags categóricos
  (ver B.8). Una corrección a la primera versión de este informe, que decía lo
  contrario: lo busqué entre los tokens y no entre las utilidades de componente.
- **No hay `backdrop-filter` en ningún elemento** (censo: 0 resultados). Cero glassmorphism.
- **Las sombras son negro puro con alfa, sin croma de marca.** En claro el color base es
  `#101828` (un azul muy oscuro) con alfas de 0.03–0.05; en oscuro es negro puro `#000` con
  alfas de 0.2–0.34. **[INFERIDO]** el `#101828` de claro es el gris-azul de Tailwind, así que
  el tinte es heredado del framework, no una decisión de marca.

### B.7 Contraste

Calculado sobre **los pares texto/fondo que realmente aparecen en la página**, resolviendo
el fondo efectivo subiendo por los ancestros y componiendo alfas (`06-pares.js`).
**95 pares distintos por tema**, sobre 501 (oscuro) y 509 (claro) elementos con texto propio.

WCAG 2.1 con la fórmula estándar. APCA con el algoritmo W3 0.1.9 (0.98G-4g); la
implementación se validó contra los valores publicados (`#000` sobre `#fff` = 106.0,
`#fff` sobre `#000` = −107.9, `#888` sobre `#fff` = 63.1) antes de usarla.

#### Los pares más frecuentes — TEMA OSCURO

| Texto | Fondo | px / peso | WCAG | AA | APCA Lc | Usos |
|---|---|---|---|---|---|---|
| `#a5a8ad` ink-2 | `#232427` surface | 12 / 400 | 6.51 | ✅ | -52.3 | 44 |
| `#f2f3f4` ink | `#232427` surface | 12.5 / 500 | 13.97 | ✅ | -97.2 | 36 |
| `#f2f3f4` ink | `#232427` surface | 12 / 400 | 13.97 | ✅ | -97.2 | 31 |
| `#f2f3f4` ink | `#1c1d1f` canvas | 13 / 400 | 15.18 | ✅ | -98.2 | 28 |
| `#a5a8ad` ink-2 | `#2b2c2f` field | 10 / 650 | 5.85 | ✅ | -50.8 | 26 |
| `#6c6f75` ink-3 | `#232427` surface | 12 / 400 | **3.08** | ❌ | -24.1 | 20 |

#### Los pares más frecuentes — TEMA CLARO

| Texto | Fondo | px / peso | WCAG | AA | APCA Lc | Usos |
|---|---|---|---|---|---|---|
| `#62656b` ink-2 | `#ffffff` | 12 / 400 | 5.84 | ✅ | 79.3 | 44 |
| `#1f2124` ink | `#ffffff` | 12.5 / 500 | 16.14 | ✅ | 103.1 | 36 |
| `#1f2124` ink | `#ffffff` | 12 / 400 | 16.14 | ✅ | 103.1 | 31 |
| `#1f2124` ink | `#f1f2f3` canvas | 13 / 400 | 14.4 | ✅ | 95.3 | 29 |
| `#62656b` ink-2 | `#f2f2f3` field | 10 / 650 | 5.22 | ✅ | 71.6 | 26 |
| `#9a9da3` ink-3 | `#ffffff` | 12 / 400 | **2.72** | ❌ | 52.7 | 20 |

#### Resumen y el hallazgo importante

| | Oscuro | Claro |
|---|---|---|
| Pares que fallan WCAG AA | 30 de 95 (**125 elementos**) | 42 de 95 (**146 elementos**) |
| Pares que fallan el umbral APCA para su tamaño | 71 de 95 (322 elementos) | 71 de 95 (327 elementos) |

**[MEDIDO] El token `ink-3` no alcanza AA en ningún fondo, en ninguno de los dos temas.**
Los peores casos con uso real:

- Oscuro: `#6c6f75` sobre `#2b2c2f` (field) = **2.77:1** a 11.5px — texto "Dots", "W".
- Claro: `#9a9da3` sobre `#f2f2f3` (field) = **2.43:1** a 11.5px — mismos elementos.
- Claro: `#9a9da3` sobre `#f7f8f9` (inset) = **2.56:1** a 11.5px — "Add calculation",
  "Needs review", "scoopdata.io".

**[INFERIDO]** Es una decisión estética consciente, no un descuido: `ink-3` está calibrado
para **desaparecer** — es el color de lo que está ahí pero no se debe leer salvo que lo
busques (números de sección, unidades, timestamps, placeholders). El problema es que el
sitio también lo usa para **contenido real** ("Needs review", "Add calculation", los nombres
de dominio), y ahí el gris deja de ser decoración.

Sobre APCA: los umbrales de la tabla de fuentes son severos con texto chico — para 11–13px
en peso 400 el mínimo recomendado es Lc 90, y **nada en el sitio lo alcanza salvo `ink`
puro**. Esto es coherente con que APCA directamente **no recomienda texto de cuerpo por
debajo de 14px**. Dicho de otro modo: el problema no es sólo el gris, es la combinación de
gris + 12px. Con `ink-2` a 14px el sitio pasaría holgado.

---

## C. Tipografía

### C.1 Familias

**[MEDIDO]** Dos familias, ambas variables y autoalojadas por el pipeline de fuentes de
Next.js (evidencia: `@font-face` en `raw/site.css`).

| | Sans | Mono |
|---|---|---|
| Familia | **Inter** | **JetBrains Mono** |
| Ejes | `font-weight: 100 900` (variable) | `font-weight: 100 800` (variable) |
| `font-display` | `swap` | `swap` |
| Formato | woff2 únicamente | woff2 únicamente |
| Subsets | 7 rangos unicode (latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext, vietnamese) | 6 rangos |
| Fallback | `Inter Fallback` → `local("Arial")` | `JetBrains Mono Fallback` → `local("Arial")` |
| Ajuste de métricas del fallback | `ascent-override: 90.44%`, `descent-override: 22.52%`, `line-gap-override: 0%`, `size-adjust: 107.12%` | `ascent 75.79%`, `descent 22.29%`, `line-gap 0%`, `size-adjust 134.59%` |
| Usos | 1769 elementos | 75 elementos |

El `@font-face` de fallback con overrides de métrica es la técnica de Next.js para que el
salto de Arial a Inter no mueva el layout. Es un detalle de implementación, pero vale
copiarlo: **elimina el CLS del swap sin bloquear el render**.

**[MEDIDO]** No hay CDN de fuentes: todo se sirve desde `/_next/static/media/*.woff2` del
mismo origen.

### C.2 Escala de tamaños

**[MEDIDO]** — censo de `font-size` a 1280px, tema oscuro.

| px | Usos | Dónde |
|---|---|---|
| **14** | 798 | tamaño base del `<body>`, heredado |
| **12** | 546 | cabeceras de tabla, etiquetas, texto auxiliar |
| **11** | 144 | números de sección (mono), micro-etiquetas |
| **12.5** | 108 | descripciones de sección, ítems de navegación, filas |
| **11.5** | 101 | chips, botones de segmentado, bloques de código |
| **13** | 99 | títulos de sección, celdas de tabla, campos |
| **10** | 27 | la letra más chica del sistema |
| **16** | 25 | — |
| **10.5** | 20 | numeración de líneas de código |
| 7 / 17 / 19 / 21 | 2 / 2 / 1 / 1 | excepciones puntuales; **21px es el titular más grande de todo el sitio** |

### C.3 ¿Hay escala modular? ¿Hay `clamp()` fluido?

**[MEDIDO] No a las dos cosas.**

Sobre el ratio modular: los tamaños reales son 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 16.
Entre 10 y 13 el paso es **0.5px constante** — eso es una escala **aritmética**, no
geométrica. Un ratio modular daría 10 → 11.25 → 12.66 (1.125) o 10 → 11.5 → 13.3 (1.15),
y no coincide. La razón entre escalones va de 1.05 (10→10.5) a 1.14 (14→16): no hay ratio.

**[INFERIDO]** La escala no se generó, se ajustó. Son medios píxeles elegidos a mano para
conseguir densidad sin que los renglones colisionen. Es la firma de una interfaz de
herramienta, no de un sitio editorial.

Sobre el fluido: **la tabla de tamaños es idéntica en 375, 768, 1280 y 1920**. Evidencia:
`analisis.json` → `tipografia.porViewport` — a 1280 y 1920 los conteos coinciden dígito a
dígito (14px×798, 12px×546, 11px×144…). **No hay una sola declaración `clamp()` de tamaño
de fuente en toda la hoja.** El único `clamp()` del sitio está en un padding
(`lg:pt-[clamp(2.5rem,8vh,5rem)]` del panel lateral).

> **Fórmula reconstruida:** no la hay. Reconstruir la escala es enumerar los nueve valores.

### C.4 Interlineado

**[MEDIDO]** El `<body>` fija `line-height: 1.5`. De ahí salen los valores dominantes:
21px para 14px (=1.5), 18px para 12px (=1.5), 16.5px para 11px (=1.5).

Pero hay overrides explícitos donde importa la densidad:

| Contexto | font-size | line-height | Ratio |
|---|---|---|---|
| Cuerpo heredado | 14px | 21px | 1.5 |
| Descripción de sección | 12.5px | 18.75px | 1.5 |
| Celda de tabla | 13px | 19.5px | 1.5 |
| Bloque de código | 11.5px | **19.55px** | **1.7** |
| Numeración de línea | 10.5px | 19.53px | **1.86** |
| Campo de texto | 13px | **18px** | **1.385** |

**[INFERIDO]** La regla es 1.5 en todo, con dos excepciones deliberadas: el código **abre**
a 1.7 (para que la numeración de líneas respire y el ojo siga la columna) y los campos de
entrada **cierran** a 1.385 (para que el control quepa en 28px de alto).

### C.5 Tracking

**[MEDIDO]** `letter-spacing: -0.01em` declarado en el `<body>`, que a 14px computa
**−0.14px** y aparece en **1843 de 1874 elementos** — el 98%.

Los 5 elementos que se apartan: `0.84px` (×2, el único texto en `uppercase`), `−0.17px`,
`−0.42px`, `−0.38px`.

**[INFERIDO]** Es **una regla global, no una decisión por estilo de texto**. El tracking
negativo a tamaños chicos aprieta las palabras y hace que el bloque se lea como una unidad;
es lo que da la sensación de "compacto" antes incluso de mirar los espaciados. El único
caso positivo (`0.84px` = 0.06em sobre 14px) acompaña al único `text-transform: uppercase`
del sitio: la regla clásica de abrir el tracking cuando se pasa a mayúsculas.

### C.6 Features tipográficas — un hallazgo

**[MEDIDO]** El `<body>` declara `font-feature-settings: "cv11","ss01"`.

**[MEDIDO] Esa declaración no produce ningún cambio.** Lo verifiqué de dos formas sobre la
Inter que sirve el sitio (`07-glifos.js`):

1. Medí el ancho de avance de 91 caracteres (a–z, A–Z, 0–9, puntuación) con `normal`, con
   `"cv11","ss01"`, con `"cv11"` sola y con `"ss01"` sola. **Cero diferencias** en los
   cuatro casos (tolerancia 0.01px).
2. Rendericé el mismo texto con y sin las features y comparé la captura
   (`screenshots/prueba-glifos.png`): los glifos son idénticos.

**[INFERIDO]** El subset variable que genera el pipeline de Next.js no incluye las tablas
de esas features. La declaración es inofensiva pero **inerte**: quien reconstruya esta
identidad no debe esperar ningún efecto de ella. (Caveat honesto: un glifo alterno que
tuviera exactamente el mismo ancho *y* fuera visualmente idéntico no se detectaría, pero
eso ya no sería un glifo alterno.)

**[MEDIDO]** Lo que sí se usa: `font-variant-numeric: tabular-nums` en **58 elementos** —
todos los números que pueden cambiar en vivo (contadores, duraciones, cantidades, celdas
numéricas). Y `text-wrap`: `pretty` en 21 elementos, `balance` en 2.

### C.7 Longitud de línea (measure)

**[MEDIDO]** Sobre párrafos de más de 60 caracteres:

| Viewport | Ancho | Medida aproximada |
|---|---|---|
| 375 | 287–290px | **44–46 ch** |
| 768 | 357–397px | **57–63 ch** |
| 1280 | 357–397px | **57–63 ch** |
| 1920 | 357–397px | **57–63 ch** |

**[INFERIDO]** La medida se estabiliza en ~60ch desde 768px para arriba y nunca crece,
porque el contenedor está topeado (ver E). 60ch está en el rango clásico de legibilidad;
que el sitio llegue ahí con tipografía de 12.5px significa que la columna es **angosta en
píxeles** (380px), no que el texto sea grande.

### C.8 Jerarquía — mapeo semántico completo

Reconstruido a partir de los usos reales medidos. El sitio **no tiene h1–h6 con estilos
propios**: cada rol se compone con utilidades.

| Rol | Tamaño | Peso | Interlineado | Color | Evidencia |
|---|---|---|---|---|---|
| **Titular de marca** | 21px | 600 | 1.25 | `ink` | único ≥20px del sitio |
| **Título de sección** (`h3`) | 13px | 600 | 20px | `ink` | `text-[13px] font-semibold text-ink` |
| **Descripción de sección** | 12.5px | 400 | 18.75px | `ink-3` | `text-[12.5px] text-ink-3 text-pretty` |
| **Número de sección** (eyebrow) | 11px | 400 | 16.5px | `ink-3` | `font-mono text-[11px] text-ink-3 tabular-nums` |
| **Ítem de navegación** | 12.5px | 400 / **500 activo** | 18.75px | `ink-2` / **`ink` activo** | `rounded-[7px] px-2 py-[5px]` |
| **Cuerpo** | 14px | 400 | 21px | `ink` | heredado del `<body>` |
| **Cabecera de tabla** | 12px | **500** | 18px | `ink-3` | `primitive-table-cell text-[12px] font-medium text-ink-3` |
| **Celda de tabla** | 13px | **500** | 19.5px | `ink` | `text-[13px] font-medium tabular-nums` |
| **Campo / input** | 13px | 400 | 18–19.5px | `ink`, placeholder `ink-3` | `text-[13px] placeholder:text-ink-3` |
| **Chip / pill** | 11.5px | **500** | 17.25px | `ink` | `text-[11.5px] font-medium` |
| **Código** | 11.5px | 400 | **1.7** | `ink` | `font-mono text-[11.5px] leading-[1.7]` |
| **Numeración de línea** | 10.5px | 400 | 1.86 | `ink-3` al 60% | `text-ink-3/60 select-none` |

**[MEDIDO]** Distribución de pesos: 400 (1511), 500 (267), 600 (66), **650 (26)**, 550 (2),
700 (2).

**[INFERIDO]** Los pesos **550 y 650 son la prueba de que se está explotando el eje variable**
a propósito: no son valores que exista un nombre para pedir. 650 aparece 26 veces, siempre
en texto de 10px — **[INFERIDO]** es compensación óptica: a 10px un 600 se ve más liviano que
a 14px, y suben medio escalón para igualar el color del renglón.

**Lo importante de esta tabla:** el rango de tamaños es 10–21px (razón 2.1×) mientras el de
pesos va de 400 a 650. **La jerarquía la lleva el peso y el color, no el tamaño.**

---

## D. Espaciado

### D.1 Unidad base y escala

**[MEDIDO]** Tailwind v4 define `--spacing: .25rem` (4px). Pero los valores **realmente
usados** no respetan una escala de 4:

**Padding** (px × elementos): 2×34, 3×6, **4×47**, 5×20, **6×67**, 7×55, **8×75**, 10×50,
**12×206**, 32×22, 40×20.

**Gap** (px × elementos): 1×6, 1.5×3, 2×45, **4×284**, 5×57, **6×92**, 7×3, **8×303**,
10×60, 12×6, 16×6.

**[INFERIDO]** Hay **dos escalas superpuestas**:

1. Una **escala de rejilla** en múltiplos de 4 (4, 8, 12, 32, 40) que domina en los gaps
   (4 y 8 suman 587 de los 618 usos) y en los paddings de contenedor.
2. Una **escala fina impar** (1, 1.5, 2, 3, 5, 6, 7, 10) para el interior de los controles.
   El 6 (67 paddings + 92 gaps) y el 7 (55 paddings) son demasiado frecuentes para ser ruido.

O sea: **la rejilla manda entre bloques; adentro de un control se usa lo que haga falta.**
Esto es coherente con controles de 24–28px de alto, donde un salto de 4px es enorme.

### D.2 Ritmo vertical — el hallazgo estructural

**[MEDIDO] El espacio entre secciones es CERO en los cuatro viewports.**
19 secciones medidas a 375, 768, 1280 y 1920 px: `[0,0,0,…]` en los cuatro casos.

Las secciones **no se separan con espacio, se separan con una línea punteada**:
`border-b border-dashed border-line`. El aire lo pone el padding interno de cada sección:
`padding: 40px 32px` **[MEDIDO]**, idéntico en todos los viewports.

**[INFERIDO]** Esta es probablemente la decisión de layout más definitoria del sitio. Un
sitio convencional separa con márgenes crecientes; este apila bloques que se tocan y marca
la juntura. El resultado es que **la página se lee como un documento continuo**, no como
una secuencia de tarjetas flotando.

### D.3 Padding interno por componente

**[MEDIDO]** El sitio define tres paddings con nombre propio en su CSS:

```css
.primitive-card-pad   { padding: 12px }
.primitive-table-cell { padding: 10px 12px }
.primitive-icon-button{ width: 28px; height: 28px; border-radius: var(--radius-control) }
```

Y los demás, medidos:

| Componente | Padding | Alto resultante |
|---|---|---|
| Sección | `40px 32px` | variable |
| Panel lateral | `72px 28px 28px` (≥1024) / `64px 28px 28px` | 100vh |
| Superficie de demo | `12px` | 272px (mínimo) |
| Card | `12px` (card-pad) | — |
| Celda de tabla | `10px 12px` | 38.5px (th) / 45px (td) |
| Ítem de navegación | `5px 8px` | 28.75px |
| Chip / pill | `0 10px` con `h-7` | 28px |
| Botón de segmentado | `2px 8px` | 21px |
| Contenedor de segmentado | `2px` | 25px |
| Bloque de código | `10px 12px` | 137px (mínimo) |
| Botón fantasma | `4px 6px` | 28px |
| Textarea | `5px 4px` | 28px |

### D.4 Relaciones proporcionales

**[INFERIDO]** Buscadas explícitamente en los datos:

1. **`padding-x = padding-y + 2px` en los controles chicos.** Ítem de nav `5px 8px` (+3),
   celda `10px 12px` (+2), botón fantasma `4px 6px` (+2), segmentado `2px 8px` (+6).
   La constante no es exacta, pero **la dirección sí es sistemática: el padding horizontal
   siempre supera al vertical**, nunca al revés, en los 12 componentes medidos.
2. **La sección invierte la relación: `40px` vertical contra `32px` horizontal.** Es el único
   componente donde el aire vertical gana, y tiene sentido: es el que separa bloques que
   se tocan.
3. **El padding NO deriva del tamaño de fuente.** El cuerpo es 14px y los paddings de
   contenedor son 12/32/40 — no hay una relación em consistente. Los paddings están en px
   fijos y no escalan con la tipografía.
4. **La única medida que responde al viewport es el padding superior del panel lateral**:
   `clamp(2.5rem, 8vh, 5rem)` — 40px mínimo, 80px máximo, 8% del alto de la ventana.
   **Es lo único fluido del sitio, y responde al ALTO, no al ancho.**

---

## E. Layout y grid

### E.1 El contenedor

**[MEDIDO]** Ancho del `<main>` por viewport: 375 → **375px**, 768 → **768px**,
1280 → **960px**, 1920 → **960px**.

**[INFERIDO]** El contenido está topeado en **960px y no crece más**. De 1024px para
arriba el layout es una rejilla de dos columnas fijas: **288px de panel lateral + 672px de
contenido = 960px** (medido: `grid-template-columns: 288px 672px`). En una pantalla de
1920px eso deja 960px de trama diagonal a la vista. **Es deliberado: la textura de fondo
es parte de la composición, no relleno.**

### E.2 Breakpoints reales

Barrido de **1px en 1px de 320 a 1920** sobre una firma de layout de 80 elementos
representativos (`03b-barrido-ancho.js`). Sólo dos anchos producen un cambio no-fluido:

| Ancho | Qué cambia | Corresponde a |
|---|---|---|
| **640px** | 19 elementos: el cuadro de demo de cada sección pasa de `display:block` a `display:flex` | Tailwind `sm` (40rem) |
| **1024px** | el panel lateral pasa de `static` a `sticky`; su padding superior sube de 64px a 72px | Tailwind `lg` (64rem) |

**[MEDIDO]** La hoja **declara** cinco breakpoints: 40rem/640, 48rem/768, 64rem/1024,
80rem/1280, 96rem/1536, más un `max-width:640px`. Pero **768, 1280 y 1536 no cambian nada
observable** en la página. Son los defaults de Tailwind v4 emitidos por el framework.

**[INFERIDO] El sitio tiene, en la práctica, dos breakpoints.** Uno reorganiza el interior
de las demos y otro decide si el panel lateral acompaña el scroll. Nada más. No hay
reflow de columnas, ni cambios tipográficos, ni ocultamiento de contenido.

### E.3 Estrategia responsive

**[MEDIDO]**

- **Nada se oculta.** El conteo de elementos con `display:none` no cambia en todo el barrido.
- **Nada cambia de escala.** Los tamaños de fuente son idénticos en los cuatro viewports.
- **Se reordena una sola cosa:** el panel lateral pasa de estar arriba (apilado, con borde
  inferior punteado) a estar al costado (sticky, con borde derecho punteado). Se ve en las
  clases: `border-b border-dashed lg:border-r lg:border-b-0`.
- Debajo de 1024px el `<main>` ocupa el 100% del ancho sin padding lateral propio: el aire
  lo pone el padding de cada sección (32px).

### E.4 Sticky, alturas y z-index

**[MEDIDO]**

- `<aside>`: `position: sticky; top: 0; height: 100vh; overflow: hidden` a partir de 1024px.
- Cabeceras de tabla: `position: sticky; top: 0` con `z-index` 5 y 7, sobre `--surface` opaco.
- Celdas de la primera columna: `position: sticky` horizontal con z-index 2, 4 y 6.
- **[MEDIDO] No hay ningún cambio de estilo al scrollear.** Comparé el `<aside>` antes y
  después de scrollear 1200px: mismo fondo (`transparent`), misma sombra (`none`), mismo
  `backdrop-filter` (`none`), mismo borde. **No hay el clásico "header que gana sombra".**

**Pila de z-index completa [MEDIDO]** — sorprendentemente plana:

| z | Uso |
|---|---|
| 10 | botones e ítems de navegación (para quedar sobre su propio fondo animado) |
| 7 | cabecera de tabla sticky (esquina) |
| 6, 5, 4, 2 | combinaciones de celda/cabecera sticky en tablas |
| 1 | detalles internos |

**El valor máximo en todo el sitio es 10.** No hay 50, ni 100, ni 9999.

### E.5 Aspect-ratios y alturas

**[MEDIDO]** No se usa `aspect-ratio` en ningún elemento (el censo devuelve vacío). Las
alturas se fijan con `min-height` en px: la superficie de demo tiene `min-height: 272px`
y el bloque de código `min-height: 137px`. **[INFERIDO]** Son alturas fijadas para que el
contenido animado no haga saltar el layout cuando cambia.

---

## F. Forma y profundidad

### F.1 Radios

**[MEDIDO]** Cuatro radios con nombre en el CSS + los ad hoc.

| Utilidad | Valor | Usos | Se aplica a |
|---|---|---|---|
| `rounded-chip` | **6px** | 175 | chips, botones chicos (24px), badges |
| `rounded-control` | **8px** | 66 | botones de ícono (28px), filas clicables |
| `rounded-card` | **10px** | 14 | cards |
| `rounded-window` | **14px** | 22 | el marco de las superficies de demo |
| `rounded-full` | ∞ | 80 | pills, segmentados, toggles |
| `50%` | — | 84 | avatares y puntos |
| ad hoc | 7px (28), 4px (15), 5px (11), 1–3px (20), 22px (3), 12px (1) | | ítems de nav (7px), foco (4px) |

**[INFERIDO] Hay una regla de radio proporcional al tamaño de la pieza:** 6px para lo de
24px, 8px para lo de 28px, 10px para cards, 14px para el marco exterior. El radio crece con
la caja, que es lo que mantiene el "grosor visual" de la esquina constante.

### F.2 Bordes

**[MEDIDO]** `border-width`: **1px en 108 elementos**, 2px en 1. No hay bordes gruesos.

Y el rasgo que define la estructura: **los separadores estructurales son punteados.**
`border-dashed` aparece en el panel lateral (`border-b border-dashed lg:border-r`), en cada
sección (`border-b border-dashed border-line`) y en los divisores internos del panel
(`border-t border-dashed`). Las tablas, en cambio, usan `border-b` sólido.

**[INFERIDO]** La distinción es semántica: **punteado = juntura de la estructura de la
página; sólido = separación de datos dentro de un componente.**

### F.3 Sombras vs. bordes — el hallazgo

**[MEDIDO]** El sitio define **seis** tokens de sombra. **Las seis empiezan por un anillo de
1px**, y sólo después viene el desenfoque:

```css
--shadow-hairline:    0 0 0 1px var(--line);
--shadow-btn:         0 0 0 1px var(--line-strong), 0 1px 2px #1018280d;
--shadow-card:        0 0 0 1px var(--line), 0 1px 2px #1018280a, 0 2px 6px #10182808;
--shadow-raised:      0 0 0 1px var(--line), 0 2px 10px #0000000b;
--shadow-overlay:     0 0 0 1px var(--line), 0 8px 28px #0001;
--shadow-inset-field: inset 0 1px 2px #0000001f;
```

Escala de elevación reconstruida **[INFERIDO]**: hairline (0) → btn (1) → card (2) →
raised (3) → overlay (4). El desenfoque va 0 → 2 → 6 → 10 → 28px y el alfa 0 → 0.05 → 0.03
→ 0.04 → 0.06 en claro.

Pero lo interesante es **cuánto se usan**: censo de `box-shadow` sobre todos los elementos:

- `rgba(0,0,0,0.4) 5px 0 8px -10px` — **28 usos**. Un `spread` negativo grande: es una
  sombra que sólo asoma por el borde derecho. Es la del panel lateral sobre el contenido.
- `rgba(255,255,255,0.12) 0 0 0 1px` — 7 usos. Un anillo, no una sombra.
- `--shadow-card` completo — **1 uso**.
- `--shadow-hairline` completo — **1 uso**.

**[INFERIDO] El sistema declara una escala de elevación de cinco niveles y en la práctica
casi no la usa.** La profundidad la hace el borde de 1px más el escalón mínimo de
luminancia entre superficies. Las sombras están ahí como red de seguridad, no como recurso
expresivo. Quien copie esta identidad debería copiar **eso** antes que los valores.

### F.4 Blur, glass, ruido y texturas

**[MEDIDO]**

- `backdrop-filter`: **cero elementos**. No hay glassmorphism en ninguna parte.
- `filter: blur()`: se usa sólo en animación — `stream-in` (blur 4px → 0) y `.stream-tail`
  (`blur(1.6px)` con una máscara `linear-gradient(90deg,#000 20%,#0003)`) para que el texto
  que "se está escribiendo" se desvanezca por la cola.
- **Ruido/grano: no hay.** La única textura del sitio es la trama diagonal (B.5).
- **Bordes con gradiente: no hay.**

---

## G. Componentes

Los snippets usan los tokens de `theme.css`. Están escritos para ser autónomos, no son el
markup literal del sitio.

### G.1 Panel lateral (sidebar / nav)

**Anatomía:** marca (logo 80×80 + toggle de tema) → titular → filete punteado → índice de
componentes → filete punteado → bloque de autoría con pill de CTA.

**Dimensiones [MEDIDO]:** 288px de ancho fijo; padding `72px 28px 28px` (≥1024) /
`64px 28px 28px`; `height: 100vh`; `overflow: hidden`; contenido interno 231px.

**Estados del ítem de navegación [MEDIDO]:**

| Estado | Color | Peso | Fondo |
|---|---|---|---|
| Reposo | `ink-2` | 400 | transparente |
| Hover | `ink` | 400 | transparente (sólo cambia el color) |
| Activo | `ink` | **500** | fondo propio con z-index por debajo |
| Foco | `ink` | — | + `outline: 2px solid accent; offset 2px` |

**Detalle notable [MEDIDO]:** la lista de navegación se **desvanece por abajo** — se ve en
`screenshots/sidebar-dark.png`, donde "Records Table" y "Filter Table" se atenúan
progresivamente. Es `lg:overflow-hidden` con una máscara, no una lista cortada.

```html
<aside class="sidebar">
  <nav>
    <p class="nav-label">Components</p>
    <a class="nav-item is-active" href="#a">Loading State</a>
    <a class="nav-item" href="#b">Thinking</a>
  </nav>
</aside>
<style>
.sidebar { width: 288px; padding: 72px 28px 28px; height: 100vh;
  position: sticky; top: 0; overflow: hidden;
  border-right: 1px dashed var(--line); display: flex; flex-direction: column; }
.nav-label { font-size: 12px; color: var(--ink-3); margin-bottom: 4px; }
.nav-item { display: flex; align-items: center; padding: 5px 8px; border-radius: 7px;
  font-size: 12.5px; line-height: 18.75px; color: var(--ink-2); text-decoration: none;
  transition: color var(--dur-base) var(--ease-in-out); }
.nav-item:hover { color: var(--ink); }
.nav-item.is-active { color: var(--ink); font-weight: 500; background: var(--hover); }
</style>
```

### G.2 Sección de componente

**Anatomía:** número en mono → título → descripción en una línea → superficie de demo.

**Dimensiones [MEDIDO]:** 672px de ancho; `padding: 40px 32px`; borde inferior punteado;
la cabecera lleva `margin-bottom: 12px`; la superficie de demo mide 608×272 con
`min-height: 272px`.

```html
<section class="seccion">
  <header class="sec-head">
    <span class="sec-num">01</span>
    <h3 class="sec-title">Loading State</h3>
    <p class="sec-desc">Pixel-grid loader with shimmer and elapsed time.</p>
  </header>
  <div class="demo-surface"><!-- demo --></div>
</section>
<style>
.seccion { padding: 40px 32px; border-bottom: 1px dashed var(--line); }
.sec-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
.sec-num { font-family: var(--font-mono); font-size: 11px; line-height: 16.5px;
  color: var(--ink-3); font-variant-numeric: tabular-nums; }
.sec-title { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; margin: 0; }
.sec-desc { font-size: 12.5px; line-height: 18.75px; color: var(--ink-3);
  text-wrap: pretty; margin: 0; }
.demo-surface { min-height: 272px; padding: 12px; border-radius: var(--radius-window);
  background: var(--canvas); box-shadow: var(--shadow-hairline);
  display: flex; align-items: center; justify-content: center; overflow: hidden; }
</style>
```

### G.3 Botones

**[MEDIDO]** No existe un "botón primario" con fondo de acento en toda la página. Los tipos
que sí existen:

| Variante | Caja | Radio | Fondo reposo | Fondo hover | Color | Duración |
|---|---|---|---|---|---|---|
| **Ícono chico** | 24×24 | 6px | transparente | `hover-2` | `ink-3` → `ink-2` | 100ms |
| **Ícono** | 28×28 | 8px | transparente o `surface` | `hover` | `ink-3` → `ink` | 100ms |
| **Ícono redondo** | 32×32 | full | transparente | — | `ink-3` → `ink-2` | 150ms |
| **Fila fantasma** | auto × 28 | 8px | transparente | `hover` / `hover-2` | `ink` | 100ms |
| **Pill / CTA** | auto × 28 | full | `field` + `shadow-btn` | `hover` | `ink` | 150ms |
| **Segmentado** | auto × 21 | full | transparente | — | `ink-3` → `ink` | 150ms |

**[MEDIDO] Detalle importante:** las filas fantasma usan **margen negativo**
(`-mx-1.5`, `-mx-[3px]`, `w-[calc(100%+6px)]`) para que el fondo de hover **sobresalga del
texto** y llegue más allá de la caja de contenido. El realce parece ir "a sangre" sin que
el texto se mueva.

**[MEDIDO]** El CTA pill agrega `active:scale-[0.98]` — el único feedback de pulsado del sitio.

```html
<button class="btn-pill">Book a call <span aria-hidden>→</span></button>
<button class="btn-icon"><!-- svg 14px --></button>
<button class="btn-row">Which flavors sell best in winter</button>
<style>
.btn-pill { display: inline-flex; align-items: center; gap: 6px; height: 28px;
  padding: 0 10px; border: 0; border-radius: 999px; background: var(--field);
  box-shadow: var(--shadow-btn); color: var(--ink); font-size: 11.5px; font-weight: 500;
  cursor: pointer; transition: background-color var(--dur-base), transform var(--dur-base); }
.btn-pill:hover { background: var(--hover); }
.btn-pill:active { transform: scale(0.98); }
.btn-icon { display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 0; background: transparent; cursor: pointer;
  border-radius: var(--radius-control); color: var(--ink-3);
  transition: background-color var(--dur-instant), color var(--dur-instant); }
.btn-icon:hover { background: var(--hover); color: var(--ink); }
/* el margen negativo es lo que hace que el realce sobresalga */
.btn-row { display: flex; align-items: center; gap: 8px; width: calc(100% + 12px);
  margin-inline: -6px; padding: 6px; border: 0; background: transparent; cursor: pointer;
  border-radius: 7px; color: var(--ink); font-size: 12.5px; text-align: left;
  transition: background-color var(--dur-instant); }
.btn-row:hover { background: var(--hover-2); }
</style>
```

### G.4 Card

**[MEDIDO]** 320×224 en la demo; `border-radius: 10px`; `background: var(--surface)`;
`box-shadow: var(--shadow-card)`; `overflow: hidden`; padding interno `12px` vía
`.primitive-card-pad`.

```html
<div class="card"><div class="card-pad">…</div></div>
<style>
.card { border-radius: var(--radius-card); background: var(--surface);
  box-shadow: var(--shadow-card); overflow: hidden; }
.card-pad { padding: 12px; }
</style>
```

### G.5 Campos (input, textarea)

**[MEDIDO]** Los campos **no tienen estilo propio**: son transparentes y sin borde
(`bg-transparent outline-none`), y quien dibuja el control es el **contenedor**.
Evidencia: `focus-within:border-line-strong`, `focus-within:bg-hover` y
`focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.025)]` en la hoja.

| | input | textarea |
|---|---|---|
| Tamaño | 13px | 13px |
| Interlineado | 19.5px | **18px** |
| Padding | 0 (lo pone el contenedor) | `5px 4px` |
| Alto | 19.5px | 28px (`min-h-7`) |
| Placeholder | `ink-3` | `ink-3` |
| Foco | `outline: none` — el anillo lo dibuja el contenedor | ídem |

```html
<div class="field"><input placeholder="Ask anything…"></div>
<style>
.field { display: flex; align-items: center; gap: 6px; padding: 5px 8px;
  border: 1px solid var(--line); border-radius: var(--radius-control);
  background: var(--surface); transition: border-color var(--dur-base), background-color var(--dur-base); }
.field:focus-within { border-color: var(--line-strong); background: var(--hover);
  box-shadow: 0 1px 2px rgba(0,0,0,0.025); }
.field input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none;
  font: inherit; font-size: 13px; line-height: 19.5px; color: var(--ink); }
.field input::placeholder { color: var(--ink-3); }
</style>
```

### G.6 Tabla

**[MEDIDO]** `table-fixed border-collapse text-left`. Celdas `10px 12px`.
Cabecera 12px/500 en `ink-3`; celda 13px/500 en `ink` con `tabular-nums`.
Filas con `border-b border-line` sólido y `last:border-0`.
Hover de fila: `hover:bg-hover`, transición **400ms** (la más lenta del sitio).
Cabecera y primera columna sticky con `background` **opaco** (`--surface`), no translúcido.

```html
<table class="tabla">
  <thead><tr><th class="tcell th">Flavor</th><th class="tcell th">Units</th></tr></thead>
  <tbody><tr class="trow"><td class="tcell td">Pampa Creamery</td><td class="tcell td">1,284</td></tr></tbody>
</table>
<style>
.tabla { width: 100%; table-layout: fixed; border-collapse: collapse; text-align: left; }
.tcell { padding: 10px 12px; }
.th { font-size: 12px; font-weight: 500; color: var(--ink-3);
  position: sticky; top: 0; background: var(--surface); z-index: 5; }
.td { font-size: 13px; font-weight: 500; color: var(--ink); font-variant-numeric: tabular-nums; }
.trow { border-bottom: 1px solid var(--line); transition: background-color var(--dur-slower); }
.trow:last-child { border-bottom: 0; }
.trow:hover { background: var(--hover); }
</style>
```

### G.7 Segmentado / toggle

**[MEDIDO]** Un contenedor `rounded-full bg-field p-0.5` con un **pulgar absoluto** que se
desliza: `inset-y-0.5 left-0.5 w-8 rounded-full bg-surface shadow-btn transition-transform
duration-200`. Los botones van encima con `z-index: 10`.

**[INFERIDO]** El pulgar se mueve con `transform` y no cambia de posición en el flujo — por
eso la transición es de 200ms y se siente continua.

```html
<div class="seg" role="group">
  <span class="seg-thumb" aria-hidden></span>
  <button class="seg-btn is-on">☀</button>
  <button class="seg-btn">☾</button>
</div>
<style>
.seg { position: relative; display: inline-grid; grid-template-columns: repeat(2, 32px);
  align-items: center; height: 36px; padding: 2px; border-radius: 999px; background: var(--field); }
.seg-thumb { position: absolute; inset-block: 2px; left: 2px; width: 32px; border-radius: 999px;
  background: var(--surface); box-shadow: var(--shadow-btn);
  transition: transform 200ms var(--ease-in-out); }
.seg-btn { position: relative; z-index: 10; display: flex; align-items: center;
  justify-content: center; width: 32px; height: 32px; border: 0; background: transparent;
  border-radius: 999px; color: var(--ink-3); cursor: pointer;
  transition: color var(--dur-base); }
.seg-btn.is-on { color: var(--ink); }
</style>
```

### G.8 Bloque de código

**[MEDIDO]** `background: var(--inset)`; `padding: 10px 12px`; mono 11.5px con
`line-height: 1.7`; `min-height: 137px`; `white-space: pre`.
Numeración: 10.5px, `line-height: 1.86`, color `ink-3` **al 60% de alfa**, `select-none`,
ancho fijo 20px alineado a la derecha.

```html
<pre class="code"><span class="lineno">1</span>const x = 1;</pre>
<style>
.code { margin: 0; padding: 10px 12px; background: var(--inset);
  font-family: var(--font-mono); font-size: 11.5px; line-height: 1.7;
  color: var(--ink); white-space: pre; min-height: 137px; }
.lineno { display: inline-block; width: 20px; text-align: right; margin-right: 12px;
  font-size: 10.5px; line-height: 1.86; color: color-mix(in srgb, var(--ink-3) 60%, transparent);
  user-select: none; }
</style>
```

### G.9 Tooltip

**[NO DETERMINADO]** No se pudo medir. El sitio define cuatro tokens de tooltip
(`tooltip-bg`, `tooltip-fg`, `tooltip-muted`, `tooltip-border`) pero **ningún elemento con
esas clases estaba montado en el DOM** durante la auditoría, ni al hacer hover sobre los 58
controles que probé. Lo único que se puede afirmar es lo que dicen los tokens: fondo
`#25272b` en claro y `#111214` en oscuro — o sea, **el tooltip es oscuro en los dos temas**,
y en oscuro es más oscuro que la propia página.

### G.10 Lo que NO existe

**[MEDIDO]** Buscados y ausentes: **modal/dialog**, **botón primario con fondo sólido de
acento**, **badge con fondo de estado**, **breadcrumb**, **paginación**, **avatar de
usuario**, **campo con borde de error**. El sitio es una galería, no una aplicación.

---

## H. Movimiento

### H.1 Duraciones

**[MEDIDO]** — censo de `transition-duration`:

| Duración | Usos | Dónde |
|---|---|---|
| **120ms** | 153 | la más frecuente; hover de controles |
| **100ms** | 86 | hover de botones de ícono y filas |
| **150ms** | 82 | default de Tailwind; navegación, pills |
| **300ms** | 35 | entradas |
| **200ms** | 31 | el pulgar del segmentado |
| **400ms** | 25 | cambios de estado en tablas |
| 140ms | 27 | transiciones compuestas |
| 500ms / 250ms / 320ms+180ms | 1 c/u | excepciones |

**[INFERIDO]** El sistema vive entre **100 y 150ms** para todo lo que responde al mouse, y
reserva **300–400ms** para lo que cambia por su cuenta (una fila que cambia de estado, un
elemento que entra). La regla: **si el usuario lo provocó, es casi instantáneo; si pasó
solo, se ve pasar.**

### H.2 Curvas

**[MEDIDO]** Cuatro con nombre, más los defaults:

```css
--ease-out:        cubic-bezier(0, 0, .2, 1)      /* salida estándar */
--ease-in-out:     cubic-bezier(.4, 0, .2, 1)     /* default de Tailwind — 231 usos */
--ease-out-strong: cubic-bezier(.23, 1, .32, 1)   /* 53 usos — entradas con carácter */
--ease-link:       cubic-bezier(.16, 1, .3, 1)    /* 1 uso — el subrayado animado */
```

`ease` (el default del navegador) aparece en 1427 elementos, pero **[INFERIDO]** eso es
ruido: son elementos con `transition-property` declarada sin curva explícita.

`--ease-out-strong` es una curva **muy** frontal: el 77% del recorrido ocurre en el primer
23% del tiempo. Es lo que hace que las entradas se sientan "chasqueadas" y no flotantes.

### H.3 Animaciones

**[MEDIDO]** Nueve keyframes, todos en `raw/site.css`:

| Nombre | Qué hace |
|---|---|
| `fade-in` | opacidad 0 → 1 |
| `fade-up` | opacidad 0 → 1 + `translateY(8px)` → 0 |
| `pop-in` | opacidad 0 → 1 + `scale(.95)` → 1 |
| `stream-in` | opacidad 0 → 1 + `blur(4px)` → 0 — texto que "llega" |
| `shimmer-text` | `background-position` 150% → −50% — el brillo de carga |
| `pixel-on` | opacidad .15 → 1 → .15 con paradas en 18%, 42%, 62% — la grilla de píxeles |
| `eq-bounce` | `scaleY(.35)` → 1 → .35 — barras de ecualizador |
| `caret-blink` | opacidad 1 → 0 → 1, `step-end`, 1s — el cursor de escritura |
| `spin` | rotación 360° |

**[MEDIDO]** En reposo con la página cargada hay **83 animaciones registradas y 29
corriendo** simultáneamente. Es un sitio con movimiento permanente, no con reveals de scroll.

**[MEDIDO] No se detectó ninguna librería de animación.** Los 5 chunks de JS son de Next.js
(`webpack`, `main-app`, `polyfills`, y dos de framework). No hay Framer Motion, ni GSAP, ni
`ViewTransition`. **Todo el movimiento es CSS.**

### H.4 `prefers-reduced-motion`

**[MEDIDO]** El corte es **global y total**:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Más dos reglas específicas: `.stream-caret { animation: none }` y `.stream-tail { filter:
none; mask-image: none }`.

**Verificado en el navegador:** con `reducedMotion: 'reduce'`, las animaciones corriendo
pasan de **29 a 0**. Las que quedan registradas (64) están todas terminadas.

**[INFERIDO]** El enfoque `.01ms !important` sobre `*` es el patrón agresivo: garantiza que
nada se mueva, al costo de que los cambios de estado sean instantáneos en lugar de suaves.
Es la elección correcta para un sitio cuyo contenido *es* movimiento.

---

## I. Iconografía, imágenes y media

### I.1 Íconos

**[MEDIDO]** 142 SVG en la página. **136 usan `viewBox="0 0 24 24"`**;
`fill="none"` en 132; `stroke-linecap="round"` en 122; `stroke-linejoin="round"` en 114.

**[INFERIDO] Es Lucide** (o un set con exactamente sus convenciones): rejilla de 24,
trazo sin relleno, extremos y uniones redondeados. Es la firma de Lucide/Feather.
No puedo confirmarlo por nombre de paquete porque el JS está compilado y los SVG van
inline sin atributos de origen.

**El hallazgo real está en el grosor de trazo [MEDIDO]:**

| stroke-width | Usos |
|---|---|
| 2 | 49 |
| **1.8** | 46 |
| **2.2** | 16 |
| 2.5 | 12 |
| 2.4 | 4 |
| 3 / 3.5 | 1 / 1 |

Y los tamaños de caja: 14×14 (58), 15×15 (20), 13×13 (15), 12×12 (12), 11×11 (6),
16×16 (4), 9×9 (4).

**[INFERIDO] Hay compensación óptica deliberada.** Lucide viene con `stroke-width: 2` de
fábrica y el sitio lo cambia sistemáticamente: baja a **1.8** para los íconos más grandes
y sube a **2.2–2.5** para los más chicos. La razón es que al escalar un `viewBox` de 24 a
una caja de 11px, un trazo de 2 se adelgaza a 0.9px reales y desaparece; a 15px se
engrosaría de más. **El objetivo es que el peso visual del trazo sea constante, no el
número.**

**[MEDIDO]** Los íconos nunca superan los 16px. **No hay un solo ícono grande o decorativo
en todo el sitio.**

### I.2 Imágenes

**[MEDIDO]** 9 imágenes en total.

| Recurso | Caja | Natural | Tratamiento |
|---|---|---|---|
| `logo.png` | 80×80 | 320×327 | sin radio, `object-fit: fill` |
| `turbo-flourish.png` | 36×33 | 143×130 | sin radio |
| 7 × `data:image/svg+xml` | 12×12 | 150×150 | `border-radius: 3px` — avatares de marca ficticia |

**[MEDIDO]** `loading="auto"` y `decoding="auto"` en todas: **no hay lazy loading
declarado**, lo cual es razonable con 9 imágenes de las que 7 son data-URI.
**No se usa `aspect-ratio`, ni `object-fit: cover`, ni filtros sobre imágenes.**
Formato servido: PNG y SVG inline. No hay WebP ni AVIF.

**[INFERIDO]** Las imágenes no forman parte del lenguaje visual. El sitio se dibuja con
CSS y SVG; las dos PNG son marca y las siete data-URI son contenido de demo.

---

## J. Stack técnico

**[MEDIDO]**

| | |
|---|---|
| Meta-framework | **Next.js con App Router** — chunks `main-app`, `webpack`, `polyfills` bajo `/_next/static/chunks/`; sin `__NEXT_DATA__`, que es la firma del App Router frente al Pages Router |
| Hosting | **Vercel** — el parámetro `?dpl=dpl_…` en todos los assets es el ID de deployment de Vercel |
| CSS | **Tailwind CSS v4** — ver abajo |
| Fuentes | `next/font` autoalojado; **sin CDN** |
| Theming | clase `.dark` en `<html>` + custom properties; **sin `prefers-color-scheme` en el CSS** |
| Librería de componentes | **[NO DETERMINADO]** — no hay marcadores de shadcn/Radix (`data-radix-*`, `data-slot`, `data-state`) en el HTML servido. Las clases utilitarias sugieren componentes propios |
| Librería de animación | **ninguna** (ver H.3) |

**¿Por qué Tailwind v4 y no v3? [INFERIDO]** Tres evidencias independientes:

1. Las media queries salen en **rem** (`@media (min-width:40rem)`), que es el formato de v4.
   v3 las emite en px.
2. Existe el bloque `:host,:root` con el theme layer (`--color-*`, `--text-*`, `--radius-*`,
   `--spacing`), que es la arquitectura de `@theme` de v4.
3. `--default-transition-duration` y `--default-font-family` son nombres de v4.

### `tailwind.config` inferido

En v4 la configuración vive en CSS. Reconstruido a partir del theme layer medido:

```css
@import "tailwindcss";

@theme {
  /* Los breakpoints son los defaults de v4 — el sitio no los toca.
     De los cinco, sólo sm y lg cambian algo observable (ver E.2). */

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-face), ui-monospace, "SF Mono", monospace;

  --radius-chip: 6px;
  --radius-control: 8px;
  --radius-card: 10px;
  /* rounded-window (14px) está como utilidad suelta, no como token */

  --ease-out-strong: cubic-bezier(.23, 1, .32, 1);
  --ease-link: cubic-bezier(.16, 1, .3, 1);

  --shadow-hairline: var(--shadow-hairline);
  --shadow-btn: var(--shadow-btn);
  --shadow-card: var(--shadow-card);
  --shadow-raised: var(--shadow-raised);
  --shadow-overlay: var(--shadow-overlay);
  --shadow-inset-field: var(--shadow-inset-field);
}
```

**[INFERIDO]** El patrón `--shadow-card: var(--shadow-card)` no es un error: es el truco para
que Tailwind **genere la utilidad** `shadow-card` mientras el valor real se resuelve en
tiempo de ejecución desde `:root`/`.dark`. Así una sola utilidad sirve los dos temas.

**[MEDIDO]** Los colores **no** están en `@theme`: las utilidades `bg-surface`, `text-ink-3`,
etc. se definen contra las custom properties directamente. Por eso los tokens de color no
aparecen en el bloque `:host,:root`.

---

## K bis. Composición de la página y diseño de contenido

Esta sección no mira componentes sino **cómo está armada la página**: el ritmo, la
plantilla que se repite y cómo está escrito el texto. Es, probablemente, lo más
transferible de toda la auditoría — más que los valores de color.

### La plantilla, repetida 19 veces sin una sola excepción

**[MEDIDO]** Las 19 secciones usan **exactamente** la misma estructura, en el mismo orden:

```
[ 01 ]  [ Título ]  [ descripción de una línea ]      ← cabecera, 12px de margen inferior
┌──────────────────────────────────────────────┐
│                                              │
│              demo en vivo                    │      ← marco de 14px, min-height 272px
│                                              │
│        [ segmentado flotante abajo ]         │      ← controles de la demo
└──────────────────────────────────────────────┘
──────────── línea punteada ────────────────────      ← y arranca la siguiente, sin margen
```

Los tres elementos de la cabecera van **en una sola línea, alineados por línea de base**
(`display:flex; align-items:baseline; gap:8px`), no apilados. El número, el título y la
descripción se leen como una frase continua. **[INFERIDO]** Eso es lo que permite que 19
repeticiones no se sientan como un formulario: cada sección ocupa un solo renglón de
"encabezado" y todo el resto es la demo.

**[MEDIDO]** La numeración es explícita (`01`…`19`), en mono, en el gris más tenue, con
`tabular-nums`. No es decorativa: convierte la página en un **índice recorrible**, y es lo
que hace que el panel lateral pueda funcionar como tabla de contenidos.

### El ritmo

**[MEDIDO]** Cero variación. No hay secciones destacadas, ni de ancho completo, ni con
fondo distinto, ni intercaladas con bloques editoriales. Las 19 miden lo mismo de ancho
(672px), tienen el mismo padding (`40px 32px`) y el mismo alto mínimo de demo (272px).

**[INFERIDO]** Es una decisión fuerte y contraintuitiva: la mayoría de las páginas largas
rompen el ritmo cada tantas secciones para que no canse. Esta hace lo contrario — apuesta a
que **la regularidad absoluta sea el efecto**. Funciona porque lo que varía es el contenido
de las demos, que se mueve. El marco es un metrónomo; el contenido, la melodía.

### El orden de las 19 secciones

**[INFERIDO]** No es alfabético ni arbitrario: va **del ciclo de vida de una respuesta hacia
las piezas especializadas**.

| Bloque | Secciones | Qué agrupa |
|---|---|---|
| 01–06 | Loading State, Thinking, Streaming Text, Approval Card, Tool Chips, Task Rows | El agente trabajando, en orden temporal: carga → razona → responde → pide permiso → ejecuta → reporta |
| 07–08 | Chat, Prompt Bar | La conversación y su entrada |
| 09–10 | Recommendation Card, Context Cards | Salida estructurada |
| 11–13 | Diff Table, Records Table, Filter Table | Datos tabulares |
| 14–15 | Sidebar Nav, Search | Navegación |
| 16–19 | Insight Cards, Code Block, Fine-tune Card, Selection Actions | Casos especializados |

**Lo primero que se ve es un estado de carga.** Es la pieza menos glamorosa del catálogo y
está en el puesto uno. **[INFERIDO]** La página se abre demostrando que se ocuparon del
momento en que el producto todavía no tiene nada que mostrar — que es exactamente donde se
nota si alguien pensó la interfaz.

### El texto — hay una regla y se cumple

**[MEDIDO]** Sobre los 19 títulos y las 19 descripciones:

| | |
|---|---|
| Palabras por título | **1,84 de media; 16 de 19 tienen exactamente 2** |
| Largo de la descripción | 39–64 caracteres, **media 51** |
| Descripciones que terminan en punto | 17 de 19 |
| Descripciones que arrancan con sustantivo (no artículo ni verbo) | 13 de 19 |
| Descripciones que nombran al agente / la IA | 8 de 19 |

**[INFERIDO]** Las reglas de escritura, deducidas de los datos:

1. **El título son dos palabras.** Siempre sustantivo, nunca verbo, nunca una frase.
   "Approval Card", "Tool Chips", "Task Rows". Cuando el concepto entra en una, se usa una
   ("Thinking", "Chat", "Search"); nunca se estira a tres para sonar más completo.
2. **La descripción es una línea que explica el mecanismo, no el beneficio.**
   "Pixel-grid loader with shimmer and elapsed time" dice **qué hace la pieza**, no por qué
   te conviene. No hay una sola descripción de venta en las 19.
3. **~50 caracteres, y por una razón medible:** la descripción vive en la misma línea que
   el título y a 12,5px tiene que entrar en el ancho restante. Se pasa de largo y el CSS la
   trunca con puntos suspensivos (`sm:truncate`, medido). **El límite de longitud está
   impuesto por el layout, no por estilo.**
4. **Arrancan con el sustantivo.** "Human-in-the-loop questions…", "Retrieved knowledge
   chunks…", "Status chips that…". Casi nunca con "The" ni con un verbo.

**[INFERIDO]** El conjunto describe una voz **de ficha técnica**: nombra la pieza, dice cómo
funciona, se calla. La misma disciplina que el sistema visual — cada cosa dice lo que es y
nada más.

### Lo que la página NO hace

**[MEDIDO]** Buscados literalmente en el HTML servido y con **cero apariciones**: `pricing`,
`testimonial`, `trusted by`, `faq`, `frequently asked`, `get started`, `sign up`,
`free trial`. **No hay hero**: la página abre directamente con la sección 01.

Lo que sí hay, y conviene ser exacto:

- **Un `<h1>`**, el titular del panel lateral: *"Beautiful UI for AI-native interfaces."*
  Es el único de la página; las 19 secciones usan `<h3>`.
- **Un `<h2>`**, para una captura de correo: *"New components, in your inbox."*
- **Un `<footer>`**, pero de 284 caracteres: el aviso de copyright y **un solo enlace**
  (la licencia MIT). Clase medida:
  `flex items-center justify-between gap-4 border-t border-dashed border-line px-8 py-6`
  — o sea, el mismo punteado que separa las secciones, con `32px 24px` de padding.
  **No hay columnas de enlaces.**
- **Cinco enlaces salientes reales** en todo el sitio (el resto son dominios `example.com`
  de las demos): el estudio que lo hizo, su agenda de llamadas, y tres productos.

**[INFERIDO]** Es una página de producto que **decidió no ser una landing**. El único
llamado a la acción es un pill de 28px al pie del panel lateral. El argumento de venta es
la calidad de las 19 demos: si funcionan, se vendió; si no, ninguna sección de testimonios
lo iba a arreglar.

### Lo transferible a un producto de datos

**[INFERIDO]** De todo lo anterior, lo que se puede llevar tal cual:

- **La cabecera de una línea** (número + título de dos palabras + descripción del mecanismo)
  como plantilla para cada sección de una página larga.
- **Numerar explícitamente** para que la página sea recorrible y el índice lateral tenga
  sentido.
- **El ritmo invariante**: mismo ancho, mismo padding, mismo alto mínimo, siempre.
- **Poner primero lo menos glamoroso**, si es donde se demuestra el criterio.
- **Describir el mecanismo, no el beneficio**, y dejar que el dato hable.
- **Dejar que el límite de longitud lo imponga el layout**, no una guía de estilo.

---

## K. Las reglas de la identidad

Veinte principios accionables. Cada uno sale de una medición de este informe.

1. **La jerarquía es peso y color, nunca tamaño.** El rango tipográfico entero es 10–21px.
   Si necesitás destacar algo, subí el peso (400 → 500 → 600) o subí de `ink-3` a `ink`.
   Agrandar la fuente no es una herramienta de este sistema.

2. **Tres niveles de tinta y ni uno más.** `ink` para lo que se lee, `ink-2` para lo que
   acompaña, `ink-3` para lo que está pero no se lee. No inventes un cuarto.

3. **Un solo acento.** Azul, y nada más. Verde, naranja y rojo son **estados**, no colores
   de marca: sólo aparecen cuando algo está bien, requiere atención o está mal.

4. **La profundidad la hace un borde de 1px, no una sombra.** Las seis sombras del sistema
   empiezan por un anillo de 1px y el desenfoque es casi invisible. Si dudás entre borde y
   sombra, es borde.

5. **Los grises están teñidos de azul.** Croma 0.001–0.010, matiz 251–286. Un gris neutro
   real se ve fuera de lugar.

6. **Punteado para la estructura, sólido para los datos.** El borde punteado separa
   secciones de la página; el sólido separa filas de una tabla. No los mezcles.

7. **Las secciones no se separan con espacio, se separan con una línea.** Cero píxeles de
   margen entre secciones, medido. El aire va adentro (`40px 32px`), no entre medio.

8. **El radio crece con la caja.** 6px a los 24px, 8px a los 28px, 10px en cards, 14px en
   el marco exterior. Así el peso visual de la esquina se mantiene.

9. **El tracking negativo global es parte de la identidad.** `-0.01em` en el 98% de los
   elementos. Sin eso, todo se ve más suelto y más genérico.

10. **Si el usuario lo provocó, 100–150ms; si pasó solo, 300–400ms.** No hay transiciones
    de 500ms en respuesta a un clic.

11. **El realce de hover sobresale del texto.** Márgenes negativos para que el fondo llegue
    más allá de la caja de contenido, sin que el texto se mueva.

12. **Un solo anillo de foco, global, sin excepciones por componente.**
    `2px solid var(--accent)` con `offset: 2px`. Se declara una vez en `:focus-visible`.

13. **El estado de un campo lo dibuja su contenedor, no el campo.** El `input` es
    transparente y sin borde; el contenedor reacciona con `:focus-within`.

14. **Todo número que pueda cambiar va en `tabular-nums`.** Contadores, duraciones,
    cantidades, celdas numéricas. Sin excepción.

15. **Los íconos se ajustan ópticamente, no matemáticamente.** Bajá el trazo a 1.8 cuando el
    ícono es grande y subilo a 2.2–2.5 cuando es chico. Que el peso se vea igual, no que el
    número sea igual.

16. **La mono es para lo que se cuenta, no para lo que se lee.** Números de sección,
    duraciones, dominios, código. Nunca texto corrido.

17. **El movimiento es CSS y se apaga entero.** Nueve keyframes, cero librerías, y un corte
    global con `prefers-reduced-motion` que lleva las animaciones corriendo de 29 a 0.

18. **El contenido se topea en 960px y el fondo queda a la vista.** En pantallas anchas la
    trama diagonal es composición, no relleno.

19. **Los dos temas comparten exactamente los mismos nombres de token.** Ninguno existe sólo
    en claro o sólo en oscuro. Cambian los valores, jamás el vocabulario.

20. **Los tintes cambian de técnica según el tema.** Opacos en claro, con alfa en oscuro.
    Un tinte opaco sobre fondo oscuro se ensucia.

### Lo que el sitio deliberadamente NO hace

- **No usa glassmorphism.** Cero `backdrop-filter` en toda la página.
- **No tiene tipografía fluida.** Ni un `clamp()` de `font-size`. Los tamaños son
  idénticos a 375 y a 1920.
- **No usa gradientes decorativos.** Los tres que hay son funcionales: una textura y dos
  indicadores de carga.
- **No tiene ramps de color numeradas.** Ningún token termina en `-50` ni `-500`.
- **No usa sombras para jerarquía.** Están definidas y casi no se usan.
- **No agranda el texto para jerarquizar.** El titular más grande del sitio es de 21px.
- **No cambia el header al scrollear.** Ni sombra, ni fondo, ni blur: medido antes y después.
- **No oculta contenido en mobile.** El conteo de `display:none` no cambia en el barrido.
- **No usa `aspect-ratio`.** Las alturas se fijan con `min-height` en px.
- **No apila z-index.** El máximo del sitio es 10.
- **No usa librerías de animación.** Todo es CSS.
- **No tiene un botón primario con fondo de acento.** El acento es para foco, enlaces y
  detalles; nunca para llenar un botón.
- **No usa ruido ni grano.** La única textura es la trama.
- **No hay íconos grandes.** Ninguno pasa de 16px.

---

## L. Verificación

### L.1 `replica.html`

Archivo único y autocontenido en esta misma carpeta. Reproduce el panel lateral, una
sección con su cuadro de demo, una card, la tabla, el bloque de código, los campos y las
seis variantes de botón — **usando exclusivamente los tokens de `theme.css`**, que están
inlineados. Incluye el toggle de tema para verificar los dos.

El texto es propio, no copiado del sitio: lo que se replica es el sistema visual, no el
contenido.

### L.2 Verificación numérica

No comparé a ojo contra la captura: **medí la réplica con el mismo script que el original**
y comparé valor contra valor (`09-verifica.js`, resultados en `raw/replica-medida.json`).
40 propiedades, a 1280px, tema oscuro.

**Coinciden 40 de 40.**

| Propiedad | Original | Réplica |
|---|---|---|
| Fondo del body | `rgb(27,28,30)` | `rgb(27,28,30)` ✅ |
| Trama: ángulo / período / alfa | −45°, 7→8px, `rgba(255,255,255,0.055)` | idéntico ✅ |
| `background-attachment` | `fixed` | `fixed` ✅ |
| Cuerpo: tamaño / interlineado | 14px / 21px | 14px / 21px ✅ |
| Tracking global | `-0.14px` | `-0.14px` ✅ |
| Sección: padding | `40px 32px` | `40px 32px` ✅ |
| Sección: borde | `1px dashed rgb(46,48,51)` | idéntico ✅ |
| Gap entre secciones | 0px | 0px ✅ |
| Panel lateral: ancho / posición / borde | 288px / `sticky` / `1px dashed` | idéntico ✅ |
| Contenedor total | 960px | 960px ✅ |
| Demo: radio / fondo / min-height / padding | 14px / `rgb(28,29,31)` / 272px / 12px | idéntico ✅ |
| Demo: sombra | anillo `1px rgb(46,48,51)` | idéntico ✅ |
| Card: radio / fondo / padding | 10px / `rgb(35,36,39)` / 12px | idéntico ✅ |
| Nav ítem: padding / radio / tamaño / caja | `5px 8px` / 7px / 12.5px / 231×29 | idéntico ✅ |
| Nav activo: peso | 500 | 500 ✅ |
| Nº de sección: familia / tamaño / color | JetBrains Mono / 11px / `rgb(108,111,117)` | idéntico ✅ |
| Título de sección | 13px / 600 | 13px / 600 ✅ |
| Descripción de sección | 12.5px / 18.75px | idéntico ✅ |
| Botón de ícono: caja / radio | 28×28 / 8px | idéntico ✅ |
| Botón de ícono chico | 24×24 / 6px | idéntico ✅ |
| Pill: alto / padding / tamaño | 28px / `0 10px` / 11.5px | idéntico ✅ |
| Celda de tabla: padding | `10px 12px` | `10px 12px` ✅ |
| Cabecera: tamaño / peso | 12px / 500 | 12px / 500 ✅ |
| Celda: tamaño / peso | 13px / 500 | 13px / 500 ✅ |
| Fila: borde | `1px solid` | `1px solid` ✅ |
| Código: tamaño / interlineado | 11.5px / 19.55px | idéntico ✅ |
| Código: fondo / padding | `rgb(31,32,34)` / `10px 12px` | idéntico ✅ |
| z-index máximo | 10 | 10 ✅ |
| Elementos con `backdrop-filter` | 0 | 0 ✅ |

En la primera corrida fallaba una: las celdas de tabla me habían quedado en peso 400 y el
original usa **500 en todas las celdas, no sólo en las numéricas**. Corregido y reverificado.

### L.3 Discrepancias que quedan (y por qué)

Estas no son errores de medición: son cosas que un sistema de tokens no captura.

| # | Discrepancia | Causa | Estado |
|---|---|---|---|
| 1 | El logo del original es un dibujo a mano alzada en azul; la réplica usa una marca geométrica | Es un PNG de 320×327, no un valor reproducible | **No resuelta** — fuera del alcance de un sistema de diseño |
| 2 | El original tiene 19 secciones con demos animadas en vivo | La réplica trae siete secciones estáticas | **No resuelta** — es contenido, no identidad |
| 3 | Los pesos 550 y 650 | Necesitan la Inter variable cargada. La réplica los declara, pero si el visitante no tiene Inter instalada el fallback los redondea a 400/700 | **Parcial** — declarados, dependen de la fuente |
| 4 | El tooltip | Su composición no se pudo medir (ver G.9). La réplica lo arma sólo con los cuatro tokens declarados | **Parcial** — marcado en la propia réplica como no verificado |
| 5 | El desvanecido de la lista de navegación al pie | El original lo consigue con `overflow:hidden` + máscara; lo repliqué con `mask-image` | **Resuelta** |
| 6 | El shimmer de carga | Gradiente de tres paradas animado sobre `background-clip: text` | **Resuelta** |

### L.4 Checklist de replicación

Para validar que algo nuevo "se siente" de este sitio:

- [ ] ¿La trama diagonal a −45° con período de 8px está en el fondo y es `fixed`?
- [ ] ¿El texto de cuerpo está entre 12 y 14px, y nada supera los 21px?
- [ ] ¿Hay `letter-spacing: -0.01em` global?
- [ ] ¿La jerarquía se resuelve con peso (400/500/600) y con los tres niveles de tinta?
- [ ] ¿Los planos se separan con un borde de 1px y no con sombra?
- [ ] ¿Las secciones se separan con línea **punteada** y cero margen?
- [ ] ¿Los radios siguen 6 / 8 / 10 / 14 según el tamaño de la pieza?
- [ ] ¿El acento aparece sólo en foco, enlaces y detalles — nunca llenando un botón?
- [ ] ¿Los grises tienen matiz azul (OKLCH H entre 251 y 286)?
- [ ] ¿Las transiciones de hover están entre 100 y 150ms?
- [ ] ¿El anillo de foco es único y global, `2px solid accent` con offset 2?
- [ ] ¿Los números usan `tabular-nums`?
- [ ] ¿Los íconos son de 24 de rejilla, trazo redondeado, entre 11 y 16px, con el grosor
      compensado ópticamente?
- [ ] ¿La mono se usa sólo para números, código y dominios?
- [ ] ¿El contenido está topeado y deja ver el fondo en pantallas anchas?
- [ ] ¿Existe el corte global de `prefers-reduced-motion`?
- [ ] ¿Los dos temas tienen exactamente los mismos nombres de token?
- [ ] ¿Los tintes son opacos en claro y con alfa en oscuro?

---

## Apéndice — Reproducir esta auditoría

Los scripts de extracción se copiaron a `scripts/`. Volcados en `raw/`:

| Archivo | Qué contiene |
|---|---|
| `site.css` | la hoja compilada del sitio (72 KB) |
| `index.html`, `license.html` | HTML servido |
| `css-var-blocks.json` | los 62 bloques del CSS que declaran custom properties |
| `censo.json` | censo de 40 propiedades computadas × 4 viewports × 2 temas |
| `barrido.json`, `barrido-ancho.json` | barrido de 320→1920 de a 1px |
| `estados.json` | 58 controles con default/hover/focus, sticky, y movimiento normal vs. reducido |
| `componentes.json` | árbol con estilos de las 19 secciones y el chrome (1.2 MB) |
| `pares-contraste.json` | 95 pares texto/fondo por tema con fondo efectivo resuelto |
| `glifos.json` | prueba de las features tipográficas |
| `analisis.json` | todo lo derivado, incluidos WCAG y APCA |

**Limitaciones declaradas:** (1) el tooltip nunca se montó, así que su composición no se
midió; (2) las frecuencias de color de texto incluyen herencia; (3) el APCA usa los umbrales
de la tabla de fuentes, conservadores para texto chico; (4) la identificación de Lucide es
inferida por convenciones del SVG, no confirmada por el paquete; (5) sólo se auditó la
página principal en profundidad — `/license` se descargó pero no se analizó, por ser una
página de texto legal sin componentes propios.
