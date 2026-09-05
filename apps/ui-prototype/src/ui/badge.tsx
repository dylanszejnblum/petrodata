import type { HTMLAttributes } from 'react'

type Tone = 'oil' | 'gas' | 'positive' | 'negative' | 'caution' | 'neutral' | 'on-dark'

const TONE: Record<Tone, string> = {
  oil: 'text-oil bg-oil/12 border-transparent',
  gas: 'text-gas bg-gas/12 border-transparent',
  positive: 'text-positive bg-positive/12 border-transparent',
  negative: 'text-negative bg-negative/12 border-transparent',
  caution: 'text-caution bg-caution/12 border-transparent',
  neutral: 'text-secondary bg-transparent border-line-strong border',
  'on-dark': 'text-on-dark border-white/30 border bg-transparent',
}

export function Badge({
  tone = 'neutral',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]',
        TONE[tone],
        className,
      ].join(' ')}
      {...props}
    />
  )
}
