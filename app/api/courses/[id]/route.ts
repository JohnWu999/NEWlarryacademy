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

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          purchasedCourses: { where: { courseId } },
          courseProgress: { where: { courseId } },
        },
      })
      if (user) progress = user.courseProgress[0] || null
    }

    return NextResponse.json({
      ...course,
      hasAccess: access.hasAccess,
      accessReason: access.reason,
      progress,
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: '获取课程失败' }, { status: 500 })
  }
}
