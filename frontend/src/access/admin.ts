import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

export const adminOnly = ({ req: { user } }: AccessArgs<User>) => {
  return Boolean(user?.roles?.includes('admin'))
}

export const adminOrSelf = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return { id: { equals: user.id } }
}
