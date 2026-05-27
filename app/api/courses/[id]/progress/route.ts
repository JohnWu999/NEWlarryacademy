import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const progressSchema = z.object({
  lastWatchedPosition: z.number().min(0),
  progressPercentage: z.number().min(0).max(100),
})

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

    if (!course.isFree) {
      const purchased = await prisma.userPurchasedCourse.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } },
      })
      if (!purchased) return NextResponse.json({ error: '您还未购买此课程' }, { status: 403 })
    }

    const progress = await prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: {
        lastWatchedPosition: validatedData.lastWatchedPosition,
        progressPercentage: validatedData.progressPercentage,
        completedAt: validatedData.progressPercentage === 100 ? new Date() : null,
      },
      create: {
        userId: user.id,
        courseId,
        lastWatchedPosition: validatedData.lastWatchedPosition,
        progressPercentage: validatedData.progressPercentage,
        completedAt: validatedData.progressPercentage === 100 ? new Date() : null,
      },
    })

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
