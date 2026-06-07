import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDisplayName, getHeroLevel, getIdentityLevel, getInitials } from '@/lib/reward-system'

type AttemptLike = {
  score: number | null
  maxScore: number | null
  completed: boolean
  earnedPoints: number
  earnedGems: number
  data: string | null
}

type GameLike = {
  score: number | null
  completed: boolean
  data: string | null
}

function parseAttemptStats(attempts: AttemptLike[]) {
  return attempts.reduce(
    (stats, attempt) => {
      if (!attempt.completed) return stats
      let counted = false
      try {
        const data = attempt.data ? JSON.parse(attempt.data) : null
        if (Array.isArray(data?.results)) {
          const results = data.results as Array<{ correct?: boolean }>
          stats.questionsAnswered += results.length
          stats.correctAnswers += results.filter((result) => Boolean(result.correct)).length
          counted = true
        }
      } catch {}

      if (!counted && attempt.maxScore && attempt.maxScore > 0) {
        stats.questionsAnswered += 1
        stats.correctAnswers += Math.max(0, Math.min(1, Number(attempt.score || 0) / Number(attempt.maxScore)))
      }

      stats.practiceSparkBase += Math.max(0, Number(attempt.earnedPoints || 0))
      stats.practiceGemBase += Math.max(0, Number(attempt.earnedGems || 0))
      return stats
    },
    { questionsAnswered: 0, correctAnswers: 0, practiceSparkBase: 0, practiceGemBase: 0 }
  )
}

function parseGameSpark(games: GameLike[]) {
  return games.reduce((sum, game) => {
    if (!game.completed) return sum
    try {
      const data = game.data ? JSON.parse(game.data) : null
      return sum + Math.max(0, Number(data?.earnedPoints || 0))
    } catch {
      return sum + Math.max(0, Math.round(Number(game.score || 0) / 4))
    }
  }, 0)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')?.trim() || null
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 8), 3), 20)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        avatar: true,
        email: true,
        points: true,
        gems: true,
        courseProgress: {
          where: courseId ? { courseId } : undefined,
          select: { completedAt: true, progressPercentage: true },
        },
        lessonProgress: {
          where: courseId ? { lesson: { courseId } } : undefined,
          select: { completedAt: true },
        },
        activityAttempts: {
          where: courseId ? { activity: { courseId } } : undefined,
          select: {
            score: true,
            maxScore: true,
            completed: true,
            earnedPoints: true,
            earnedGems: true,
            data: true,
          },
        },
        gameHistory: {
          select: {
            score: true,
            completed: true,
            data: true,
          },
        },
      },
    })

    const ranked = users
      .map((user) => {
        const attempts = user.activityAttempts as AttemptLike[]
        const attemptStats = parseAttemptStats(attempts)
        const completedCourses = user.courseProgress.filter((progress) => Boolean(progress.completedAt)).length
        const completedLessons = user.lessonProgress.filter((progress) => Boolean(progress.completedAt)).length
        const games = courseId ? [] : ((user.gameHistory || []) as GameLike[])
        const gameSpark = parseGameSpark(games)
        const accuracy = attemptStats.questionsAnswered > 0
          ? Math.round((attemptStats.correctAnswers / attemptStats.questionsAnswered) * 100)
          : 0
        const accuracyBonus = attemptStats.questionsAnswered >= 10
          ? accuracy >= 95
            ? 260
            : accuracy >= 90
              ? 180
              : accuracy >= 80
                ? 90
                : accuracy >= 70
                  ? 40
                  : 0
          : 0

        const storedSparkBase = courseId ? attemptStats.practiceSparkBase : Number(user.points || 0)
        const storedGemBase = courseId ? attemptStats.practiceGemBase : Number(user.gems || 0)

        const sparks = Math.round(
          storedSparkBase +
          attemptStats.questionsAnswered * 4 +
          attemptStats.correctAnswers * 3 +
          completedLessons * 35 +
          completedCourses * 350 +
          gameSpark +
          accuracyBonus
        )
        const gems = Math.round(
          storedGemBase +
          completedCourses * 4 +
          Math.floor(attemptStats.correctAnswers / 40) +
          (attemptStats.questionsAnswered >= 20 && accuracy >= 90 ? 2 : 0)
        )

        const displayName = getDisplayName(user.name, user.id)
        const identityLevel = getIdentityLevel(gems)
        const heroLevel = getHeroLevel(sparks)

        return {
          id: user.id,
          displayName,
          initials: getInitials(displayName),
          image: user.image || user.avatar || null,
          sparks,
          gems,
          accuracy,
          completedCourses,
          completedLessons,
          questionsAnswered: attemptStats.questionsAnswered,
          heroLevel,
          identityLevel,
          isCurrentUser: Boolean(session?.user?.email && user.email === session.user.email),
        }
      })
      .filter((entry) => entry.sparks > 0 || entry.gems > 0 || entry.questionsAnswered > 0 || entry.completedLessons > 0)
      .sort((a, b) => {
        if (b.sparks !== a.sparks) return b.sparks - a.sparks
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
        return b.gems - a.gems
      })
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return NextResponse.json({
      scope: courseId ? 'course' : 'global',
      courseId,
      entries: ranked,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
