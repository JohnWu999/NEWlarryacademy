import { prisma } from './prisma'

export const COURSE_ACCESS = {
  PUBLIC: 'public',
  REGISTERED: 'registered',
  PAID: 'paid',
} as const

type CourseLike = {
  id: string
  isFree: boolean
  price: number
  accessLevel?: string | null
  status?: string | null
}

export function isPublicCourse(course: CourseLike) {
  return course.status !== 'coming-soon' && (course.isFree || course.price <= 0 || course.accessLevel === COURSE_ACCESS.PUBLIC)
}

export function requiresLogin(course: CourseLike) {
  return course.accessLevel === COURSE_ACCESS.REGISTERED
}

export function requiresPurchase(course: CourseLike) {
  return !isPublicCourse(course) && !requiresLogin(course)
}

export async function resolveCourseAccess(course: CourseLike, email?: string | null) {
  if (course.status === 'coming-soon') {
    return { hasAccess: false, reason: 'coming-soon' as const }
  }

  if (isPublicCourse(course)) {
    return { hasAccess: true, reason: 'public' as const }
  }

  if (!email) {
    return { hasAccess: false, reason: 'login-required' as const }
  }

  if (requiresLogin(course)) {
    return { hasAccess: true, reason: 'registered' as const }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      subscriptionStatus: true,
      purchasedCourses: {
        where: {
          courseId: course.id,
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      },
    },
  })

  if (!user) {
    return { hasAccess: false, reason: 'login-required' as const }
  }

  if (user.subscriptionStatus === 'premium' || user.purchasedCourses.length > 0) {
    return { hasAccess: true, reason: 'purchased' as const }
  }

  return { hasAccess: false, reason: 'purchase-required' as const }
}
