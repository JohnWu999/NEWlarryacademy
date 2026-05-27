import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const session = await getServerSession(authOptions)

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: { orderBy: { order: 'asc' } } },
    })

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 })
    }

    let hasAccess = course.isFree
    let progress = null

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          purchasedCourses: { where: { courseId } },
          courseProgress: { where: { courseId } },
        },
      })
      if (user) {
        hasAccess = hasAccess || user.purchasedCourses.length > 0
        progress = user.courseProgress[0] || null
      }
    }

    return NextResponse.json({ ...course, hasAccess, progress })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: '获取课程失败' }, { status: 500 })
  }
}
