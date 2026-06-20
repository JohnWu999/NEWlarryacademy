import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { shanghaiDay } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

function cleanText(value: unknown, max = 500) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function hashIp(value: string | null) {
  if (!value) return null
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 32)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      return NextResponse.json({ saved: false, reason: 'authenticated' })
    }

    const body = await request.json().catch(() => ({}))
    const visitorKey = cleanText(body.visitorId, 120)
    const path = cleanText(body.path, 700)
    if (!visitorKey || !path || path.startsWith('/admin')) {
      return NextResponse.json({ error: 'invalid visitor event' }, { status: 400 })
    }

    const userAgent = cleanText(request.headers.get('user-agent'), 500)
    const referrer = cleanText(body.referrer, 700)
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')
    const ipHash = hashIp(forwardedFor || null)

    const visitor = await prisma.visitor.upsert({
      where: { visitorKey },
      update: {
        lastPath: path,
        userAgent,
        referrer: referrer || undefined,
        ipHash: ipHash || undefined,
      },
      create: {
        visitorKey,
        lastPath: path,
        userAgent,
        referrer,
        ipHash,
      },
    })

    await prisma.visitorEvent.create({
      data: {
        visitorId: visitor.id,
        visitorKey,
        day: shanghaiDay(),
        path,
        referrer,
        userAgent,
      },
    })

    return NextResponse.json({ saved: true })
  } catch (error) {
    console.error('Visitor analytics error:', error)
    return NextResponse.json({ error: 'failed to record visitor event' }, { status: 500 })
  }
}
