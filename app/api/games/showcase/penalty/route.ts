import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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
  penalty: z.number().int().min(1).max(100000),
  reason: z.string().max(120).optional(),
  score: z.number().int().min(0).max(100000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    penaltySchema.parse(await request.json())

    return NextResponse.json({
      saved: false,
      deductedPoints: 0,
      message: 'Game mistakes do not deduct sparks.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Showcase game penalty error:', error)
    return NextResponse.json({ error: '保存样板游戏扣分失败' }, { status: 500 })
  }
}
