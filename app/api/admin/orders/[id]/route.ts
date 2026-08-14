import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

const shipmentSchema = z.object({
  shipped: z.boolean(),
  trackingNumber: z.string().trim().max(120).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const adminUser = session?.user?.email
    ? await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { email: true, role: true },
    })
    : null

  if (!isAdminUser(adminUser)) {
    return NextResponse.json({ error: '没有后台权限' }, { status: 403 })
  }

  const { id } = await params
  const body = shipmentSchema.parse(await request.json())
  const trackingNumber = body.trackingNumber || null

  const order = await prisma.order.update({
    where: { id },
    data: {
      shippingStatus: body.shipped ? 'shipped' : 'pending',
      trackingNumber,
      shippedAt: body.shipped ? new Date() : null,
    },
    select: {
      id: true,
      shippingStatus: true,
      trackingNumber: true,
      shippedAt: true,
    },
  })

  return NextResponse.json({ order })
}
