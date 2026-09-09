import { NextRequest } from 'next/server'

const PETRODATA_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.petrodata.dylansz.com'

const PARAMS = ['operator', 'formation', 'basin', 'province', 'bbox', 'limit'] as const

/**
 * Same-origin bridge for interactive map reads.
 *
 * PetroData intentionally does not allow localhost as a browser CORS origin;
 * server-rendered reads already work because they do not carry an Origin
 * header. Map filter changes happen in the browser, so proxy only this public,
 * read-only endpoint through Next instead of leaving the original 1,000-well
 * sample on screen when CORS rejects the request.
 */
export async function GET(request: NextRequest) {
  const upstream = new URL('/api/v1/geo/wells', PETRODATA_URL)
  for (const name of PARAMS) {
    const value = request.nextUrl.searchParams.get(name)
    if (value) upstream.searchParams.set(name, value)
  }

  try {
    const response = await fetch(upstream, {
      cache: 'no-store',
      signal: request.signal,
      headers: { accept: 'application/json' },
    })

    if (!response.ok) {
      return Response.json(
        { error: 'PetroData no pudo cargar los pozos.' },
        { status: response.status },
      )
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'content-type': 'application/geo+json; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  } catch {
    return Response.json(
      { error: 'PetroData no está disponible.' },
      { status: 502 },
    )
  }
}
