import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shanghaiDay } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const progressSchema = z.object({
  lastWatchedPosition: z.number().min(0).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  lessonId: z.string().optional(),
  lessonProgressPercentage: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
})

async function recalculateCourseProgress(userId: string, courseId: string, lastWatchedPosition = 0) {
  const [lessonCount, completedCount] = await Promise.all([
    prisma.lesson.count({ where: { courseId } }),
    prisma.userLessonProgress.count({
      where: {
        userId,
        completedAt: { not: null },
        lesson: { courseId },
      },
    }),
  ])
  const progressPercentage = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0

  return prisma.userCourseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      lastWatchedPosition,
      progressPercentage,
      completedAt: progressPercentage === 100 ? new Date() : null,
    },
    create: {
      userId,
      courseId,
      lastWatchedPosition,
      progressPercentage,
      completedAt: progressPercentage === 100 ? new Date() : null,
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = progressSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: '课程不存在' }, { status: 404 })

    let requestedLesson: { id: string; title: string; order: number; duration: number | null; isPreview: boolean } | null = null
    if (validatedData.lessonId) {
      requestedLesson = await prisma.lesson.findFirst({
        where: { id: validatedData.lessonId, courseId },
        select: { id: true, title: true, order: true, duration: true, isPreview: true },
      })
      if (!requestedLesson) return NextResponse.json({ error: '课节不存在' }, { status: 404 })
    }

    if (!course.isFree && !requestedLesson?.isPreview) {
      const purchased = await prisma.userPurchasedCourse.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } },
      })
      if (!purchased) return NextResponse.json({ error: '您还未购买此课程' }, { status: 403 })
    }

    let lastWatchedPosition = validatedData.lastWatchedPosition || 0

    if (validatedData.lessonId) {
      const lesson = requestedLesson
      if (!lesson) return NextResponse.json({ error: '课节不存在' }, { status: 404 })

      lastWatchedPosition = lesson.order
      const existingLessonProgress = await prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      })
      const nextLessonProgress = Math.max(
        Number(existingLessonProgress?.progressPercentage || 0),
        Number(validatedData.lessonProgressPercentage || 0)
      )
      const shouldComplete = Boolean(validatedData.completed)
      const storedLessonProgress = shouldComplete ? 100 : nextLessonProgress
      const completedAt = existingLessonProgress?.completedAt || (shouldComplete ? new Date() : null)

      await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        update: {
          progressPercentage: storedLessonProgress,
          lastWatchedPosition: Math.round((storedLessonProgress / 100) * Number(lesson.duration || 0)),
          ...(completedAt ? { completedAt } : {}),
        },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          progressPercentage: storedLessonProgress,
          lastWatchedPosition: Math.round((storedLessonProgress / 100) * Number(lesson.duration || 0)),
          completedAt,
        },
      })
    } else if (typeof validatedData.progressPercentage === 'number') {
      lastWatchedPosition = validatedData.lastWatchedPosition || 0
    }

    const progress = await recalculateCourseProgress(user.id, courseId, lastWatchedPosition)

    if (requestedLesson) {
      await prisma.customerLearningEvent.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          day: shanghaiDay(),
          eventType: validatedData.completed ? 'lesson_completed' : 'lesson_progress',
          courseId: course.id,
          courseTitle: course.title,
          lessonId: requestedLesson.id,
          lessonTitle: requestedLesson.title,
          metadata: JSON.stringify({
            progressPercentage: validatedData.completed ? 100 : Number(validatedData.lessonProgressPercentage || 0),
            lastWatchedPosition,
          }),
        },
      })
    }

    return NextResponse.json(progress)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: '更新进度失败' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const progress = await prisma.userCourseProgress.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })

    return NextResponse.json(progress || { progressPercentage: 0, lastWatchedPosition: 0 })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: '获取进度失败' }, { status: 500 })
  }
}
