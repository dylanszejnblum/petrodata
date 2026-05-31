import type { Metadata } from 'next'
import { getSocialImageURL } from './getSocialImageURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Petrodata — tracking Argentina’s oil, gas, minerals and rare-earths projects. Production, reserves, operators, and geography in one place.',
  images: [
    {
      url: getSocialImageURL(),
      width: 1200,
      height: 630,
      alt: 'Petrodata — Argentina resources tracker',
    },
  ],
  siteName: 'Petrodata',
  title: 'Petrodata — Argentina oil, gas, minerals & rare-earths tracker',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
