import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params
    const session = await getServerSession(authOptions)

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { 
        course: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          }
        } 
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: '课节不存在' }, { status: 404 })
    }

    let hasAccess = lesson.course.isFree
    let progress = null

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          purchasedCourses: { where: { courseId: lesson.courseId } },
          courseProgress: { where: { courseId: lesson.courseId } },
        },
      })
      if (user) {
        hasAccess = hasAccess || user.purchasedCourses.length > 0
        progress = user.courseProgress[0] || null
      }
    }

    return NextResponse.json({ ...lesson, hasAccess, progress })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: '获取课节失败' }, { status: 500 })
  }
}
