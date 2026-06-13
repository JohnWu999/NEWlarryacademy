import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const GAME_TIME_SECONDS_PER_GEM = 60

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: user.id,
          gems: { gte: 1 },
        },
        data: {
          gems: { decrement: 1 },
        },
      })

      if (updated.count !== 1) {
        return null
      }

      await tx.rewardTransaction.create({
        data: {
          userId: user.id,
          type: 'gems',
          amount: -1,
          reason: 'game-time-exchange',
          sourceType: 'game-time',
          metadata: JSON.stringify({ addedSeconds: GAME_TIME_SECONDS_PER_GEM }),
        },
      })

      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { gems: true },
      })

      return {
        gems: freshUser?.gems ?? 0,
        addedSeconds: GAME_TIME_SECONDS_PER_GEM,
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Gem 不足' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Game time exchange error:', error)
    return NextResponse.json({ error: '兑换游戏时间失败' }, { status: 500 })
  }
}
