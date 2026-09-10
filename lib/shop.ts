import { prisma } from '@/lib/prisma'

export const XIAOWENHAO_STAND_ONLY_PRODUCT_ID = 'product-xiaowenhao-ai-tutor-stand-2'
export const XIAOWENHAO_WITH_CAMERA_PRODUCT_ID = 'product-xiaowenhao-ai-tutor-stand-2-with-camera'
export const XIAOWENHAO_PRODUCT_ID = XIAOWENHAO_STAND_ONLY_PRODUCT_ID
const LEGACY_XIAOWENHAO_PRODUCT_IDS = [
  'product-xiaowenhao-ai-tutor-stand',
  'product-xiaowenhao-ai-tutor-stand-rainbow',
] as const
export const SHIPPING_METHODS = ['cainiao', 'sf'] as const
export type ShippingMethod = (typeof SHIPPING_METHODS)[number]
export const shippingMethodDetails: Record<ShippingMethod, { label: string; fee: number }> = {
  cainiao: { label: '菜鸟', fee: 8 },
  sf: { label: '顺丰', fee: 18 },
}
export const XIAOWENHAO_WEEKLY_LIMIT = 10
export const PRODUCT_COLORS = ['blue', 'purple', 'yellow'] as const
export type ProductColor = (typeof PRODUCT_COLORS)[number]
export const PRODUCT_MODELS = ['stand-only', 'with-camera'] as const
export type ProductModel = (typeof PRODUCT_MODELS)[number]

export const productColorLabels: Record<ProductColor, { zh: string; en: string }> = {
  blue: { zh: '蓝色', en: 'Blue' },
  purple: { zh: '紫色', en: 'Purple' },
  yellow: { zh: '黄色', en: 'Yellow' },
}

export const productModelDetails: Record<ProductModel, { zh: string; en: string; price: number; productId: string }> = {
  'stand-only': { zh: '不带摄像头', en: 'Stand only', price: 99, productId: XIAOWENHAO_STAND_ONLY_PRODUCT_ID },
  'with-camera': { zh: '带摄像头', en: 'With camera', price: 199, productId: XIAOWENHAO_WITH_CAMERA_PRODUCT_ID },
}

const standProducts = {
  [XIAOWENHAO_PRODUCT_ID]: {
    name: '小问号 AI Tutor 支架 2.0 · 炫彩款（不带摄像头）',
    description: '升级高度的炫彩桌面 AI 学习支架，不含摄像头。螺旋造型搭配稳固圆底座，每件成品都有自然变化的炫彩纹理。',
    price: () => productModelDetails['stand-only'].price,
    imageUrl: '/products/xiaowenhao-ai-tutor-stand-2.png',
  },
  [XIAOWENHAO_WITH_CAMERA_PRODUCT_ID]: {
    name: '小问号 AI Tutor 支架 2.0 · 炫彩款（带 500 万像素自动对焦摄像头）',
    description: '升级高度的炫彩桌面 AI 学习支架，配备 500 万像素自动对焦摄像头。螺旋造型搭配稳固圆底座，每件成品都有自然变化的炫彩纹理。',
    price: () => productModelDetails['with-camera'].price,
    imageUrl: '/products/xiaowenhao-ai-tutor-stand-2.png',
  },
} as const

export function isXiaowenhaoStandProduct(productId: string) {
  return productId in standProducts
}

export function xiaowenhaoWeeklyCapacity() {
  return XIAOWENHAO_WEEKLY_LIMIT
}

export function xiaowenhaoProductWeeklyCapacity(productId: string) {
  return isXiaowenhaoStandProduct(productId) ? xiaowenhaoWeeklyCapacity() : 0
}

function currentWeekStart(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay() || 7
  start.setUTCDate(start.getUTCDate() - day + 1)
  return start
}

function stockWeekKey(date = new Date()) {
  return currentWeekStart(date).toISOString().slice(0, 10)
}

export async function ensureCurrentWeeklyStock(productId: string) {
  if (!isXiaowenhaoStandProduct(productId)) {
    return prisma.product.findUnique({ where: { id: productId } })
  }

  const productConfig = standProducts[productId as keyof typeof standProducts]

  const [existingProduct, legacyProduct] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, stockWeek: true, weeklyLimit: true },
    }),
    prisma.product.findUnique({
      where: { id: LEGACY_XIAOWENHAO_PRODUCT_IDS[0] },
      select: { stock: true, stockWeek: true },
    }),
  ])
  const weeklyLimit = existingProduct?.weeklyLimit ?? xiaowenhaoProductWeeklyCapacity(productId)
  const currentStockWeek = stockWeekKey()
  const legacyStockIsCurrent = productId === XIAOWENHAO_STAND_ONLY_PRODUCT_ID && legacyProduct?.stockWeek === currentStockWeek
  const stock = existingProduct?.stock ?? (legacyStockIsCurrent ? legacyProduct.stock : weeklyLimit)
  const stockNeedsWeeklyReset = Boolean(existingProduct?.stockWeek && existingProduct.stockWeek !== currentStockWeek)
  const product = await prisma.product.upsert({
    where: { id: productId },
    update: {
      name: productConfig.name,
      description: productConfig.description,
      price: productConfig.price(),
      category: '3d-models',
      imageUrl: productConfig.imageUrl,
      stock: stockNeedsWeeklyReset ? weeklyLimit : stock,
      stockWeek: currentStockWeek,
      weeklyLimit,
      featured: true,
      published: true,
    },
    create: {
      id: productId,
      name: productConfig.name,
      description: productConfig.description,
      price: productConfig.price(),
      category: '3d-models',
      imageUrl: productConfig.imageUrl,
      stock: weeklyLimit,
      stockWeek: currentStockWeek,
      weeklyLimit,
      featured: true,
      published: true,
    },
  })

  // Keep historical order relations intact while removing the 1.0 and rainbow
  // products from every public sales surface.
  await prisma.product.updateMany({
    where: { id: { in: [...LEGACY_XIAOWENHAO_PRODUCT_IDS] } },
    data: { featured: false, published: false },
  })

  return product
}

export async function setProductAvailableStock(productId: string, stock: number) {
  if (!isXiaowenhaoStandProduct(productId)) {
    throw new Error('UNSUPPORTED_PRODUCT')
  }

  await ensureCurrentWeeklyStock(productId)
  return prisma.product.update({
    where: { id: productId },
    data: {
      stock,
      stockWeek: stockWeekKey(),
    },
    select: { id: true, name: true, stock: true },
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
