import React from 'react'

import type { ChartBlock as ChartBlockProps } from '@/payload-types'
import { ChartClient } from './Component.client'

type Props = ChartBlockProps & {
  className?: string
}

export const ChartBlockComponent: React.FC<Props> = (props) => {
  return <ChartClient {...props} />
}
