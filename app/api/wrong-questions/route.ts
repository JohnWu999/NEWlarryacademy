import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPracticeAnswerCorrect, serializePracticeValue } from '@/lib/practiceGrading'

type PracticeQuestion = {
  id: string
  type: string
  prompt?: string
  choices?: string[]
  answer?: string | string[]
  hint?: string
  explanation?: string
  tolerance?: number
}

function parseJsonList(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseSubmittedAnswer(value: string | null) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : value
  } catch {
    return value
  }
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

    const items = await prisma.wrongQuestion.findMany({
      where: { userId: user.id, status: 'open' },
      orderBy: [{ lastSeenAt: 'desc' }],
      include: {
        activity: {
          include: {
            course: { select: { id: true, title: true } },
            lesson: { select: { id: true, title: true, order: true } },
          },
        },
      },
      take: 200,
    })

    return NextResponse.json({
      total: items.length,
      items: items.map((item) => ({
        id: item.id,
        questionId: item.questionId,
        questionType: item.questionType,
        prompt: item.prompt,
        choices: parseJsonList(item.choices),
        submittedAnswer: parseSubmittedAnswer(item.submittedAnswer),
        hint: item.hint,
        mistakeCount: item.mistakeCount,
        lastSeenAt: item.lastSeenAt,
        course: item.activity.course,
        lesson: item.activity.lesson,
        activityTitle: item.activity.title,
      })),
    })
  } catch (error) {
    console.error('Error loading wrong questions:', error)
    return NextResponse.json({ error: '读取错题本失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

    const body = await request.json()
    const activityId = String(body.activityId || '')
    const questionId = String(body.questionId || '')
    const submittedValue = body.value as string | string[]
    if (!activityId || !questionId) {
      return NextResponse.json({ error: '缺少练习或题目 ID' }, { status: 400 })
    }

    const activity = await prisma.lessonActivity.findUnique({ where: { id: activityId } })
    if (!activity?.config) {
      return NextResponse.json({ error: '练习不存在' }, { status: 404 })
    }

    const config = JSON.parse(activity.config)
    const questions = (Array.isArray(config.questions) ? config.questions : []) as PracticeQuestion[]
    const question = questions.find((item) => item.id === questionId)
    if (!question) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 })
    }

    const correct = isPracticeAnswerCorrect(question, { questionId, value: submittedValue })
    if (correct) {
      return NextResponse.json({ recorded: false, correct: true })
    }

    const now = new Date()
    const entry = await prisma.wrongQuestion.upsert({
      where: {
        userId_activityId_questionId: {
          userId: user.id,
          activityId: activity.id,
          questionId,
        },
      },
      create: {
        userId: user.id,
        activityId: activity.id,
        courseId: activity.courseId,
        lessonId: activity.lessonId,
        questionId,
        questionType: question.type,
        prompt: question.prompt || activity.title,
        choices: question.choices ? JSON.stringify(question.choices) : null,
        submittedAnswer: serializePracticeValue(submittedValue),
        correctAnswer: serializePracticeValue(question.answer),
        hint: question.hint || null,
        explanation: question.explanation || null,
        lastSeenAt: now,
      },
      update: {
        courseId: activity.courseId,
        lessonId: activity.lessonId,
        questionType: question.type,
        prompt: question.prompt || activity.title,
        choices: question.choices ? JSON.stringify(question.choices) : null,
        submittedAnswer: serializePracticeValue(submittedValue),
        correctAnswer: serializePracticeValue(question.answer),
        hint: question.hint || null,
        explanation: question.explanation || null,
        status: 'open',
        mistakeCount: { increment: 1 },
        lastSeenAt: now,
      },
    })

    return NextResponse.json({ recorded: true, correct: false, wrongQuestionId: entry.id })
  } catch (error) {
    console.error('Error saving wrong question:', error)
    return NextResponse.json({ error: '保存错题失败' }, { status: 500 })
  }
}
