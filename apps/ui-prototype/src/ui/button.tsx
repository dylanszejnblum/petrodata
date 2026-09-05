import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

/* Botón monocromo (D8). El foco visible viene del :focus-visible global. */

type Variant = 'solid' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'icon'

const VARIANT: Record<Variant, string> = {
  solid: 'bg-primary text-canvas hover:opacity-90',
  outline: 'border border-line-strong bg-surface text-primary hover:bg-raised',
  ghost: 'text-secondary hover:bg-raised hover:text-primary',
}

const SIZE: Record<Size, string> = {
  sm: 'min-h-8 px-3 text-[12.5px]',
  md: 'min-h-[38px] px-4 text-[13px]',
  icon: 'size-9 justify-center px-0',
}

function classes(variant: Variant, size: Size, className = '') {
  return [
    'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors duration-150',
    'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
    VARIANT[variant],
    SIZE[size],
    className,
  ].join(' ')
}

export function Button({
  variant = 'solid',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={classes(variant, size, className)} {...props} />
}

export function ButtonLink({
  variant = 'solid',
  size = 'md',
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; href: string }) {
  return <Link href={href} className={classes(variant, size, className)} {...props} />
}
