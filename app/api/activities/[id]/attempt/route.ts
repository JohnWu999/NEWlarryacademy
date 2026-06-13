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

const CORRECT_STREAK_GEM_INTERVAL = 5
const SPARKS_PER_CORRECT_QUESTION = 5

function getCorrectCountFromAttemptData(data?: string | null) {
  try {
    const parsed = data ? JSON.parse(data) : null
    if (typeof parsed?.correctCount === 'number') {
      return Math.max(0, Math.floor(parsed.correctCount))
    }
    if (Array.isArray(parsed?.results)) {
      return parsed.results.filter((result: { correct?: boolean }) => result.correct).length
    }
  } catch {}

  return 0
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
    const shouldRecordWrongQuestions = body.recordWrongQuestions !== false

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
    let currentCorrectStreak = 0
    let maxCorrectStreak = 0
    const results = questions.map((question) => {
      const correct = isPracticeAnswerCorrect(question, answersById.get(question.id))
      currentCorrectStreak = correct ? currentCorrectStreak + 1 : 0
      maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak)
      rawScore += correct ? Number(question.points || 0) : -Number(question.penalty || 0)
      return {
        questionId: question.id,
        correct,
        points: correct ? Number(question.points || 0) : -Number(question.penalty || 0),
        explanation: question.explanation || null,
        hint: question.hint || null,
      }
    })
    const wrongResults = results.filter((result) => !result.correct)
    const correctCount = results.length - wrongResults.length

    const score = Math.max(0, rawScore)
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const completed = submittedAnswers.length >= questions.length

    const previousAttempts = await prisma.userActivityAttempt.findMany({
      where: { userId: user.id, activityId: activity.id },
      select: { earnedGems: true, completed: true, data: true },
    })

    const previousBestCorrectCount = previousAttempts.reduce((best, attempt) => {
      return Math.max(best, getCorrectCountFromAttemptData(attempt.data))
    }, 0)
    const pointsDelta = Math.max(0, (correctCount - previousBestCorrectCount) * SPARKS_PER_CORRECT_QUESTION)
    const previouslyAwardedStreakGems = previousAttempts.reduce((total, attempt) => {
      return total + Math.max(0, Number(attempt.earnedGems || 0))
    }, 0)
    const streakGems = completed ? Math.floor(maxCorrectStreak / CORRECT_STREAK_GEM_INTERVAL) : 0
    const earnedGems = Math.max(0, streakGems - previouslyAwardedStreakGems)

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
          correctCount,
          maxCorrectStreak,
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
          reason: 'Practice correct answers',
          sourceType: 'activity',
          sourceId: activity.id,
          metadata: JSON.stringify({ attemptId: attempt.id, score, maxScore, correctCount, sparksPerCorrectQuestion: SPARKS_PER_CORRECT_QUESTION }),
        },
      })
    }

    if (earnedGems > 0) {
      await prisma.rewardTransaction.create({
        data: {
          userId: user.id,
          type: 'gems',
          amount: earnedGems,
          reason: '5-correct streak milestone',
          sourceType: 'activity',
          sourceId: activity.id,
          metadata: JSON.stringify({ attemptId: attempt.id, score, maxScore, maxCorrectStreak }),
        },
      })
    }

    if (shouldRecordWrongQuestions && wrongResults.length > 0) {
      const now = new Date()
      await prisma.$transaction(
        wrongResults.map((result) => {
          const question = questions.find((item) => item.id === result.questionId)
          const submitted = answersById.get(result.questionId)
          return prisma.wrongQuestion.upsert({
            where: {
              userId_activityId_questionId: {
                userId: user.id,
                activityId: activity.id,
                questionId: result.questionId,
              },
            },
            create: {
              userId: user.id,
              activityId: activity.id,
              courseId: activity.courseId,
              lessonId: activity.lessonId,
              questionId: result.questionId,
              questionType: question?.type || 'practice',
              prompt: question?.prompt || activity.title,
              choices: question?.choices ? JSON.stringify(question.choices) : null,
              submittedAnswer: serializePracticeValue(submitted?.value),
              correctAnswer: serializePracticeValue(question?.answer),
              hint: question?.hint || null,
              explanation: question?.explanation || null,
              lastSeenAt: now,
            },
            update: {
              courseId: activity.courseId,
              lessonId: activity.lessonId,
              questionType: question?.type || 'practice',
              prompt: question?.prompt || activity.title,
              choices: question?.choices ? JSON.stringify(question.choices) : null,
              submittedAnswer: serializePracticeValue(submitted?.value),
              correctAnswer: serializePracticeValue(question?.answer),
              hint: question?.hint || null,
              explanation: question?.explanation || null,
              status: 'open',
              mistakeCount: { increment: 1 },
              lastSeenAt: now,
            },
          })
        })
      )
    }

    if (completed && activity.lessonId) {
      const completedLesson = await prisma.lesson.findUnique({
        where: { id: activity.lessonId },
        select: { duration: true },
      })
      const completedPosition = Math.max(0, completedLesson?.duration || 0)

      await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: activity.lessonId } },
        update: {
          progressPercentage: 100,
          lastWatchedPosition: completedPosition,
          completedAt: new Date(),
        },
        create: {
          userId: user.id,
          lessonId: activity.lessonId,
          progressPercentage: 100,
          lastWatchedPosition: completedPosition,
          completedAt: new Date(),
        },
      })

      const [lessonCount, completedCount] = await Promise.all([
        prisma.lesson.count({ where: { courseId: activity.courseId } }),
        prisma.userLessonProgress.count({
          where: {
            userId: user.id,
            completedAt: { not: null },
            lesson: { courseId: activity.courseId },
          },
        }),
      ])
      const progressPercentage = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0
      await prisma.userCourseProgress.upsert({
        where: { userId_courseId: { userId: user.id, courseId: activity.courseId } },
        update: {
          progressPercentage,
          lastWatchedPosition: completedCount,
          completedAt: progressPercentage === 100 ? new Date() : null,
        },
        create: {
          userId: user.id,
          courseId: activity.courseId,
          progressPercentage,
          lastWatchedPosition: completedCount,
          completedAt: progressPercentage === 100 ? new Date() : null,
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
      correctCount,
      maxCorrectStreak,
      wrongCount: wrongResults.length,
      results,
    })
  } catch (error) {
    console.error('Error saving activity attempt:', error)
    return NextResponse.json({ error: '保存练习结果失败' }, { status: 500 })
  }
}
