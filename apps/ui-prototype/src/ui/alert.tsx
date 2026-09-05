const TONE = {
  info: 'border-line-strong text-secondary',
  positive: 'border-positive/40 text-positive',
  caution: 'border-caution/40 text-caution',
  negative: 'border-negative/40 text-negative',
} as const

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: keyof typeof TONE
  title?: string
  children: React.ReactNode
}) {
  return (
    <div
      role={tone === 'negative' ? 'alert' : 'status'}
      className={`rounded-[10px] border bg-surface px-4 py-3 ${TONE[tone]}`}
    >
      {title && <p className="mb-0.5 text-[13px] font-medium">{title}</p>}
      <div className="text-[13px] text-secondary">{children}</div>
    </div>
  )
}
