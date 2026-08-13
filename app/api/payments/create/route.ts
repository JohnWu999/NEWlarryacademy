import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/payments/stripe'
import { z } from 'zod'
import Stripe from 'stripe'
import { ensureCurrentWeeklyStock, productColorLabels, PRODUCT_COLORS, XIAOWENHAO_PRODUCT_ID, XIAOWENHAO_SHIPPING_FEE_CNY } from '@/lib/shop'

const createPaymentSchema = z.object({
  items: z.array(
    z.object({
      type: z.enum(['course', 'product']),
      id: z.string(),
      quantity: z.number().int().min(1).max(10).optional(),
      color: z.enum(PRODUCT_COLORS).optional(),
    })
  ),
  paymentMethod: z.enum(['stripe', 'alipay', 'wechat']),
  shipping: z.object({
    recipientName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(30),
    country: z.string().trim().min(2).max(60),
    region: z.string().trim().min(1).max(80),
    city: z.string().trim().min(1).max(80),
    addressLine1: z.string().trim().min(4).max(180),
    addressLine2: z.string().trim().max(180).optional(),
    postalCode: z.string().trim().max(20).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // Calculate total amount and prepare items
    let totalAmount = 0
    const orderItems: Array<{
      type: 'course' | 'product'
      id: string
      name: string
      price: number
      quantity: number
      color?: (typeof PRODUCT_COLORS)[number]
      stripePriceId?: string | null
    }> = []

    for (const item of validatedData.items) {
      if (item.type === 'course') {
        const course = await prisma.course.findUnique({
          where: { id: item.id },
        })

        if (!course) {
          return NextResponse.json(
            { error: `课程 ${item.id} 不存在` },
            { status: 404 }
          )
        }

        if (course.status === 'coming-soon') {
          return NextResponse.json(
            { error: `课程「${course.title}」尚未开放购买` },
            { status: 400 }
          )
        }

        if (course.isFree || course.price <= 0 || course.accessLevel !== 'paid') {
          return NextResponse.json(
            { error: `课程「${course.title}」无需购买` },
            { status: 400 }
          )
        }

        totalAmount += course.price
        orderItems.push({
          type: 'course',
          id: course.id,
          name: course.title,
          price: course.price,
          quantity: 1,
          stripePriceId: course.stripePriceId,
        })
      } else if (item.type === 'product') {
        await ensureCurrentWeeklyStock(item.id)
        const product = await prisma.product.findUnique({
          where: { id: item.id },
        })

        if (!product || !product.published) {
          return NextResponse.json(
            { error: `商品 ${item.id} 不存在` },
            { status: 404 }
          )
        }

        const quantity = item.quantity || 1
        if (quantity > product.stock) {
          return NextResponse.json(
            { error: product.stock > 0 ? `本周仅剩 ${product.stock} 个` : '本周库存已售罄' },
            { status: 409 }
          )
        }
        if (product.id === XIAOWENHAO_PRODUCT_ID && !item.color) {
          return NextResponse.json({ error: '请选择支架颜色' }, { status: 400 })
        }
        totalAmount += product.price * quantity
        orderItems.push({
          type: 'product',
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          color: item.color,
        })
      }
    }

    const hasCourse = orderItems.some((item) => item.type === 'course')
    const hasProduct = orderItems.some((item) => item.type === 'product')
    if (hasCourse && hasProduct) {
      return NextResponse.json({ error: '课程与实物商品请分开结账' }, { status: 400 })
    }
    if (hasProduct && !validatedData.shipping) {
      return NextResponse.json({ error: '请填写完整的收货信息' }, { status: 400 })
    }
    if (hasProduct && validatedData.paymentMethod !== 'stripe') {
      return NextResponse.json({ error: '实物商品目前请使用 Stripe 安全支付' }, { status: 400 })
    }
    const currency = hasProduct ? 'CNY' : 'USD'
    if (hasProduct) totalAmount += XIAOWENHAO_SHIPPING_FEE_CNY

    // Reserve physical inventory atomically while Stripe Checkout is active.
    const order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        if (item.type !== 'product') continue
        const reserved = await tx.product.updateMany({
          where: { id: item.id, published: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (reserved.count !== 1) throw new Error('OUT_OF_STOCK')
      }

      return tx.order.create({
        data: {
          userId: user.id,
          amount: totalAmount,
          currency,
          status: 'pending',
          paymentMethod: validatedData.paymentMethod,
          items: JSON.stringify(orderItems),
          metadata: validatedData.shipping ? JSON.stringify({ shipping: validatedData.shipping }) : null,
        },
      })
    })

    // Create payment based on method
    if (validatedData.paymentMethod === 'stripe' || validatedData.paymentMethod === 'wechat') {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderItems.map((item) => {
        if (item.stripePriceId) {
          return {
            price: item.stripePriceId,
            quantity: item.quantity || 1,
          }
        }

        return {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: item.color
                ? `${item.name} · ${productColorLabels[item.color].zh}`
                : item.name,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity || 1,
        }
      })
      if (hasProduct) {
        lineItems.push({
          price_data: {
            currency: 'cny',
            product_data: { name: '运费 · Shipping' },
            unit_amount: XIAOWENHAO_SHIPPING_FEE_CNY * 100,
          },
          quantity: 1,
        })
      }

      const result = await createCheckoutSession({
        lineItems,
        mode: 'payment',
        successUrl: `${process.env.NEXTAUTH_URL}/payment/success?orderId=${order.id}`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel?orderId=${order.id}`,
        customerEmail: user.email,
        metadata: {
          orderId: order.id,
          userId: user.id,
          userEmail: user.email,
          orderType: hasProduct ? 'product' : 'course',
        },
        phoneNumberCollection: hasProduct,
        paymentMethodTypes: hasProduct ? ['card', 'wechat_pay'] : undefined,
      })

      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentId: result.sessionId },
        })

        return NextResponse.json({
          success: true,
          orderId: order.id,
          paymentUrl: result.url,
          paymentMethod: validatedData.paymentMethod,
        })
      } else {
        if (hasProduct) {
          await prisma.$transaction(async (tx) => {
            const changed = await tx.order.updateMany({
              where: { id: order.id, status: 'pending' },
              data: { status: 'failed' },
            })
            if (changed.count === 1) {
              for (const item of orderItems) {
                if (item.type === 'product') {
                  await tx.product.update({
                    where: { id: item.id },
                    data: { stock: { increment: item.quantity } },
                  })
                }
              }
            }
          })
        }
        return NextResponse.json(
          { error: result.error || '创建支付失败' },
          { status: 500 }
        )
      }
    } else if (validatedData.paymentMethod === 'alipay') {
      // Alipay integration placeholder
      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentUrl: `/payment/alipay/${order.id}`,
        paymentMethod: 'alipay',
        message: '支付宝支付即将上线',
      })
    }

    return NextResponse.json(
      { error: '不支持的支付方式' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: '本周库存刚刚售罄，请刷新页面' }, { status: 409 })
    }

    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: '创建支付失败' },
      { status: 500 }
    )
  }
}
