import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { sendShipmentEmail } from '@/lib/email'

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
  const parsedBody = shipmentSchema.safeParse(await request.json())
  if (!parsedBody.success) {
    return NextResponse.json({ error: '发货信息格式不正确' }, { status: 400 })
  }
  const body = parsedBody.data
  const trackingNumber = body.trackingNumber || null

  if (body.shipped && !trackingNumber) {
    return NextResponse.json({ error: '请先填写物流单号再标记已发货' }, { status: 400 })
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!existingOrder) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }
  if (existingOrder.status !== 'paid' || !existingOrder.items.includes('"type":"product"')) {
    return NextResponse.json({ error: '只能为已付款的实物商品订单发货' }, { status: 400 })
  }

  const shouldNotify = body.shipped
    && (existingOrder.shippingStatus !== 'shipped' || !existingOrder.trackingNumber)

  if (shouldNotify) {
    let recipientName = existingOrder.user.name || '朋友'
    let itemsLabel = '小问号 AI Tutor 支架'
    try {
      const metadata = existingOrder.metadata ? JSON.parse(existingOrder.metadata) : null
      recipientName = metadata?.shipping?.recipientName || recipientName
      const items = JSON.parse(existingOrder.items) as Array<{ type?: string; name?: string; color?: string; quantity?: number }>
      itemsLabel = items
        .filter((item) => item.type === 'product')
        .map((item) => `${item.name || '小问号 AI Tutor 支架'}${item.color ? ` · ${item.color}` : ''} × ${item.quantity || 1}`)
        .join('、') || itemsLabel
    } catch {
      // Keep the graceful defaults above if historical order JSON is malformed.
    }

    let notification: Awaited<ReturnType<typeof sendShipmentEmail>>
    try {
      notification = await sendShipmentEmail({
        email: existingOrder.user.email,
        recipientName,
        orderId: existingOrder.id,
        trackingNumber: trackingNumber!,
        itemsLabel,
      })
    } catch (error) {
      console.error(`Shipment email failed for order ${existingOrder.id}`, error)
      return NextResponse.json({ error: '发货邮件发送失败，订单还没有标记为已发货，请稍后重试' }, { status: 502 })
    }
    if (!notification.delivered) {
      return NextResponse.json({ error: '发货邮件暂时无法发送，订单还没有标记为已发货' }, { status: 503 })
    }
  }

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

  return NextResponse.json({ order, notificationSent: shouldNotify })
}
