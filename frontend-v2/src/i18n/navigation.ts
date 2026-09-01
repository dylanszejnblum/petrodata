import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware drop-in replacements for next/link, next/navigation hooks, etc.
// Use these everywhere we navigate inside the app so the locale prefix is
// preserved automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
