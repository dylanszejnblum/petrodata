import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

const VALID_SOURCES = ['newsletter-modal', 'footer', 'landing-page'] as const
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(ip)
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ message: 'Subscribed' }, { status: 200 })
  }

  try {
    const body = await request.json()
    const { email, source } = body

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Subscribed' }, { status: 200 })
    }

    const validatedSource =
      source && VALID_SOURCES.includes(source as (typeof VALID_SOURCES)[number])
        ? source
        : 'newsletter-modal'

    const payload = await getPayload({ config: configPromise })

    const existing = await payload.find({
      collection: 'mailing-list',
      limit: 1,
      where: { email: { equals: email.toLowerCase() } },
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ message: 'Subscribed' }, { status: 200 })
    }

    await payload.create({
      collection: 'mailing-list',
      data: {
        email: email.toLowerCase(),
        source: validatedSource,
      },
    })

    return NextResponse.json({ message: 'Subscribed' }, { status: 200 })
  } catch {
    return NextResponse.json({ message: 'Subscribed' }, { status: 200 })
  }
}
