import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import Stripe from 'stripe'

const WEBHOOK_URL = process.env.STRIPE_WEBHOOK_URL || 'https://larryacademy.com/api/payments/webhook/stripe'
const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.expired',
  'payment_intent.payment_failed',
]

function argValue(name: string) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasArg(name: string) {
  return process.argv.includes(name)
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is required.')
  }
  return new Stripe(key, { typescript: true })
}

function upsertEnvValue(filePath: string, key: string, value: string) {
  const absolutePath = path.resolve(filePath)
  const lines = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/) : []
  let updated = false
  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      updated = true
      return `${key}=${value}`
    }
    return line
  }).filter((line, index, array) => !(line === '' && index === array.length - 1))

  if (!updated) nextLines.push(`${key}=${value}`)
  fs.writeFileSync(absolutePath, `${nextLines.join('\n')}\n`)
}

async function main() {
  const stripe = stripeClient()
  const envFile = argValue('--env-file')
  const createNew = hasArg('--create-new')

  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  const matchingActiveEndpoint = existing.data.find((endpoint) => endpoint.url === WEBHOOK_URL && endpoint.status === 'enabled')

  if (matchingActiveEndpoint && !createNew) {
    await stripe.webhookEndpoints.update(matchingActiveEndpoint.id, {
      enabled_events: EVENTS,
      description: 'Larry Academy production checkout fulfillment',
      metadata: {
        app: 'larry-academy',
        purpose: 'course-checkout-fulfillment',
      },
    })
    console.log(`Stripe webhook endpoint already exists and was updated: ${matchingActiveEndpoint.id}`)
    console.log('Stripe only reveals webhook signing secrets when an endpoint is first created.')
    console.log('Use --create-new if the server does not already have STRIPE_WEBHOOK_SECRET.')
    return
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: EVENTS,
    description: 'Larry Academy production checkout fulfillment',
    metadata: {
      app: 'larry-academy',
      purpose: 'course-checkout-fulfillment',
    },
  })

  if (!endpoint.secret) {
    throw new Error('Stripe did not return a webhook secret for the newly created endpoint.')
  }

  if (envFile) {
    upsertEnvValue(envFile, 'STRIPE_WEBHOOK_SECRET', endpoint.secret)
  }

  console.log(`Created Stripe webhook endpoint: ${endpoint.id}`)
  console.log(envFile ? `Saved STRIPE_WEBHOOK_SECRET to ${envFile}` : 'Set STRIPE_WEBHOOK_SECRET in the server environment.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
