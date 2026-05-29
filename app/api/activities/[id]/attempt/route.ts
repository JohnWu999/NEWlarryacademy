import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PracticeQuestion = {
  id: string
  type: string
  answer: string | string[]
  points: number
  penalty: number
  tolerance?: number
  explanation?: string
  hint?: string
}

type SubmittedAnswer = {
  questionId: string
  value: string | string[]
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ')
}

function normalizeNumber(value: string) {
  const number = Number(normalize(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(number) ? number : null
}

function isCorrect(question: PracticeQuestion, submitted?: SubmittedAnswer) {
  if (!submitted) return false
  if (question.type === 'numeric-input') {
    const expected = normalizeNumber(String(question.answer))
    const actual = normalizeNumber(Array.isArray(submitted.value) ? submitted.value.join('') : String(submitted.value))
    if (expected === null || actual === null) return false
    return Math.abs(expected - actual) <= Number(question.tolerance || 0.0001)
  }
  if (Array.isArray(question.answer)) {
    const expected = question.answer.map(normalize)
    const actual = Array.isArray(submitted.value) ? submitted.value.map(normalize) : [normalize(String(submitted.value))]
    if (question.type === 'multiple-select') {
      const sortedExpected = expected.sort()
      const sortedActual = actual.sort()
      return sortedExpected.length === sortedActual.length && sortedExpected.every((value, index) => value === sortedActual[index])
    }
    return expected.length === actual.length && expected.every((value, index) => value === actual[index])
  }

  return normalize(String(submitted.value)) === normalize(String(question.answer))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const submittedAnswers = Array.isArray(body.answers) ? (body.answers as SubmittedAnswer[]) : []

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const activity = await prisma.lessonActivity.findUnique({ where: { id } })
    if (!activity?.config) {
      return NextResponse.json({ error: '练习不存在' }, { status: 404 })
    }

    const config = JSON.parse(activity.config)
    const questions = (Array.isArray(config.questions) ? config.questions : []) as PracticeQuestion[]
    const answersById = new Map(submittedAnswers.map((answer) => [answer.questionId, answer]))
    const maxScore = questions.reduce((sum, question) => sum + Number(question.points || 0), 0)

    let rawScore = 0
    const results = questions.map((question) => {
      const correct = isCorrect(question, answersById.get(question.id))
      rawScore += correct ? Number(question.points || 0) : -Number(question.penalty || 0)
      return {
        questionId: question.id,
        correct,
        points: correct ? Number(question.points || 0) : -Number(question.penalty || 0),
        explanation: question.explanation || null,
        hint: question.hint || null,
      }
    })

    const score = Math.max(0, rawScore)
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const completed = submittedAnswers.length >= questions.length

    const previousAttempts = await prisma.userActivityAttempt.findMany({
      where: { userId: user.id, activityId: activity.id },
      select: { score: true, earnedGems: true, completed: true },
    })

    const previousBest = previousAttempts.reduce((best, attempt) => Math.max(best, attempt.score || 0), 0)
    const hadPass = previousAttempts.some((attempt) => attempt.completed && (attempt.score || 0) >= Math.round(maxScore * 0.7))
    const hadPerfect = previousAttempts.some((attempt) => (attempt.score || 0) >= maxScore)
    const pointsDelta = Math.max(0, score - previousBest)
    const rewards = config.rewards || {}
    const passGems = completed && percent >= Number(config.passingScore || 70) && !hadPass ? Number(rewards.gemsOnPass || activity.rewardsGems || 1) : 0
    const perfectGems = completed && score >= maxScore && !hadPerfect ? Number(rewards.gemsOnPerfect || 2) : 0
    const earnedGems = passGems + perfectGems

    const attempt = await prisma.userActivityAttempt.create({
      data: {
        userId: user.id,
        activityId: activity.id,
        score,
        maxScore,
        completed,
        earnedPoints: pointsDelta,
        earnedGems,
        data: JSON.stringify({
          answers: submittedAnswers,
          results,
          rawScore,
          percent,
        }),
      },
    })

    if (pointsDelta > 0 || earnedGems > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          points: { increment: pointsDelta },
          gems: { increment: earnedGems },
        },
      })
    }

    if (pointsDelta > 0) {
      await prisma.rewardTransaction.create({
        data: {
          userId: user.id,
          type: 'points',
          amount: pointsDelta,
          reason: 'Practice score improvement',
          sourceType: 'activity',
          sourceId: activity.id,
          metadata: JSON.stringify({ attemptId: attempt.id, score, maxScore }),
        },
      })
    }

    if (earnedGems > 0) {
      await prisma.rewardTransaction.create({
        data: {
          userId: user.id,
          type: 'gems',
          amount: earnedGems,
          reason: 'Practice quest milestone',
          sourceType: 'activity',
          sourceId: activity.id,
          metadata: JSON.stringify({ attemptId: attempt.id, score, maxScore }),
        },
      })
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      maxScore,
      percent,
      completed,
      earnedPoints: pointsDelta,
      earnedGems,
      results,
    })
  } catch (error) {
    console.error('Error saving activity attempt:', error)
    return NextResponse.json({ error: '保存练习结果失败' }, { status: 500 })
  }
}
