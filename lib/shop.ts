import { prisma } from '@/lib/prisma'

export const XIAOWENHAO_PRODUCT_ID = 'product-xiaowenhao-ai-tutor-stand'
export const XIAOWENHAO_SHIPPING_FEE_CNY = 8
export const XIAOWENHAO_WEEKLY_LIMIT = 10
export const PRODUCT_COLORS = ['blue', 'purple', 'yellow'] as const
export type ProductColor = (typeof PRODUCT_COLORS)[number]

export const productColorLabels: Record<ProductColor, { zh: string; en: string }> = {
  blue: { zh: '蓝色', en: 'Blue' },
  purple: { zh: '紫色', en: 'Purple' },
  yellow: { zh: '黄色', en: 'Yellow' },
}

export function xiaowenhaoWeeklyCapacity(date = new Date()) {
  const extraStock = Math.max(0, Number.parseInt(process.env.XIAOWENHAO_EXTRA_STOCK || '0', 10) || 0)
  const extraStockUntil = process.env.XIAOWENHAO_EXTRA_STOCK_UNTIL
    ? new Date(process.env.XIAOWENHAO_EXTRA_STOCK_UNTIL)
    : null
  const extraIsActive = extraStockUntil
    && !Number.isNaN(extraStockUntil.getTime())
    && date < extraStockUntil

  return XIAOWENHAO_WEEKLY_LIMIT + (extraIsActive ? extraStock : 0)
}

function currentWeekStart(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay() || 7
  start.setUTCDate(start.getUTCDate() - day + 1)
  return start
}

export async function ensureCurrentWeeklyStock(productId: string) {
  if (productId !== XIAOWENHAO_PRODUCT_ID) {
    return prisma.product.findUnique({ where: { id: productId } })
  }

  const now = new Date()
  const pendingCutoff = new Date(now.getTime() - (31 * 60 * 1000))
  const activeOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: currentWeekStart(now) },
      OR: [
        { status: 'paid' },
        { status: 'pending', createdAt: { gte: pendingCutoff } },
      ],
    },
    select: { items: true },
  })

  const reserved = activeOrders.reduce((total, order) => {
    const items = JSON.parse(order.items) as ReservedOrderItem[]
    return total + items.reduce((orderTotal, item) => (
      item.type === 'product' && item.id === XIAOWENHAO_PRODUCT_ID
        ? orderTotal + Math.max(1, item.quantity || 1)
        : orderTotal
    ), 0)
  }, 0)

  const stock = Math.max(0, xiaowenhaoWeeklyCapacity(now) - reserved)
  return prisma.product.upsert({
    where: { id: XIAOWENHAO_PRODUCT_ID },
    update: {
      name: '小问号 AI Tutor 支架',
      description: '为桌面 AI 学习设计的 3D 打印摄像头支架。螺旋一体成型，圆形稳固底座，提供蓝色、紫色和黄色三种选择。',
      price: Number(process.env.XIAOWENHAO_STAND_PRICE_CNY || 49),
      category: '3d-models',
      imageUrl: '/products/xiaowenhao-ai-tutor-stand.png',
      stock,
      featured: true,
      published: true,
    },
    create: {
      id: XIAOWENHAO_PRODUCT_ID,
      name: '小问号 AI Tutor 支架',
      description: '为桌面 AI 学习设计的 3D 打印摄像头支架。螺旋一体成型，圆形稳固底座，提供蓝色、紫色和黄色三种选择。',
      price: Number(process.env.XIAOWENHAO_STAND_PRICE_CNY || 49),
      category: '3d-models',
      imageUrl: '/products/xiaowenhao-ai-tutor-stand.png',
      stock,
      featured: true,
      published: true,
    },
  })
}

type ReservedOrderItem = {
  type: 'course' | 'product'
  id: string
  quantity?: number
}

export async function releaseProductReservations(orderId: string, nextStatus = 'cancelled') {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: 'pending' },
      data: { status: nextStatus },
    })
    if (changed.count !== 1) return false

    const order = await tx.order.findUnique({ where: { id: orderId }, select: { items: true } })
    const items = order ? JSON.parse(order.items) as ReservedOrderItem[] : []
    for (const item of items) {
      if (item.type === 'product') {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { increment: Math.max(1, item.quantity || 1) } },
        })
      }
    }
    return true
  })
}
