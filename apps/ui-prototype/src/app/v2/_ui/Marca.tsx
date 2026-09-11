/* EL LOGO DE VACAMUERTA.IO.

   Reemplaza al rombo de 8px que la barra de marca traía de Estrato (pedido de
   Mariano, 2026-09-11).

   EL TAMAÑO LO FIJA EL CALADO. El rombo era un cuadrado girado: a 8px se lee
   igual que a 40 porque no tiene nada adentro. Este escudo tiene un hueco —la
   forma de reloj de arena del medio— y ése es el que se pierde primero.

   Medido rasterizando a 4x y contando alfa en la franja central: 41,8% de
   hueco a 12px contra 44% en el dibujo a 64. A 12 el calado está entero. El
   default es ése y no más, porque más grande compite con la palabra que tiene
   al lado en la barra de marca.

   EL ANCHO SALE DE LA PROPORCIÓN DEL ARCHIVO: 372×416 da 0,894, o sea 14,3
   sobre 16. Se declara en el elemento para que el navegador reserve la caja
   antes de pintar y la fila no salte.

   `currentColor` Y NO EL #62656b DEL ARCHIVO. Ese hexa es exactamente --ink-2,
   pero clavado deja el logo igual en los dos temas y en oscuro --ink-2 es otro
   color. Heredando, el logo toma la tinta de quien lo contiene y sigue al tema
   solo.

   `fill-rule="evenodd"` es lo que hace el calado: sin eso el escudo sale
   macizo. Viene del archivo original y no se toca, igual que el
   `translate/scale` del path, que es el volteo vertical con el que fue
   dibujado. */
export function Marca({
  size = 12,
  className,
  style,
}: {
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={Math.round((size * 372) / 416)}
      height={size}
      viewBox="0 0 372 416"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      <path
        transform="translate(0 416) scale(1 -1)"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M164 6C178-2 194-2 208 6L348 88C364 97 372 109 372 128V288C372 306 365 318 350 327L208 410C194 418 178 418 164 410L22 327C7 318 0 306 0 288V128C0 109 8 97 24 88L164 6ZM166 65C166 38 206 38 206 65V145C206 181 219 206 249 224L323 270C346 284 326 316 303 302L230 258C202 239 170 239 142 258L66 302C43 316 24 284 47 270L124 223C153 205 166 181 166 145V65Z"
      />
    </svg>
  )
}
