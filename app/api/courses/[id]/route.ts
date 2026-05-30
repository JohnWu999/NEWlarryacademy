import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveCourseAccess } from '@/lib/course-access'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const session = await getServerSession(authOptions)

    const exists = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!exists) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 })
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: { viewCount: { increment: 1 } },
      include: {
        lessons: {
          include: { activities: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
        activities: { where: { lessonId: null }, orderBy: { order: 'asc' } },
      },
    })

    const access = await resolveCourseAccess(course, session?.user?.email)
    let progress = null
    let lessonProgressById = new Map<string, unknown>()
    let latestAttemptByActivityId = new Map<string, unknown>()
    let bestAttemptByActivityId = new Map<string, unknown>()

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        const activityIds = course.lessons.flatMap((lesson) => lesson.activities.filter((activity) => activity.type === 'practice').map((activity) => activity.id))
        const [courseProgress, lessonProgress, attempts] = await Promise.all([
          prisma.userCourseProgress.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } }),
          prisma.userLessonProgress.findMany({ where: { userId: user.id, lessonId: { in: course.lessons.map((lesson) => lesson.id) } } }),
          activityIds.length
            ? prisma.userActivityAttempt.findMany({
                where: { userId: user.id, activityId: { in: activityIds } },
                orderBy: { createdAt: 'desc' },
              })
            : Promise.resolve([]),
        ])
        progress = courseProgress
        lessonProgressById = new Map(lessonProgress.map((item) => [item.lessonId, item]))
        latestAttemptByActivityId = new Map()
        bestAttemptByActivityId = new Map()
        for (const attempt of attempts) {
          if (!latestAttemptByActivityId.has(attempt.activityId)) {
            latestAttemptByActivityId.set(attempt.activityId, attempt)
          }
          const currentBest = bestAttemptByActivityId.get(attempt.activityId) as { score?: number } | undefined
          if (!currentBest || Number(attempt.score || 0) > Number(currentBest.score || 0)) {
            bestAttemptByActivityId.set(attempt.activityId, attempt)
          }
        }
      }
    }

    const lessons = course.lessons.map((lesson) => {
      const practiceActivity = lesson.activities.find((activity) => activity.type === 'practice')
      const latestAttempt = practiceActivity ? latestAttemptByActivityId.get(practiceActivity.id) : null
      const bestAttempt = practiceActivity ? bestAttemptByActivityId.get(practiceActivity.id) : null
      return {
        ...lesson,
        userProgress: lessonProgressById.get(lesson.id) || null,
        latestPracticeAttempt: latestAttempt || null,
        bestPracticeAttempt: bestAttempt || null,
      }
    })

    return NextResponse.json({
      ...course,
      lessons,
      hasAccess: access.hasAccess,
      accessReason: access.reason,
      progress,
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: '获取课程失败' }, { status: 500 })
  }
}
