/* Mini card del índice — la MISMA composición que las secciones de la página,
   comprimida al ancho de la columna:

     marco (canvas · radio 14 · anillo de 1px · 12px de padding)
       └ rótulo arriba, con el inset de 1px que usan las cabeceras
       └ card adentro (superficie · radio 10 · anillo de 1px · overflow oculto)
           └ foto a sangre

   La diferencia con una sección de la página es sólo el rótulo: allá es
   número + título + descripción en una línea; acá, sin número que numerar y
   con 208px útiles, la leyenda ocupa sola ese renglón y envuelve en dos.

   La foto va en blanco y negro pleno y lavada. Lo pedido era B/N con una capa
   de gris al 10% encima; va con `contrast(0.9)`, que es la MISMA operación
   sin sumar un elemento:

     capa de gris al 10%:  salida = 0,9 · imagen + 0,1 · gris
     contrast(0.9) en CSS: salida = 0,9 · imagen + 0,05

   Coinciden exacto cuando el gris de la capa es el 50%, o sea gris medio.
   Verificado píxel a píxel: diferencia máxima de 1 sobre 255.

   Va con <img> plano y no con next/image: en pantallas de densidad 2 el
   optimizador no llegaba a servirla —ni siquiera disparaba la petición— y la
   card quedaba vacía. Son 139 KB de un JPG estático que se muestra a 208px
   de ancho; no hay nada que optimizar que justifique el riesgo. */

export function CardCuenca() {
  return (
    <div className="s-marco">
      <p className="s-titulo m-0 mb-3 px-1 text-balance">
        La cuenca en números, actualizada cada mes.
      </p>
      <div className="s-card">
        <img
          src="/images/vm-rig.jpg"
          alt="Equipo de perforación en la cuenca Neuquina"
          width={992}
          height={557}
          loading="eager"
          decoding="async"
          className="block w-full"
          style={{
            /* Alto fijo en px y no aspect-ratio, que el sistema prohíbe. 168 es
               lo que daba el 16:9 al ancho de esta card. */
            height: 168,
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(0.9)',
          }}
        />
      </div>
    </div>
  )
}
