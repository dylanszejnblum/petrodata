import createClient from 'openapi-fetch'
import type { paths, components } from './types'

/* Keep v2 pointed at the same hosted PetroData service as v1 by default.
   Local development can still override this with NEXT_PUBLIC_API_BASE_URL. */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.petrodata.dylansz.com'

export const api = createClient<paths>({ baseUrl })

export type ApiSchemas = components['schemas']
