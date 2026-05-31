import type { Config, Media } from '@/payload-types'

import { getServerSideURL } from './getURL'

const defaultSocialImagePath = '/opengraph-image.png'

export const getSocialImageURL = (
  image?: Media | Config['db']['defaultIDType'] | null,
): string => {
  const serverUrl = getServerSideURL()

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    return ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return `${serverUrl}${defaultSocialImagePath}`
}
