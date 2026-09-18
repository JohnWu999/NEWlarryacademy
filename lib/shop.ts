import { prisma } from '@/lib/prisma'

export const XIAOWENHAO_STAND_ONLY_PRODUCT_ID = 'product-xiaowenhao-ai-tutor-stand-2'
export const XIAOWENHAO_WITH_CAMERA_PRODUCT_ID = 'product-xiaowenhao-ai-tutor-stand-2-with-camera'
export const XIAOWENHAO_PRODUCT_ID = XIAOWENHAO_STAND_ONLY_PRODUCT_ID
export const WALKING_IN_AGES_BOOK_PRODUCT_ID = 'product-walking-in-ages-book'
const LEGACY_XIAOWENHAO_PRODUCT_IDS = [
  'product-xiaowenhao-ai-tutor-stand',
  'product-xiaowenhao-ai-tutor-stand-rainbow',
] as const
export const SHIPPING_METHODS = ['free', 'cainiao', 'sf'] as const
export type ShippingMethod = (typeof SHIPPING_METHODS)[number]
export const shippingMethodDetails: Record<ShippingMethod, { label: string; fee: number }> = {
  free: { label: '包邮', fee: 0 },
  cainiao: { label: '菜鸟', fee: 8 },
  sf: { label: '顺丰', fee: 18 },
}

const walkingInAgesBook = {
  name: '《七岁行欧洲》 Walking in Ages',
  description: '一本由七岁孩子亲自写下的欧洲探索记录：从历史、艺术到城市与人，用好奇心把行走变成学习。',
  price: 55,
  imageUrl: '/about/larry-book.jpg',
  initialStock: 100,
} as const

export function isWalkingInAgesBook(productId: string) {
  return productId === WALKING_IN_AGES_BOOK_PRODUCT_ID
}

export async function ensureWalkingInAgesBook() {
  const existing = await prisma.product.findUnique({ where: { id: WALKING_IN_AGES_BOOK_PRODUCT_ID } })
  return prisma.product.upsert({
    where: { id: WALKING_IN_AGES_BOOK_PRODUCT_ID },
    update: {
      name: walkingInAgesBook.name,
      description: walkingInAgesBook.description,
      price: walkingInAgesBook.price,
      category: 'books',
      imageUrl: walkingInAgesBook.imageUrl,
      featured: true,
      published: true,
    },
    create: {
      id: WALKING_IN_AGES_BOOK_PRODUCT_ID,
      name: walkingInAgesBook.name,
      description: walkingInAgesBook.description,
      price: walkingInAgesBook.price,
      category: 'books',
      imageUrl: walkingInAgesBook.imageUrl,
      stock: existing?.stock ?? walkingInAgesBook.initialStock,
      featured: true,
      published: true,
    },
  })
}
export const XIAOWENHAO_WEEKLY_LIMIT = 10
export const PRODUCT_COLORS = ['glacier-blue', 'neon-pink-blue', 'midnight-blue-black', 'dream-purple', 'lava-red-black'] as const
export type ProductColor = (typeof PRODUCT_COLORS)[number]
export const PRODUCT_MODELS = ['stand-only', 'with-camera'] as const
export type ProductModel = (typeof PRODUCT_MODELS)[number]

export const productColorLabels: Record<ProductColor, { zh: string; en: string }> = {
  'glacier-blue': { zh: '冰川蓝', en: 'Glacier Blue' },
  'neon-pink-blue': { zh: '霓虹粉蓝', en: 'Neon Pink Blue' },
  'midnight-blue-black': { zh: '星夜蓝黑', en: 'Midnight Blue Black' },
  'dream-purple': { zh: '幻境炫紫', en: 'Dream Purple' },
  'lava-red-black': { zh: '熔岩红黑', en: 'Lava Red Black' },
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
    name: '小问号 AI Tutor 支架 2.0 · 炫彩款（带 500 万像素摄像头）',
    description: '升级高度的炫彩桌面 AI 学习支架，配备 500 万像素摄像头。螺旋造型搭配稳固圆底座，每件成品都有自然变化的炫彩纹理。',
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
  if (isWalkingInAgesBook(productId)) return ensureWalkingInAgesBook()
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
  if (!isXiaowenhaoStandProduct(productId) && !isWalkingInAgesBook(productId)) {
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
