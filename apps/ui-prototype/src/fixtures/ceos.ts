/* CONDUCCIÓN DE LAS EMPRESAS — dato EXTERNO, verificado a mano el 2026-08-17.

   Va en su propio archivo y no dentro de companies.ts a propósito: aquél se
   regenera re-scrapeando vacamuerta.io y esto no sale de ahí. Son dos orígenes
   distintos que envejecen distinto, y mezclarlos haría que una corrida del
   scraper pisara datos que no vinieron de él.

   Y envejece PEOR que lo demás: un precio de acción viejo se nota, un CEO viejo
   no. Cuando cambie alguno, la card va a decir algo falso sin que nadie se
   entere, así que conviene revisar este archivo cada vez que se toque el
   fixture de empresas.

   LAS FOTOS. Sólo UNA tiene licencia para reutilizar:

   · Pouyanné — Wikimedia Commons, CC BY-SA 2.0 de Jérémy Barande. La licencia
     obliga a citar autor y licencia, y por eso `credito` se muestra siempre en
     el globo, no es decoración.
   · Marín y Bulgheroni — de notas de Perfil y de Mundo Internacional. Son
     material de un medio: sirven para ver la pieza en el prototipo, pero NO se
     pueden publicar así. Hay que pedirle el retrato al área de comunicación de
     cada empresa, que es quien los reparte a prensa.

   Se buscó antes en Wikimedia Commons, Wikidata, Wikipedia (ES y EN) y en los
   sitios corporativos —catorce rutas estándar, salas de prensa y páginas de
   gobierno corporativo, navegando con scroll y esperando el lazy load—: ninguna
   de las dos aparece ahí. YPF publica una foto grupal del comité ejecutivo y
   ningún retrato individual; PAE no tiene sala de prensa accesible. */

export type Ceo = {
  nombre: string
  cargo: string
  /** desde cuándo ocupa el cargo. Sólo si está verificado. */
  desde?: string
  foto?: string
  /** encuadre de la foto. Va POR FOTO: las tres tienen proporciones distintas
      contra la misma caja apaisada y cada una recorta por un eje distinto. */
  pos?: string
  /** de dónde salió la foto. Obligatorio cuando la licencia lo exige. */
  credito?: string
}

export const CEOS: Record<string, Ceo> = {
  ypf: {
    nombre: 'Horacio Marín',
    cargo: 'Presidente y CEO',
    /* Wikipedia ES, tabla de presidentes de YPF: «15 de diciembre de 2023-presente». */
    desde: 'diciembre de 2023',
    foto: 'https://fotos.perfil.com/2024/08/13/trim/1140/641/horacio-marin-ceo-ypf-1853098.jpg',
    /* 1140×641 (1,78) contra una caja de 1,93: escala por ancho y recorta poco
       en vertical. La cara está arriba, así que el encuadre sube al 25%. */
    pos: 'center 25%',
    credito: 'Perfil',
  },
  totalenergies: {
    nombre: 'Patrick Pouyanné',
    cargo: 'Chairman & CEO',
    /* Wikidata: P169 con calificador de fecha de inicio = 2014-10-01. */
    desde: 'octubre de 2014',
    /* La versión SIN recortar. La otra —«(cropped)», 679×1010— es un recorte
       cerrado a la cara y en una caja apaisada dejaba la cabeza tocando el
       borde de arriba. Mismo original, mismo autor, misma licencia. */
    foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Patrick_Pouyann%C3%A9%2C_PDG_du_groupe_Total.jpg/960px-Patrick_Pouyann%C3%A9%2C_PDG_du_groupe_Total.jpg',
    pos: 'center 30%',
    credito: 'Jérémy Barande · CC BY-SA 2.0',
  },
  pae: {
    nombre: 'Marcos Bulgheroni',
    cargo: 'Group CEO',
    /* Sin fecha: su ítem de Wikidata (Q33127008) no registra el cargo y el
       infobox de Wikipedia tampoco la trae. El globo omite la línea en vez de
       inventarla. */
    foto: 'https://www.mundointernacional.com.mx/wp-content/uploads/2021/06/Foto-Marcos-Bulgheroni-1200x580.jpg',
    /* 1200×580 (2,07) contra 1,93: el único de los tres que escala por ALTO y
       recorta a los lados. Está a la izquierda del cuadro, de ahí el 32%. */
    pos: '32% center',
    credito: 'Mundo Internacional',
  },
}
