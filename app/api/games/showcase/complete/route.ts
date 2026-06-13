import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const showcaseTemplates = {
  starship: { title: '星际算力战舰', subject: 'Arithmetic' },
  geometry: { title: '几何建城', subject: 'Geometry' },
  coaster: { title: '函数过山车', subject: 'Functions' },
  circuit: { title: '电路黑客', subject: 'Physics' },
  fraction: { title: '分数切割场', subject: 'Fractions' },
  molecule: { title: '3D 分子实验室', subject: 'Science' },
  blaster: { title: '乘法弹幕战机', subject: 'Arithmetic' },
  snake: { title: '倍数贪吃蛇', subject: 'Number Sense' },
  tetra: { title: '等式俄罗斯方块', subject: 'Algebra' },
  creature: { title: '能量对战训练场', subject: 'Strategy Math' },
  maze: { title: '因数迷宫', subject: 'Factors' },
  pinball: { title: '质数弹球台', subject: 'Prime Numbers' },
} as const

const GAME_COMPLETION_SPARKS = 5

const completeSchema = z.object({
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
  score: z.number().int().min(0).max(100000),
  duration: z.number().int().min(0).max(3600).optional(),
  level: z.number().int().min(1).max(99).optional(),
  streak: z.number().int().min(0).max(999).optional(),
  round: z.number().int().min(0).max(9999).optional(),
})

function calculateRewards(level: number, streak: number) {
  const points = GAME_COMPLETION_SPARKS
  const gems = streak >= 8 || level >= 4 ? 1 : 0
  return { points, gems }
}

export async function POST(request: NextRequest) {
  try {
    const body = completeSchema.parse(await request.json())
    const session = await getServerSession(authOptions)
    const template = showcaseTemplates[body.templateId]
    const gameId = `showcase-${body.templateId}`
    const level = body.level ?? 1
    const streak = body.streak ?? 0
    const rewards = calculateRewards(level, streak)

    if (!session?.user?.email) {
      await prisma.game.upsert({
        where: { id: gameId },
        update: { playCount: { increment: 1 } },
        create: {
          id: gameId,
          title: template.title,
          description: `${template.subject} reusable learning game showcase`,
          gameType: 'learning-showcase',
          gameConfig: JSON.stringify({ templateId: body.templateId, subject: template.subject }),
          playCount: 1,
          published: true,
          featured: false,
        },
      })

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
      await tx.game.upsert({
        where: { id: gameId },
        update: { playCount: { increment: 1 } },
        create: {
          id: gameId,
          title: template.title,
          description: `${template.subject} reusable learning game showcase`,
          gameType: 'learning-showcase',
          gameConfig: JSON.stringify({ templateId: body.templateId, subject: template.subject }),
          playCount: 1,
          published: true,
          featured: false,
        },
      })

      const history = await tx.userGameHistory.create({
        data: {
          userId: user.id,
          gameId,
          score: body.score,
          duration: body.duration,
          completed: true,
          data: JSON.stringify({
            templateId: body.templateId,
            level,
            streak,
            round: body.round,
            earnedPoints: rewards.points,
            earnedGems: rewards.gems,
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
          reason: 'learning-showcase-complete',
          sourceType: 'game',
          sourceId: gameId,
          metadata: JSON.stringify({ historyId: history.id, score: body.score, level, streak }),
        },
      })

      if (rewards.gems > 0) {
        await tx.rewardTransaction.create({
          data: {
            userId: user.id,
            type: 'gems',
            amount: rewards.gems,
            reason: 'learning-showcase-streak',
            sourceType: 'game',
            sourceId: gameId,
            metadata: JSON.stringify({ historyId: history.id, score: body.score, level, streak }),
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

    console.error('Showcase game complete error:', error)
    return NextResponse.json({ error: '保存样板游戏记录失败' }, { status: 500 })
  }
}
