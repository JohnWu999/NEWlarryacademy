import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateGame, generateSampleQuestions } from '@/lib/ai/game-generator'
import { z } from 'zod'

const generateGameSchema = z.object({
  userInput: z.string().min(5, '请描述您想要的游戏类型'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  ageGroup: z.string().optional(),
  topic: z.string().optional(),
  saveToDatabase: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = generateGameSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // Generate game using AI
    const result = await generateGame({
      userInput: validatedData.userInput,
      difficulty: validatedData.difficulty,
      ageGroup: validatedData.ageGroup,
      topic: validatedData.topic,
    })

    if (!result.success || !result.gameConfig) {
      return NextResponse.json(
        { error: result.error || '生成游戏失败' },
        { status: 500 }
      )
    }

    const gameConfig = result.gameConfig

    // Generate sample questions
    const questions = generateSampleQuestions(gameConfig)

    // Save to database if requested
    let savedGame = null
    if (validatedData.saveToDatabase !== false) {
      savedGame = await prisma.game.create({
        data: {
          title: gameConfig.title,
          description: gameConfig.description || '',
          gameType: gameConfig.gameType || 'custom',
          isAiGenerated: true,
          createdByUserId: user.id,
          gameConfig: JSON.stringify({
            ...gameConfig,
            questions,
          }),
          published: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      game: savedGame
        ? {
            id: savedGame.id,
            title: savedGame.title,
            description: savedGame.description,
            gameType: savedGame.gameType,
          }
        : null,
      gameConfig: {
        ...gameConfig,
        questions,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Game generation error:', error)
    return NextResponse.json(
      { error: '生成游戏失败，请稍后重试' },
      { status: 500 }
    )
  }
}
