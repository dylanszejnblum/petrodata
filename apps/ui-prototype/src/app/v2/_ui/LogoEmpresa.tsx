'use client'

import { useState } from 'react'

/* Logo de empresa. Tres escalones de disponibilidad, los mismos que usa el
   prototipo Estrato y producción:

   1. `logoUrl` — el ícono resuelto a mano del sitio de la empresa. Hace falta
      porque el servicio de favicons de Google devuelve 404 para casi todos los
      .com.ar chicos: tener sitio no alcanza, Google además tiene que haberlo
      indexado.
   2. favicon de Google derivado de `website`, que sí funciona para las marcas
      grandes —Shell, Chevron— aunque devuelva 16x16.
   3. Monograma. No es un "logo faltante": es la marca por defecto, con el mismo
      peso visual que un logo real para que la fila no se vea rota.

   El logo es lo ÚNICO de esta página que lleva color de marca, y a diferencia
   de las miniaturas de noticias no va lavado a blanco y negro. No contradice la
   regla de que sólo el dato lleva color: un logo no es un dato coloreado, es
   identidad, y lavarlo lo volvería irreconocible, que es lo único que tiene que
   hacer.

   La caja vive en .s-placa (sistema.css) y no acá: el lado cambia entre
   escritorio y mobile, y una media query no se escribe en un style inline. */

function faviconDe(website?: string): string | null {
  if (!website) return null
  try {
    const host = new URL(website.startsWith('http') ? website : `https://${website}`).hostname
    /* sz=128 pide lo mejor que Google tenga, aunque para varias no haya nada
       mejor: devuelve 16x16 con cualquier tamaño pedido. Por eso las seis
       primeras del fixture traen `logoUrl` propio, sacado del header o del app
       icon de su sitio. */
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`
  } catch {
    return null
  }
}

/** Inicial de marca: saltea la forma societaria (S.A., SRL, SAU…) y toma la
    primera letra útil del nombre. */
function monograma(nombre: string): string {
  const limpio = nombre
    .replace(/\b(S\.?A\.?S?|S\.?R\.?L\.?|SAU|SAPEM|S\.?E\.?|LTD\.?)\b/gi, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
  return (limpio.charAt(0) || nombre.charAt(0) || '?').toUpperCase()
}

export function LogoEmpresa({
  nombre,
  website,
  logoUrl,
  caja = 56,
  /** true en la placa que acompaña un bloque de datos: se achica a 88 en
      mobile, donde 120 se comería un tercio del ancho útil. */
  responsiva = false,
}: {
  nombre: string
  website?: string
  logoUrl?: string
  /** lado en px. Va en píxeles y no en aspect-ratio, que el sistema prohíbe. */
  caja?: number
  responsiva?: boolean
}) {
  const [falló, setFalló] = useState(false)
  /* El ancho natural del archivo, para no estirarlo. Un favicon de 16px en una
     placa de 120 se ampliaría siete veces y quedaría como un borrón; dibujado
     hasta el DOBLE de su tamaño se ve chico pero nítido, que es lo único que
     hace falta para reconocer una marca. Los que traen un lockup de verdad
     —YPF, 300px— llenan la placa. */
  const [natural, setNatural] = useState<number | null>(null)
  const src = logoUrl ?? faviconDe(website)

  /* La variante responsiva NO manda su caja por inline: un custom property
     inline gana sobre la hoja, media query incluida, y la placa se quedaba en
     120 también en mobile. Ahí el lado lo define .s-placa--grande. */
  const vars = responsiva
    ? {}
    : {
        ['--placa' as string]: `${caja}px`,
        /* El aire escala con el lado: 4px a 56 se leen como margen, pero en una
           placa grande el logo quedaría pegado al borde. Un décimo mantiene la
           proporción, con piso de 4. */
        ['--placa-aire' as string]: `${Math.max(4, Math.round(caja * 0.1))}px`,
        /* El radio sube con la caja, como manda la regla. Los tres escalones
           del sistema: 6 el del chip, 8 el del control —el de las miniaturas de
           noticias— y 10 el de la card, para una placa que ya es un plano. */
        ['--placa-radio' as string]:
          caja >= 96 ? 'var(--radius-card)' : caja >= 40 ? 'var(--radius-control)' : '6px',
      }
  const clase = `s-placa${responsiva ? ' s-placa--grande' : ''}`
  /* El monograma sí necesita saber el lado en JS. En la variante responsiva se
     calcula sobre el chico: un monograma que entra en 88 entra en 120, y al
     revés no. */
  const lado = responsiva ? 88 : caja

  if (!src || falló) {
    return (
      <span
        aria-hidden
        className={clase}
        style={{
          ...vars,
          background: 'var(--field)',
          color: 'var(--ink-2)',
          /* Un tercio del lado: a 120 un medio daría 60px, muy por encima del
             techo tipográfico del sistema. 650 es la compensación óptica
             medida — a este tamaño un 600 se ve más liviano de lo que toca. */
          fontSize: Math.round(lado / 3),
          fontWeight: 650,
        }}
      >
        {monograma(nombre)}
      </span>
    )
  }
  return (
    <span
      className={clase}
      style={{
        ...vars,
        /* Blanco en los dos temas, y es funcional: los logos se dibujan
           asumiendo fondo claro y varios traen transparencia. Es la única
           superficie del sistema que no cambia entre temas. */
        background: '#fff',
        boxShadow: 'var(--shadow-hairline)',
        ...(natural ? { ['--placa-tope' as string]: `${natural * 2}px` } : null),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={(e) => setNatural(e.currentTarget.naturalWidth || null)}
        onError={() => setFalló(true)}
      />
    </span>
  )
}
