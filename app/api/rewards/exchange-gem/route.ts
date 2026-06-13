import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SPARKS_PER_GEM = 50

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
          points: { gte: SPARKS_PER_GEM },
        },
        data: {
          points: { decrement: SPARKS_PER_GEM },
          gems: { increment: 1 },
        },
      })

      if (updated.count !== 1) {
        return null
      }

      await tx.rewardTransaction.createMany({
        data: [
          {
            userId: user.id,
            type: 'points',
            amount: -SPARKS_PER_GEM,
            reason: 'gem-exchange',
            sourceType: 'reward-exchange',
            metadata: JSON.stringify({ gems: 1 }),
          },
          {
            userId: user.id,
            type: 'gems',
            amount: 1,
            reason: 'spark-to-gem-exchange',
            sourceType: 'reward-exchange',
            metadata: JSON.stringify({ spentSparks: SPARKS_PER_GEM }),
          },
        ],
      })

      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { points: true, gems: true },
      })

      return {
        points: freshUser?.points ?? 0,
        gems: freshUser?.gems ?? 0,
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Spark 不足' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Gem exchange error:', error)
    return NextResponse.json({ error: '兑换 Gem 失败' }, { status: 500 })
  }
}
