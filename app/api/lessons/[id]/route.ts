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

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          purchasedCourses: { where: { courseId: lesson.courseId } },
          courseProgress: { where: { courseId: lesson.courseId } },
        },
      })
      if (user) progress = user.courseProgress[0] || null
    }

    return NextResponse.json({
      ...lesson,
      hasAccess: access.hasAccess,
      accessReason: access.reason,
      progress,
    })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: '获取课节失败' }, { status: 500 })
  }
}
