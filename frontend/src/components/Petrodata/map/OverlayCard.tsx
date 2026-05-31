import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/utilities/ui'

export function OverlayCard({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={cn(
        'pointer-events-auto border border-nd-border bg-nd-surface/85 text-nd-text-primary shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}

export function OverlayLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-nd-text-secondary text-[10px] tracking-[0.08em] uppercase"
      style={{ fontFamily: 'var(--font-space-mono)' }}
    >
      {children}
    </span>
  )
}
