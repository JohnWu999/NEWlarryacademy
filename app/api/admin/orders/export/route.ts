import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

type ShippingInfo = {
  recipientName?: string
  phone?: string
  country?: string
  region?: string
  city?: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
}

type OrderItem = {
  type?: string
  name?: string
  quantity?: number
  color?: string
}

function safeJson<T>(value?: string | null): T | null {
  try {
    return value ? JSON.parse(value) as T : null
  } catch {
    return null
  }
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function formatAddress(shipping?: ShippingInfo | null) {
  if (!shipping) return ''
  return [
    shipping.country,
    shipping.region,
    shipping.city,
    shipping.addressLine1,
    shipping.addressLine2,
    shipping.postalCode,
  ].filter(Boolean).join(' ')
}

export async function GET() {
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

  const orders = await prisma.order.findMany({
    where: {
      status: 'paid',
      items: { contains: '"type":"product"' },
    },
    orderBy: { createdAt: 'asc' },
    take: 1000,
    include: {
      user: { select: { email: true, name: true } },
    },
  })

  const rows = [
    [
      '订单ID',
      '下单时间',
      '客户邮箱',
      '客户用户名',
      '收货人姓名',
      '电话号码',
      '收货地址',
      '商品',
      '金额',
      '币种',
      '订单状态',
      '发货状态',
      '物流单号',
      '发货时间',
    ],
    ...orders.map((order) => {
      const metadata = safeJson<{ shipping?: ShippingInfo }>(order.metadata)
      const items = safeJson<OrderItem[]>(order.items) || []
      const itemLabel = items
        .map((item) => `${item.name || item.type || 'item'}${item.color ? ` (${item.color})` : ''} x${item.quantity || 1}`)
        .join('; ')

      return [
        order.id,
        order.createdAt.toISOString(),
        order.user.email,
        order.user.name || '',
        metadata?.shipping?.recipientName || '',
        metadata?.shipping?.phone || '',
        formatAddress(metadata?.shipping),
        itemLabel,
        order.amount,
        order.currency,
        order.status,
        order.shippingStatus,
        order.trackingNumber || '',
        order.shippedAt?.toISOString() || '',
      ]
    }),
  ]

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="larry-academy-product-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
