import { api } from './client'

// The backend (NestJS) does not emit response schemas into openapi.json, so the
// generated `types.ts` leaves these payloads untyped. We model them here and cast
// the openapi-fetch results — the request params stay typed by the generated spec.

export type LegalMode = 'metadata_only' | 'fulltext_internal' | (string & {})

export interface NewsEntities {
  companies?: string[]
  people?: string[]
  projects?: string[]
  blocks?: string[]
  regulators?: string[]
}

export interface NewsAttachment {
  url: string
  type?: string | null
  title?: string | null
}

/** Card-level projection returned by the list + cluster endpoints. */
export interface NewsCard {
  docId: string
  sourceName: string
  sourceFamily: string
  sourceType: string
  sourceUrl: string
  publishedAt: string | null
  eventDate: string | null
  title: string
  deck: string | null
  region: string[]
  entities: NewsEntities
  topics: string[]
  clusterId: string | null
  importanceScore: number | null
  legalMode: LegalMode
  /**
   * Optional card extras. Not yet in the backend list projection — when the
   * `news.service` LIST_SELECT starts emitting them, cards light up automatically.
   * Until then they are undefined and the UI degrades gracefully.
   */
  readingMinutes?: number | null
  image?: string | null
}

/** Full document returned by the single-doc endpoint. */
export interface NewsDocumentFull extends NewsCard {
  bodyText: string | null
  attachments: NewsAttachment[]
  noveltyScore: number | null
  language: string
  retrievedAt: string
  discoveredVia: string | null
}

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface Facet {
  value: string
  count: number
}

export interface NewsFacets {
  topics: Facet[]
  families: Facet[]
  regions: Facet[]
  entities: Facet[]
}

export interface NewsListParams {
  page?: number
  pageSize?: number
  sort?: 'importance' | 'recent'
  family?: string
  topic?: string
  entity?: string
  region?: string
  q?: string
  from?: string
  to?: string
}

export interface NewsListResult {
  items: NewsCard[]
  pagination: Pagination
}

const EMPTY_LIST: NewsListResult = {
  items: [],
  pagination: { page: 1, limit: 24, total: 0 },
}

/** Strip undefined/empty so we don't send blank query params. */
function cleanParams(params: NewsListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}

export async function fetchNews(params: NewsListParams): Promise<NewsListResult> {
  try {
    const { data, error } = await api.GET('/api/v1/news', {
      params: { query: cleanParams(params) as never },
      cache: 'no-store',
    })
    if (error || !data) return EMPTY_LIST
    const body = data as unknown as { data: NewsCard[]; pagination: Pagination }
    return {
      items: body.data ?? [],
      pagination: body.pagination ?? EMPTY_LIST.pagination,
    }
  } catch {
    return EMPTY_LIST
  }
}

export async function fetchNewsFacets(): Promise<NewsFacets> {
  const empty: NewsFacets = { topics: [], families: [], regions: [], entities: [] }
  try {
    const { data, error } = await api.GET('/api/v1/news/facets', { cache: 'no-store' })
    if (error || !data) return empty
    const body = (data as unknown as { data: NewsFacets }).data
    return {
      topics: body?.topics ?? [],
      families: body?.families ?? [],
      regions: body?.regions ?? [],
      entities: body?.entities ?? [],
    }
  } catch {
    return empty
  }
}

export async function fetchNewsDoc(
  docId: string,
): Promise<{ document: NewsDocumentFull; cluster: NewsCard[] } | null> {
  try {
    const { data, error } = await api.GET('/api/v1/news/{docId}', {
      params: { path: { docId } },
      cache: 'no-store',
    })
    if (error || !data) return null
    const body = (data as unknown as { data: { document: NewsDocumentFull; cluster: NewsCard[] } })
      .data
    if (!body?.document) return null
    return { document: body.document, cluster: body.cluster ?? [] }
  } catch {
    return null
  }
}
