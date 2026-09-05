# beautifului.dev — ingeniería inversa de la identidad visual

Auditoría del sistema de diseño de https://www.beautifului.dev/, hecha midiendo el sitio
en vivo y su CSS servido. Nada estimado a ojo desde una captura.

## Qué abrir según lo que quieras hacer

| Quiero… | Abrí |
|---|---|
| **Construir algo con esta identidad** | **[`SISTEMA.md`](SISTEMA.md)** ← empezá acá |
| Verificar de dónde salió un valor | [`audit.md`](audit.md) |
| Los tokens en formato máquina | [`tokens.json`](tokens.json) |
| Los tokens listos para pegar en un proyecto | [`theme.css`](theme.css) |
| Ver una implementación que funciona | [`replica.html`](replica.html) |
| Ver el sitio original | [`screenshots/`](screenshots/) |

**Si quien va a construir es un LLM, pasale `SISTEMA.md` y nada más.** Es autosuficiente
—los tokens están adentro— y está escrito para producir, no para auditar. `audit.md` tiene
40 KB de metodología y evidencia que a un modelo que sólo quiere generar le hacen ruido.

## Qué hay en cada archivo

- **`SISTEMA.md`** — guía de construcción. Las cinco decisiones que sostienen el sistema,
  la regla que permite generar valores nuevos, los tokens, las recetas de componente, la
  composición de página, las reglas de escritura, la lista de lo que **no** hay que hacer
  y una autoverificación final.
- **`audit.md`** — el informe completo. Cada dato etiquetado como medido o inferido, con
  su evidencia. Incluye contrastes WCAG y APCA de los 95 pares reales por tema, el barrido
  de breakpoints y las limitaciones declaradas.
- **`tokens.json`** — formato W3C-ish, con OKLCH y frecuencia de uso por token.
- **`theme.css`** — custom properties de los dos temas, más las primitivas de composición.
- **`replica.html`** — reconstrucción autocontenida. Se verificó midiéndola con el mismo
  script que el original: coinciden las 40 propiedades comparadas.
- **`raw/`** — datos crudos: el CSS y el HTML servidos, el censo de estilos computados,
  el barrido de ancho, los estados de 58 controles, los pares de contraste.
- **`scripts/`** — los scripts de Playwright que produjeron todo lo anterior.
- **`screenshots/`** — 61 capturas: página completa en 4 viewports × 2 temas, cada sección
  del sitio, y la réplica.

## Dos advertencias antes de copiar nada

1. **El gris terciario del original no llega a AA** (2,4–3,5:1) y lo usan para contenido
   real. Ver `SISTEMA.md` §10.1: la regla para nosotros es que `ink-3` va sólo para
   metadata.
2. **La densidad hay que justificarla.** Tipografía de 10–13px funciona para una galería
   que miran devs en desktop. Ver §10.2.
