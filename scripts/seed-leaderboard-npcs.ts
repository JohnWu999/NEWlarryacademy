import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type NpcProfile = {
  email: string
  name: string
  country: string
  timezone: string
  sparkTarget: number
  gemTarget: number
  accuracy: number
  courseSpread: number
}

const npcProfiles: NpcProfile[] = [
  { email: 'npc.alan.chen@larryacademy.local', name: 'Alan Chen', country: 'China', timezone: 'Asia/Shanghai', sparkTarget: 1840, gemTarget: 31, accuracy: 94, courseSpread: 4 },
  { email: 'npc.alex.wang@larryacademy.local', name: 'Alex Wang', country: 'Singapore', timezone: 'Asia/Singapore', sparkTarget: 1510, gemTarget: 24, accuracy: 91, courseSpread: 4 },
  { email: 'npc.sophia.li@larryacademy.local', name: 'Sophia Li', country: 'United States', timezone: 'America/Los_Angeles', sparkTarget: 1320, gemTarget: 22, accuracy: 88, courseSpread: 3 },
  { email: 'npc.ethan.zhang@larryacademy.local', name: 'Ethan Zhang', country: 'Hong Kong', timezone: 'Asia/Hong_Kong', sparkTarget: 1255, gemTarget: 18, accuracy: 86, courseSpread: 3 },
  { email: 'npc.olivia.liu@larryacademy.local', name: 'Olivia Liu', country: 'Canada', timezone: 'America/Vancouver', sparkTarget: 1160, gemTarget: 16, accuracy: 90, courseSpread: 3 },
  { email: 'npc.ryan.wu@larryacademy.local', name: 'Ryan Wu', country: 'Taiwan', timezone: 'Asia/Taipei', sparkTarget: 1040, gemTarget: 15, accuracy: 84, courseSpread: 3 },
  { email: 'npc.emily.huang@larryacademy.local', name: 'Emily Huang', country: 'Australia', timezone: 'Australia/Sydney', sparkTarget: 940, gemTarget: 13, accuracy: 82, courseSpread: 3 },
  { email: 'npc.kevin.lin@larryacademy.local', name: 'Kevin Lin', country: 'United Kingdom', timezone: 'Europe/London', sparkTarget: 880, gemTarget: 12, accuracy: 79, courseSpread: 2 },
  { email: 'npc.grace.zhou@larryacademy.local', name: 'Grace Zhou', country: 'China', timezone: 'Asia/Shanghai', sparkTarget: 820, gemTarget: 11, accuracy: 87, courseSpread: 2 },
  { email: 'npc.daniel.zhao@larryacademy.local', name: 'Daniel Zhao', country: 'Singapore', timezone: 'Asia/Singapore', sparkTarget: 760, gemTarget: 10, accuracy: 78, courseSpread: 2 },
  { email: 'npc.chloe.carter@larryacademy.local', name: 'Chloe Carter', country: 'Canada', timezone: 'America/Toronto', sparkTarget: 710, gemTarget: 9, accuracy: 85, courseSpread: 2 },
  { email: 'npc.mateo.garcia@larryacademy.local', name: 'Mateo Garcia', country: 'Mexico', timezone: 'America/Mexico_City', sparkTarget: 660, gemTarget: 8, accuracy: 76, courseSpread: 2 },
  { email: 'npc.amelia.taylor@larryacademy.local', name: 'Amelia Taylor', country: 'Australia', timezone: 'Australia/Sydney', sparkTarget: 610, gemTarget: 8, accuracy: 80, courseSpread: 2 },
  { email: 'npc.levi.cohen@larryacademy.local', name: 'Levi Cohen', country: 'Israel', timezone: 'Asia/Jerusalem', sparkTarget: 560, gemTarget: 7, accuracy: 74, courseSpread: 2 },
  { email: 'npc.aisha.okafor@larryacademy.local', name: 'Aisha Okafor', country: 'Nigeria', timezone: 'Africa/Lagos', sparkTarget: 505, gemTarget: 7, accuracy: 83, courseSpread: 2 },
  { email: 'npc.hugo.silva@larryacademy.local', name: 'Hugo Silva', country: 'Brazil', timezone: 'America/Sao_Paulo', sparkTarget: 455, gemTarget: 6, accuracy: 75, courseSpread: 1 },
  { email: 'npc.lina.nguyen@larryacademy.local', name: 'Lina Nguyen', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', sparkTarget: 410, gemTarget: 5, accuracy: 81, courseSpread: 1 },
  { email: 'npc.samuel.brown@larryacademy.local', name: 'Samuel Brown', country: 'South Africa', timezone: 'Africa/Johannesburg', sparkTarget: 365, gemTarget: 5, accuracy: 72, courseSpread: 1 },
  { email: 'npc.nora.hassan@larryacademy.local', name: 'Nora Hassan', country: 'Egypt', timezone: 'Africa/Cairo', sparkTarget: 320, gemTarget: 4, accuracy: 77, courseSpread: 1 },
  { email: 'npc.elias.larsen@larryacademy.local', name: 'Elias Larsen', country: 'Norway', timezone: 'Europe/Oslo', sparkTarget: 280, gemTarget: 3, accuracy: 70, courseSpread: 1 },
]

const activeCourseIds = [
  'course-ib-pyp-g4',
  'course-ib-pyp-g5-math',
  'course-ngss-science-g4',
  'course-ngss-science',
  'course-ngss-science-g7',
  'course-larry-math-g3-g4-number-sense',
  'course-larry-math-g4-g5-word-problem-modeling',
  'course-larry-math-g5-g6-fractions-ratios-percent',
  'course-larry-math-g5-g7-geometry-spatial',
  'course-larry-math-g6-g8-amc8-reasoning',
]

function pseudoRandom(seed: number) {
  let value = seed % 2147483647
  return () => {
    value = (value * 48271) % 2147483647
    return value / 2147483647
  }
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length]
}

