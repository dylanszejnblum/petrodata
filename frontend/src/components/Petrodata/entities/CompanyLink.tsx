import { Link } from '@/i18n/navigation'
import { slugify } from './types'

/**
 * Renders a minerals company / operator name as a link to its company page.
 * The slug is derived with the same `slugify` the backend uses, so links
 * resolve (e.g. "Blue Sky Uranium Corp." → /companies/blue-sky-uranium-corp).
 * Renders plain text for empty / placeholder values.
 *
 * NOTE: only for minerals companies (the /companies dataset). Oil & gas
 * operators are a separate dataset and have no company page.
 */
export function CompanyLink({
  name,
  className,
}: {
  name: string | null | undefined
  className?: string
}) {
  if (!name || name === '—') return <>{name ?? '—'}</>
  return (
    <Link
      href={`/companies/${slugify(name)}`}
      className={className ?? 'text-nd-text-secondary transition-colors hover:text-nd-text-display hover:underline'}
    >
      {name}
    </Link>
  )
}
