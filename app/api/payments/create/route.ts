import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/payments/stripe'
import { z } from 'zod'

const createPaymentSchema = z.object({
  items: z.array(
    z.object({
      type: z.enum(['course', 'product']),
      id: z.string(),
      quantity: z.number().min(1).optional(),
    })
  ),
  paymentMethod: z.enum(['stripe', 'alipay', 'wechat']),
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
    const orderItems = []

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

        totalAmount += course.price
        orderItems.push({
          type: 'course',
          id: course.id,
          name: course.title,
          price: course.price,
          quantity: 1,
        })
      } else if (item.type === 'product') {
        const product = await prisma.product.findUnique({
          where: { id: item.id },
        })

        if (!product) {
          return NextResponse.json(
            { error: `商品 ${item.id} 不存在` },
            { status: 404 }
          )
        }

        const quantity = item.quantity || 1
        totalAmount += product.price * quantity
        orderItems.push({
          type: 'product',
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
        })
      }
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        amount: totalAmount,
        status: 'pending',
        paymentMethod: validatedData.paymentMethod,
        items: JSON.stringify(orderItems),
      },
    })

    // Create payment based on method
    if (validatedData.paymentMethod === 'stripe') {
      const lineItems = orderItems.map((item) => ({
        price_data: {
          currency: 'cny',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      }))

      const result = await createCheckoutSession({
        lineItems,
        mode: 'payment',
        successUrl: `${process.env.NEXTAUTH_URL}/payment/success?orderId=${order.id}`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel?orderId=${order.id}`,
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
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
          paymentMethod: 'stripe',
        })
      } else {
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
    } else if (validatedData.paymentMethod === 'wechat') {
      // WeChat Pay integration placeholder
      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentUrl: `/payment/wechat/${order.id}`,
        paymentMethod: 'wechat',
        message: '微信支付即将上线',
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

    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: '创建支付失败' },
      { status: 500 }
    )
  }
}
