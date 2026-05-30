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
    const { id: lessonId } = await params
    const session = await getServerSession(authOptions)

    const exists = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } })
    if (!exists) {
      return NextResponse.json({ error: '课节不存在' }, { status: 404 })
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { viewCount: { increment: 1 } },
      include: {
        activities: { orderBy: { order: 'asc' } },
        course: {
          include: {
            lessons: {
              include: { activities: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    const access = lesson.isPreview
      ? { hasAccess: true, reason: 'public' as const }
      : await resolveCourseAccess(lesson.course, session?.user?.email)
    let progress = null
    let lessonProgressById = new Map<string, unknown>()
    let latestAttemptByActivityId = new Map<string, unknown>()
    let bestAttemptByActivityId = new Map<string, unknown>()

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } })
      if (user) {
        const activityIds = lesson.course.lessons.flatMap((courseLesson) => courseLesson.activities.filter((activity) => activity.type === 'practice').map((activity) => activity.id))
        const [courseProgress, lessonProgress, attempts] = await Promise.all([
          prisma.userCourseProgress.findUnique({ where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } } }),
          prisma.userLessonProgress.findMany({ where: { userId: user.id, lessonId: { in: lesson.course.lessons.map((courseLesson) => courseLesson.id) } } }),
          activityIds.length
            ? prisma.userActivityAttempt.findMany({
                where: { userId: user.id, activityId: { in: activityIds } },
                orderBy: { createdAt: 'desc' },
              })
            : Promise.resolve([]),
        ])
        progress = courseProgress
        lessonProgressById = new Map(lessonProgress.map((item) => [item.lessonId, item]))
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

    const lessons = lesson.course.lessons.map((courseLesson) => {
      const practiceActivity = courseLesson.activities.find((activity) => activity.type === 'practice')
      return {
        ...courseLesson,
        userProgress: lessonProgressById.get(courseLesson.id) || null,
        latestPracticeAttempt: practiceActivity ? latestAttemptByActivityId.get(practiceActivity.id) || null : null,
        bestPracticeAttempt: practiceActivity ? bestAttemptByActivityId.get(practiceActivity.id) || null : null,
      }
    })

    return NextResponse.json({
      ...lesson,
      course: {
        ...lesson.course,
        lessons,
      },
      userProgress: lessonProgressById.get(lesson.id) || null,
      hasAccess: access.hasAccess,
      accessReason: access.reason,
      progress,
    })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: '获取课节失败' }, { status: 500 })
  }
}