function buildAttemptData(questionCount: number, correctCount: number) {
  const results = Array.from({ length: questionCount }, (_, index) => ({
    questionId: `npc-q-${index + 1}`,
    correct: index < correctCount,
    points: index < correctCount ? 10 : -3,
    explanation: null,
    hint: null,
  }))

  return JSON.stringify({
    answers: results.map((result) => ({ questionId: result.questionId, value: result.correct ? 'correct' : 'review' })),
    results,
    rawScore: correctCount * 10 - (questionCount - correctCount) * 3,
    percent: Math.round((correctCount / questionCount) * 100),
    maxCorrectStreak: Math.min(correctCount, 10 + Math.floor(correctCount / 6)),
    npcSeed: true,
  })
}

async function main() {
  console.log('Seeding leaderboard NPC users...')

  const courses = await prisma.course.findMany({
    where: {
      id: { in: activeCourseIds },
      published: true,
      status: 'active',
    },
    orderBy: [{ courseTrack: 'asc' }, { title: 'asc' }],
    include: {
      lessons: { orderBy: { order: 'asc' } },
      activities: { where: { published: true }, orderBy: { order: 'asc' } },
    },
  })

  if (courses.length === 0) {
    throw new Error('No active published courses found for NPC leaderboard seed.')
  }
  const practiceCourses = courses.filter((course) => course.activities.some((activity) => activity.type === 'practice' || activity.type === 'quiz'))
  if (practiceCourses.length === 0) {
    throw new Error('No active practice or quiz activities found for NPC leaderboard seed.')
  }

  await prisma.user.deleteMany({
    where: { email: { endsWith: '@larryacademy.local' } },
  })

  for (let index = 0; index < npcProfiles.length; index += 1) {
    const profile = npcProfiles[index]
    const random = pseudoRandom(index + 91)
    const user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        emailVerified: new Date(),
        role: 'student',
        country: profile.country,
        timezone: profile.timezone,
        subscriptionStatus: 'npc',
        points: profile.sparkTarget,
        gems: profile.gemTarget,
        marketingConsent: false,
        onboardingCompleted: true,
      },
    })

    const selectedCourses = Array.from({ length: profile.courseSpread }, (_, offset) => pick(courses, index + offset))
    const hasPracticeCourse = selectedCourses.some((course) =>
      course.activities.some((activity) => activity.type === 'practice' || activity.type === 'quiz')
    )
    if (!hasPracticeCourse) {
      selectedCourses[selectedCourses.length - 1] = pick(practiceCourses, index)
    }
    let remainingQuestions = 18 + Math.floor(profile.sparkTarget / 26)
    let remainingCorrect = Math.max(1, Math.round((remainingQuestions * profile.accuracy) / 100))
    let activityCounter = 0

    for (const course of selectedCourses) {
      const lessonCount = course.lessons.length
      const completedLessonCount = Math.min(
        lessonCount,
        Math.max(1, Math.round(lessonCount * (0.12 + random() * 0.34)))
      )
      const selectedLessons = course.lessons.slice(0, completedLessonCount)

      if (selectedLessons.length > 0) {
        await prisma.userLessonProgress.createMany({
          data: selectedLessons.map((lesson, lessonIndex) => ({
            userId: user.id,
            lessonId: lesson.id,
            progressPercentage: 100,
            lastWatchedPosition: Number(lesson.duration || 600),
            completedAt: new Date(Date.now() - (index * 11 + lessonIndex) * 36 * 60 * 60 * 1000),
          })),
        })
      }

      const progressPercentage = lessonCount ? Math.round((selectedLessons.length / lessonCount) * 100) : 0
      await prisma.userCourseProgress.create({
        data: {
          userId: user.id,
          courseId: course.id,
          progressPercentage,
          lastWatchedPosition: selectedLessons.length,
          completedAt: progressPercentage >= 100 ? new Date() : null,
        },
      })

      const activities = course.activities.filter((activity) => activity.type === 'practice' || activity.type === 'quiz')
      const activitySampleSize = Math.min(activities.length, Math.max(1, Math.ceil(selectedLessons.length * 0.55)))
      for (const activity of activities.slice(0, activitySampleSize)) {
        const questionCount = Math.max(5, Math.min(15, Math.floor(8 + random() * 8)))
        const correctCount = Math.max(1, Math.min(questionCount, Math.round((questionCount * profile.accuracy) / 100 + (random() - 0.5) * 2)))
        remainingQuestions = Math.max(0, remainingQuestions - questionCount)
        remainingCorrect = Math.max(0, remainingCorrect - correctCount)
        const score = Math.max(0, correctCount * 10 - (questionCount - correctCount) * 3)
        const maxScore = questionCount * 10
        const earnedGems = activityCounter % 7 === 0 && profile.gemTarget > 0 ? 1 : 0

        await prisma.userActivityAttempt.create({
          data: {
            userId: user.id,
            activityId: activity.id,
            score,
            maxScore,
            completed: true,
            earnedPoints: Math.round(score * (0.35 + random() * 0.25)),
            earnedGems,
            data: buildAttemptData(questionCount, correctCount),
          },
        })
        activityCounter += 1
      }
    }

    await prisma.rewardTransaction.createMany({
      data: [
        {
          userId: user.id,
          type: 'points',
          amount: profile.sparkTarget,
          reason: 'NPC leaderboard warm start Sparks',
          sourceType: 'manual',
          sourceId: 'leaderboard-npc-seed',
          metadata: JSON.stringify({ npc: true, country: profile.country }),
        },
        {
          userId: user.id,
          type: 'gems',
          amount: profile.gemTarget,
          reason: 'NPC leaderboard warm start Gems',
          sourceType: 'manual',
          sourceId: 'leaderboard-npc-seed',
          metadata: JSON.stringify({ npc: true, country: profile.country }),
        },
      ],
    })

    console.log(`NPC ${index + 1}: ${profile.name} (${profile.country}) ${profile.sparkTarget} Sparks / ${profile.gemTarget} Gems`)
  }

  const npcCount = await prisma.user.count({ where: { email: { in: npcProfiles.map((profile) => profile.email) } } })
  console.log(`Leaderboard NPC seed complete. NPC users: ${npcCount}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
