import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/payments/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

async function fulfillPaidCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  if (!orderId) return

  if (session.payment_status !== 'paid') {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'pending',
        paymentId: session.id,
      },
    })
    console.log(`Order ${orderId} checkout completed but payment_status=${session.payment_status}`)
    return
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'paid',
      paymentId: session.id,
    },
    include: {
      user: true,
    },
  })

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items as any[]
  for (const item of items) {
    if (item.type === 'course') {
      const existingGrant = await prisma.userPurchasedCourse.findUnique({
        where: {
          userId_courseId: {
            userId: order.userId,
            courseId: item.id,
          },
        },
        select: { id: true, status: true },
      })
      await prisma.userPurchasedCourse.upsert({
        where: {
          userId_courseId: {
            userId: order.userId,
            courseId: item.id,
          },
        },
        update: {
          status: 'active',
          source: 'purchase',
          orderId: order.id,
          purchasedAt: new Date(),
        },
        create: {
          userId: order.userId,
          courseId: item.id,
          orderId: order.id,
          status: 'active',
          source: 'purchase',
        },
      })
      if (!existingGrant || existingGrant.status !== 'active') {
        await prisma.course.update({
          where: { id: item.id },
          data: { enrollmentCount: { increment: 1 } },
        })
      }
    }
  }

  console.log(`Order ${orderId} completed successfully`)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    const event = constructWebhookEvent(body, signature)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await fulfillPaidCheckoutSession(session)
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await fulfillPaidCheckoutSession(session)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
          })
          console.log(`Order ${orderId} expired`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
