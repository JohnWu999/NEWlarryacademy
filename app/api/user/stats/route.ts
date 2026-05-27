import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        courseProgress: true,
        gameHistory: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const coursesEnrolled = user.courseProgress.length
    const coursesCompleted = user.courseProgress.filter(
      (p) => p.completedAt !== null
    ).length
    const gamesPlayed = user.gameHistory.length
    const totalLearningTime = user.courseProgress.reduce(
      (total, progress) => total + progress.lastWatchedPosition,
      0
    )

    return NextResponse.json({
      coursesEnrolled,
      coursesCompleted,
      gamesPlayed,
      totalLearningTime: Math.round(totalLearningTime / 60), // Convert to minutes
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
