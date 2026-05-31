import createClient from 'openapi-fetch'
import type { paths, components } from './types'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export const api = createClient<paths>({ baseUrl })

export type ApiSchemas = components['schemas']
