import type { Metadata } from 'next'
import { getSocialImageURL } from './getSocialImageURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Vaca Muerta — Argentina oil and gas intelligence. Production, reserves, operators, and geography in one place.',
  images: [
    {
      url: getSocialImageURL(),
      width: 1200,
      height: 630,
      alt: 'Vaca Muerta — Argentina oil and gas intelligence',
    },
  ],
  siteName: 'Vaca Muerta',
  title: 'Vaca Muerta — Argentina oil and gas intelligence',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
