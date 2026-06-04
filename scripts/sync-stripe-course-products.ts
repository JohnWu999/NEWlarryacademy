import 'dotenv/config'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type CourseForStripe = {
  id: string
  title: string
  description: string
  courseTrack: string
  category: string
  status: string
  gradeLevel: string | null
  stripePriceId: string | null
}

const PRICE_BY_TRACK: Record<string, { unitAmount: number; currency: string }> = {
  'ib-big-math': { unitAmount: 2900, currency: 'usd' },
  'ngss-science': { unitAmount: 1900, currency: 'usd' },
}

function hasArg(name: string) {
  return process.argv.includes(name)
}

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is required. Put it in the shell environment or a local .env file, never in Git.')
  }
  return new Stripe(key, { typescript: true })
}

function centsToMajor(unitAmount: number) {
  return unitAmount / 100
}

function sanitizeLookupPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function courseMetadata(course: CourseForStripe, unitAmount: number, currency: string) {
  return {
    larry_course_id: course.id,
    larry_course_track: course.courseTrack,
    larry_course_category: course.category,
    larry_course_status: course.status,
    larry_course_grade: course.gradeLevel || '',
    larry_price_cents: String(unitAmount),
    larry_price_currency: currency,
  }
}

function productDescription(course: CourseForStripe) {
  const text = course.description?.trim() || `${course.title} on Larry Academy`
  return text.length > 1000 ? `${text.slice(0, 997)}...` : text
}

async function findCourseProduct(stripe: Stripe, course: CourseForStripe) {
  const query = `metadata['larry_course_id']:'${course.id}'`
  const result = await stripe.products.search({ query, limit: 1 })
  return result.data[0] || null
}

async function findPriceByLookupKey(stripe: Stripe, lookupKey: string) {
  const result = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
    limit: 1,
  })
  return result.data[0] || null
}

async function syncCourse(course: CourseForStripe, options: { dryRun: boolean; activatePaid: boolean }) {
  const priceConfig = PRICE_BY_TRACK[course.courseTrack]
  if (!priceConfig) return null

  const { unitAmount, currency } = priceConfig
  const lookupKey = `larry_${sanitizeLookupPart(course.id)}_${currency}_${unitAmount}`
  const metadata = courseMetadata(course, unitAmount, currency)

  if (options.dryRun) {
    return {
      courseId: course.id,
      title: course.title,
      action: 'dry-run',
      unitAmount,
      currency,
      lookupKey,
      existingStripePriceId: course.stripePriceId,
    }
  }

  const stripe = stripeClient()
  const existingProduct = await findCourseProduct(stripe, course)
  const product = existingProduct
    ? await stripe.products.update(existingProduct.id, {
        name: course.title,
        description: productDescription(course),
        active: true,
        metadata,
      })
    : await stripe.products.create({
        name: course.title,
        description: productDescription(course),
        active: true,
        metadata,
      })

  const existingPrice = await findPriceByLookupKey(stripe, lookupKey)
  const price = existingPrice || await stripe.prices.create({
    product: product.id,
    currency,
    unit_amount: unitAmount,
    lookup_key: lookupKey,
    nickname: `${course.title} · ${currency.toUpperCase()} ${centsToMajor(unitAmount)}`,
    metadata,
  })

  if (product.default_price !== price.id) {
    await stripe.products.update(product.id, { default_price: price.id })
  }

  const dbUpdate: {
    price: number
    stripePriceId: string
    isFree?: boolean
    accessLevel?: string
  } = {
    price: centsToMajor(unitAmount),
    stripePriceId: price.id,
  }

  if (options.activatePaid) {
    dbUpdate.isFree = false
    dbUpdate.accessLevel = 'paid'
  }

  await prisma.course.update({
    where: { id: course.id },
    data: dbUpdate,
  })

  return {
    courseId: course.id,
    title: course.title,
    action: existingProduct ? 'updated' : 'created',
    productId: product.id,
    priceId: price.id,
    unitAmount,
    currency,
    lookupKey,
    accessActivated: options.activatePaid,
  }
}

async function main() {
  const dryRun = hasArg('--dry-run')
  const activatePaid = hasArg('--activate-paid')

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      status: { not: 'archived' },
      courseTrack: { in: Object.keys(PRICE_BY_TRACK) },
    },
    select: {
      id: true,
      title: true,
      description: true,
      courseTrack: true,
      category: true,
      status: true,
      gradeLevel: true,
      stripePriceId: true,
    },
    orderBy: [{ courseTrack: 'asc' }, { gradeLevel: 'asc' }, { title: 'asc' }],
  })

  if (!courses.length) {
    console.log('No eligible Larry Academy paid courses found.')
    return
  }

  const results = []
  for (const course of courses) {
    const result = await syncCourse(course, { dryRun, activatePaid })
    if (result) results.push(result)
  }

  console.table(results.map((result) => ({
    courseId: result.courseId,
    title: result.title,
    action: result.action,
    price: `${result.currency.toUpperCase()} ${(result.unitAmount / 100).toFixed(2)}`,
    priceId: 'priceId' in result ? result.priceId : result.existingStripePriceId || '',
    access: 'accessActivated' in result && result.accessActivated ? 'paid' : 'unchanged',
  })))

  if (dryRun) {
    console.log('Dry run only. Re-run without --dry-run to create/update Stripe Products and Prices.')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
