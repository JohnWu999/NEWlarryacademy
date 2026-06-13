import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const completeSchema = z.object({
  score: z.number().int().min(0).max(100000),
  maxScore: z.number().int().min(1).max(100000),
  duration: z.number().int().min(0).max(3600).optional(),
  level: z.number().int().min(1).max(99).optional(),
  streak: z.number().int().min(0).max(999).optional(),
  completed: z.boolean().optional(),
  mode: z.string().max(80).optional(),
})

const GAME_COMPLETION_SPARKS = 5

function calculateRewards(score: number, maxScore: number, streak: number) {
  const ratio = Math.max(0, Math.min(score / maxScore, 1))
  const points = GAME_COMPLETION_SPARKS
  const gems = ratio >= 0.95 || streak >= 10 ? 1 : 0
  return { points, gems, ratio }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = completeSchema.parse(await request.json())
    const session = await getServerSession(authOptions)
    const rewards = calculateRewards(body.score, body.maxScore, body.streak ?? 0)

    await prisma.game.update({
      where: { id },
      data: { playCount: { increment: 1 } },
    })

    if (!session?.user?.email) {
      return NextResponse.json({
        saved: false,
        earnedPoints: rewards.points,
        earnedGems: rewards.gems,
        message: 'Login to save rewards.',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.userGameHistory.create({
        data: {
          userId: user.id,
          gameId: id,
          score: body.score,
          duration: body.duration,
          completed: body.completed ?? true,
          data: JSON.stringify({
            maxScore: body.maxScore,
            level: body.level,
            streak: body.streak,
            mode: body.mode,
            earnedPoints: rewards.points,
            earnedGems: rewards.gems,
            ratio: rewards.ratio,
          }),
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          points: { increment: rewards.points },
          gems: { increment: rewards.gems },
        },
      })

      await tx.rewardTransaction.create({
        data: {
          userId: user.id,
          type: 'points',
          amount: rewards.points,
          reason: 'math-game-complete',
          sourceType: 'game',
          sourceId: id,
          metadata: JSON.stringify({ score: body.score, maxScore: body.maxScore, mode: body.mode }),
        },
      })

      if (rewards.gems > 0) {
        await tx.rewardTransaction.create({
          data: {
            userId: user.id,
            type: 'gems',
            amount: rewards.gems,
            reason: 'math-game-streak',
            sourceType: 'game',
            sourceId: id,
            metadata: JSON.stringify({ score: body.score, maxScore: body.maxScore, streak: body.streak }),
          },
        })
      }
    })

    return NextResponse.json({
      saved: true,
      earnedPoints: rewards.points,
      earnedGems: rewards.gems,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Game complete error:', error)
    return NextResponse.json({ error: '保存游戏奖励失败' }, { status: 500 })
  }
}
