/* Íconos del sistema. Dos medidas y nada más, las dos MEDIDAS en la
   referencia: 15px con trazo 1,8 en las cabeceras de tabla, 14px con 1,8 en los
   botones. Siempre `fill:none` y `stroke:currentColor` —el sistema no tiene un
   solo ícono relleno— con las puntas y las uniones redondeadas.

   Van como paths sueltos y no como componentes uno por uno: son geometría, y
   una constante de 40 caracteres no necesita su propia función. */

export const PATH = {
  base: 'M12 3c4.4 0 8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6c0-1.7 3.6-3 8-3zM20 6c0 1.7-3.6 3-8 3S4 7.7 4 6',
  etiqueta: 'm20.6 13.4-8.6 8.6-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8zM7 7h.01',
  lista: 'M3 5h18M3 12h12M3 19h7',
  gota: 'M12 2.7 6.6 9.4a7 7 0 1 0 10.8 0L12 2.7z',
  pozo: 'M4 21h16M7 21V7l5-4 5 4v14M10 21v-5h4v5',
  enlace: 'M14 5h5v5M19 5l-8 8',
  abajo: 'M12 5v14M5 12l7 7 7-7',
  filtro: 'M3 5h18l-7 8v6l-4 2v-8L3 5z',
  ordenar: 'M3 6h12M3 12h8M3 18h4M17 14v6m-3-3h6',
  mas: 'M12 5v14M5 12h14',
  buscar: 'M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM21 21l-4.3-4.3',
  cerrar: 'M6 6l12 12M18 6L6 18',
  /* Los del desglose de empresas. Los cuatro primeros son los mismos que usa
     el de provincias —producción, barras, intensidad, información—: dos webs
     que dicen «producción» con dos íconos distintos son dos vocabularios. */
  tendencia: 'M3 17l5.5-5.5 3.5 3.5L21 6M15 6h6v6',
  barras: 'M4 20h16M7 16V9M12 16V5M17 16v-4',
  intensidad: 'M5 12h14M12 6.5h.01M12 17.5h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11.5v4.5M12 8h.01',
  moneda: 'M12 2.5v19M17 6.8c0-2-2.2-3.1-5-3.1s-5 1.1-5 3.3S9 10.2 12 10.7s5 1.1 5 3.4-2.2 3.2-5 3.2-5-1-5-3',
} as const

export function Icono({
  d,
  size = 15,
  grosor = 1.8,
  className,
}: {
  d: string
  size?: number
  grosor?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
    </svg>
  )
}
