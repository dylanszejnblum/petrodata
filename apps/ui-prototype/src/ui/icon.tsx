/* Íconos — glifos de trazo dibujados a mano, con la convención que ya usan
   ThemeToggle y Footer (viewBox 24, fill none, stroke currentColor). No se
   suma una librería de íconos por cuatro glifos.

   Se exportan por nombre y no como componentes sueltos porque quien los pide
   es una prop de <Stat>, y una función no cruza el borde server → client. */

export type IconName = 'line' | 'droplet' | 'bars' | 'doc'

const PATHS: Record<IconName, React.ReactNode> = {
  /* serie temporal: eje en L y la línea quebrada */
  line: (
    <>
      <path d="M4 4v14a2 2 0 0 0 2 2h14" />
      <path d="m20 8-5 5-3.5-3.5L7 14" />
    </>
  ),
  /* gota */
  droplet: <path d="M12 21a6 6 0 0 0 6-6c0-1.9-1-3.6-2.8-5.2C13.4 8.1 12.4 6 12 4c-.4 2-1.4 4.1-3.2 5.8C7 11.4 6 13.1 6 15a6 6 0 0 0 6 6Z" />,
  /* barras de proporción */
  bars: (
    <>
      <path d="M4 4v14a2 2 0 0 0 2 2h14" />
      <path d="M9 16v-3M14 16V8M19 16v-5" />
    </>
  ),
  /* ficha con renglones */
  doc: (
    <>
      <path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6Z" />
      <path d="M14 3v4.6h4.6" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
}

export function Icon({
  name,
  size = 13,
  className,
  style,
}: {
  name: IconName
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {PATHS[name]}
    </svg>
  )
}
