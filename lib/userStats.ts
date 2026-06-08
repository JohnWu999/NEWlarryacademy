import { prisma } from '@/lib/prisma'

export type UserStats = {
  coursesEnrolled: number
  coursesCompleted: number
  gamesPlayed: number
  totalLearningTime: number
  totalLearningSeconds: number
  lessonsStarted: number
  lessonsCompleted: number
  activityAttempts: number
  points: number
  sparks: number
  gems: number
  rewardLedger: {
    points: number
    gems: number
    pointsConsistent: boolean
    gemsConsistent: boolean
  }
}

function clampLearningSeconds(position: number, duration?: number | null) {
  const safePosition = Math.max(0, Math.round(Number(position || 0)))
  if (!duration || duration <= 0) return safePosition
  return Math.min(safePosition, duration)
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const [
    user,
    courseProgress,
    purchasedCourses,
    lessonProgress,
    gamesPlayed,
    activityAttempts,
    rewardGroups,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, gems: true },
    }),
    prisma.userCourseProgress.findMany({
      where: { userId },
      select: { courseId: true, progressPercentage: true, completedAt: true },
    }),
    prisma.userPurchasedCourse.findMany({
      where: {
        userId,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { courseId: true },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        progressPercentage: true,
        lastWatchedPosition: true,
        completedAt: true,
        lesson: { select: { duration: true } },
      },
    }),
    prisma.userGameHistory.count({ where: { userId } }),
    prisma.userActivityAttempt.count({ where: { userId } }),
    prisma.rewardTransaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
    }),
  ])

  if (!user) {
    throw new Error('User not found')
  }

  const enrolledCourseIds = new Set<string>()
  purchasedCourses.forEach((course) => enrolledCourseIds.add(course.courseId))
  courseProgress.forEach((progress) => enrolledCourseIds.add(progress.courseId))

  const coursesCompleted = courseProgress.filter(
    (progress) => progress.completedAt || progress.progressPercentage >= 100
  ).length

  const totalLearningSeconds = lessonProgress.reduce((total, progress) => {
    return total + clampLearningSeconds(progress.lastWatchedPosition, progress.lesson.duration)
  }, 0)

  const lessonsCompleted = lessonProgress.filter(
    (progress) => progress.completedAt || progress.progressPercentage >= 100
  ).length

  const ledger = rewardGroups.reduce(
    (totals, group) => {
      const amount = group._sum.amount || 0
      if (group.type === 'points') totals.points += amount
      if (group.type === 'gems') totals.gems += amount
      return totals
    },
    { points: 0, gems: 0 }
  )

  return {
    coursesEnrolled: enrolledCourseIds.size,
    coursesCompleted,
    gamesPlayed,
    totalLearningTime: Math.round((totalLearningSeconds / 3600) * 10) / 10,
    totalLearningSeconds,
    lessonsStarted: lessonProgress.length,
    lessonsCompleted,
    activityAttempts,
    points: user.points,
    sparks: user.points,
    gems: user.gems,
    rewardLedger: {
      points: ledger.points,
      gems: ledger.gems,
      pointsConsistent: ledger.points === user.points,
      gemsConsistent: ledger.gems === user.gems,
    },
  }
}
