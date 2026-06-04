import Stripe from 'stripe'

// Lazy-init: only create Stripe instance when actually used (and key is set)
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
    }
    _stripe = new Stripe(key, { typescript: true })
  }
  return _stripe
}

export interface CreatePaymentIntentParams {
  amount: number
  currency?: string
  metadata?: Record<string, string>
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  const { amount, currency = 'cny', metadata } = params
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    })
    return { success: true as const, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }
  } catch (error) {
    console.error('Stripe payment intent creation error:', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Payment creation failed' }
  }
}

export async function createCheckoutSession(params: {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
  mode: 'payment' | 'subscription'
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  try {
    const session = await getStripe().checkout.sessions.create({
      line_items: params.lineItems,
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    })
    return { success: true as const, sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Stripe checkout session creation error:', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Checkout session creation failed' }
  }
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
}
