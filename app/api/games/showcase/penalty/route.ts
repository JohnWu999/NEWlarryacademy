import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const penaltySchema = z.object({
  templateId: z.enum([
    'starship',
    'geometry',
    'coaster',
    'circuit',
    'fraction',
    'molecule',
    'blaster',
    'snake',
    'tetra',
    'creature',
    'maze',
    'pinball',
  ]),
  penalty: z.number().int().min(1).max(200),
  reason: z.string().max(120).optional(),
  score: z.number().int().min(0).max(100000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = penaltySchema.parse(await request.json())
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ saved: false, deductedPoints: 0, message: 'Login to save penalties.' })
    }

    const gameId = `showcase-${body.templateId}`

    const deductedPoints = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, points: true },
      })

      if (!user) return 0

      const actualPenalty = Math.min(user.points, body.penalty)
      if (actualPenalty <= 0) return 0

      await tx.user.update({
        where: { id: user.id },
        data: { points: { decrement: actualPenalty } },
      })

      await tx.rewardTransaction.create({
        data: {
          userId: user.id,
          type: 'points',
          amount: -actualPenalty,
          reason: 'learning-showcase-miss',
          sourceType: 'game',
          sourceId: gameId,
          metadata: JSON.stringify({
            templateId: body.templateId,
            reason: body.reason,
            score: body.score,
          }),
        },
      })

      return actualPenalty
    })

    return NextResponse.json({ saved: true, deductedPoints })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Showcase game penalty error:', error)
    return NextResponse.json({ error: '保存样板游戏扣分失败' }, { status: 500 })
  }
}
