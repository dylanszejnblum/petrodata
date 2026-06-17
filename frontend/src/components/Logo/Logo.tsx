import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <span
      aria-label="Vaca Muerta"
      className={clsx(
        'inline-flex items-center text-nd-text-display text-base tracking-tight font-display',
        className,
      )}
      data-loading={loading}
      data-fetch-priority={priority}
    >
      vacamuerta<span style={{ color: 'var(--nd-success)' }}>.io</span>
    </span>
  )
}
