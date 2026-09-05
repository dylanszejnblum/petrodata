/* BLOQUES DEL CUERPO DE LA NOTA — las interrupciones que hacen que una nota no
   sea un bloque de texto.

   La referencia no tiene ninguno: es un catálogo de componentes y su prosa más
   larga son dos renglones de descripción. Así que todos son extensión, y se
   construyen con lo que el sistema sí tiene —el filete de 1px, las seis
   superficies, los tres niveles de tinta— y con lo que prohíbe presente: nada
   de comillas gigantes, itálicas, degradados decorativos ni backdrop-filter.

   Los cuatro comparten un margen vertical de 20px. Que el pulso sea parejo es
   lo que hace que ninguna interrupción pese más que otra. */

/** Intertítulo. 13/600 y nada más: la jerarquía del sistema es peso y tinta,
    no cuerpo. Lo que lo separa del párrafo es el aire de arriba. */
export function Intertitulo({ children }: { children: React.ReactNode }) {
  return <h2 className="s-intertitulo">{children}</h2>
}

/** Cita destacada. Filete vertical a la izquierda y el texto a 17 —el escalón
    de display que queda debajo del titular—, que es lo que hace que la
    interrupción se note. Ver .s-cita en sistema.css para el porqué del tamaño. */
export function Cita({ children, quien }: { children: React.ReactNode; quien?: string }) {
  return (
    <figure className="m-0">
      <blockquote className="s-cita m-0">{children}</blockquote>
      {quien && (
        <figcaption className="s-micro -mt-3 mb-5 pl-4" style={{ color: 'var(--ink-2)' }}>
          {quien}
        </figcaption>
      )}
    </figure>
  )
}

/** Foto del cuerpo con su epígrafe. Alto fijo en px: sin aspect-ratio, que el
    sistema prohíbe, y porque las fotos tienen proporciones distintas — con
    alto libre cada figura mediría otra cosa y se perdería el ritmo. */
export function Figura({ src, pie }: { src: string; pie: string }) {
  return (
    <figure className="s-figura">
      <img src={src} alt="" width={1280} height={720} loading="lazy" decoding="async"
        style={{ filter: 'grayscale(1) contrast(0.9)' }} />
      <figcaption>{pie}</figcaption>
    </figure>
  )
}

/** Reproductor. Es un mock, igual que en la ruta vieja, así que lo único que
    hay que resolver es la afordancia: que se lea «esto es un video» sobre una
    foto cualquiera. Círculo en --surface OPACO —el sistema prohíbe el vidrio
    translúcido— que sobre blanco y negro se ve en la parte clara y en la
    oscura. */
export function Video({ src, fuente }: { src: string; fuente: string }) {
  return (
    <figure className="m-0" aria-label="Video de la nota">
      <button type="button" className="s-video" aria-label={`Reproducir el video de ${fuente}`}>
        <img src={src} alt="" width={1280} height={720} loading="lazy" decoding="async"
          style={{ filter: 'grayscale(1) contrast(0.9)' }} />
        <span className="play" aria-hidden>
          {/* Triángulo relleno: el ícono del sistema es de trazo y a 44px un
              play de contorno se lee como un cursor. */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        </span>
        <span className="rot s-chip s-chip--neutro s-chip--mini">Video · {fuente}</span>
      </button>
    </figure>
  )
}

/* Los cuatro destinos de compartir de la ruta vieja, con sus mismos paths.
   Son enlaces normales: no hay JS y no hay tracking. */
const REDES: { id: string; rot: string; url: (u: string, t: string) => string; d: string }[] = [
  {
    id: 'whatsapp',
    rot: 'Compartir por WhatsApp',
    url: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`,
    d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  },
  {
    id: 'x',
    rot: 'Compartir en X',
    url: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    id: 'linkedin',
    rot: 'Compartir en LinkedIn',
    url: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  },
  {
    id: 'facebook',
    rot: 'Compartir en Facebook',
    url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
]

/** Compartir. En la ruta vieja iba sobre la foto del hero, en blanco
    translúcido; acá el hero es una card clara, así que va en el pie con el
    resto de los metadatos y con el anillo de botón del sistema. */
export function Compartir({ titulo, id }: { titulo: string; id: string }) {
  const url = `https://vacamuerta.io/noticias/${id}`
  return (
    <span className="s-share" role="group" aria-label="Compartir la nota">
      {REDES.map((r) => (
        <a
          key={r.id}
          href={r.url(url, titulo)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={r.rot}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d={r.d} />
          </svg>
        </a>
      ))}
    </span>
  )
}
