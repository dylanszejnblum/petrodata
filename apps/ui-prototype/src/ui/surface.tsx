import type { CSSProperties, HTMLAttributes } from 'react'

/* La escalera de superficies (D3): flat/raised siguen el tema;
   inverse y photo son FIJAS — la oscuridad es jerarquía, no tema. */

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'flat' | 'raised' | 'inverse' | 'photo' | 'overlay'
  padding?: 'none' | 'sm' | 'md'
  interactive?: boolean
}

const VARIANT: Record<NonNullable<SurfaceProps['variant']>, string> = {
  flat: 'bg-surface border',
  raised: 'bg-raised border',
  inverse: 'bg-inverse border border-white/10',
  photo: 'border border-white/10 relative overflow-hidden',
  overlay: 'bg-surface/90 border backdrop-blur-md shadow-[var(--elevation-overlay)]',
}

const PADDING: Record<NonNullable<SurfaceProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
}

const PHOTO_BG: CSSProperties = {
  background:
    'linear-gradient(160deg, var(--scrim-soft) 0%, var(--scrim-mid) 55%, var(--scrim-hard) 100%), radial-gradient(120% 90% at 78% 12%, #6c6f73 0%, #45484c 34%, #26292d 68%, #131518 100%)',
}

export function Surface({
  variant = 'flat',
  padding = 'md',
  interactive = false,
  className = '',
  style,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={[
        'rounded-[10px]',
        VARIANT[variant],
        PADDING[padding],
        interactive ? 'transition-colors duration-150 hover:bg-raised cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={variant === 'photo' ? { ...PHOTO_BG, ...style } : style}
      {...props}
    />
  )
}
