import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getSocialImageURL } from './getSocialImageURL'

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const title = doc?.meta?.title || doc?.title || ''
  const description = doc?.meta?.description || ''
  const ogImageUrl = doc?.meta?.image
    ? getSocialImageURL(doc.meta.image as Media | Config['db']['defaultIDType'])
    : getSocialImageURL()

  const metaTitle = title
    ? `${title} | Vaca Muerta`
    : 'Vaca Muerta — Argentina oil and gas intelligence'

  return {
    description: description as string | undefined,
    openGraph: mergeOpenGraph({
      description: (description as string) || '',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title as string }],
      title: metaTitle,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: (description as string) || '',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title as string }],
    },
    title: metaTitle,
  }
}
