'use client'

import dynamic from 'next/dynamic'

const NewsletterModal = dynamic(
  () =>
    import('@/components/Nothing/NewsletterModal').then((m) => ({ default: m.NewsletterModal })),
  { ssr: false },
)

export function NewsletterModalLoader() {
  return <NewsletterModal />
}
