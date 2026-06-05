import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const courseDataPath = path.join(process.cwd(), 'data', 'ngss-g7-science-course.json')
const vodMapPath = path.join(process.cwd(), 'data', 'ngss-g7-vod-map.json')

type LessonData = {
  id: string
  title: string
  description: string
  order: number
  duration: number
  gradeLevel: string
  difficulty: string
  videoProvider: string
  isPreview: boolean
  hasPractice: boolean
  hasGame: boolean
  rewardsPoints: number
  rewardsGems: number
  videoFileName: string
  coverUrl?: string
  practice: {
    title: string
    maxScore: number
    passingScore: number
    rewards: { gemsOnPass: number; gemsOnPerfect: number }
    reviewAdvice: { rewatchMessage: string; focus: string }
    questions: unknown[]
  }
}

type CourseData = {
  id: string
  title: string
  description: string
  category: string
  courseTrack: string
  gradeLevel: string
  thumbnailUrl: string
  lessons: LessonData[]
}

function readJson<T>(filePath: string, fallback?: T): T {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing file: ${filePath}`)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

async function main() {
  const course = readJson<CourseData>(courseDataPath)
  const vodMap = readJson<Record<string, { fileId?: string; mediaUrl?: string } | string>>(vodMapPath, {})
  const lessonIds = course.lessons.map((lesson) => lesson.id)

  await prisma.course.upsert({
    where: { id: course.id },
    update: {
      title: course.title,
      description: course.description,
      price: 19,
      isFree: false,
      accessLevel: 'paid',
      category: course.category,
      courseTrack: course.courseTrack,
      status: 'active',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      expectedFeatures: JSON.stringify(['20 released phenomenon lessons', '200 lesson-specific practice questions', 'Life science, Earth systems, climate, and ecosystems', 'Open-response science explanations']),
      thumbnailUrl: course.thumbnailUrl,
      gradeLevel: course.gradeLevel,
      difficulty: 'Medium',
      featured: true,
      published: true,
    },
    create: {
      id: course.id,
      title: course.title,
      description: course.description,
      price: 19,
      isFree: false,
      accessLevel: 'paid',
      category: course.category,
      courseTrack: course.courseTrack,
      status: 'active',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      expectedFeatures: JSON.stringify(['20 released phenomenon lessons', '200 lesson-specific practice questions', 'Life science, Earth systems, climate, and ecosystems', 'Open-response science explanations']),
      thumbnailUrl: course.thumbnailUrl,
      gradeLevel: course.gradeLevel,
      difficulty: 'Medium',
      featured: true,
      published: true,
    },
  })

  await prisma.lessonActivity.deleteMany({
    where: {
      courseId: course.id,
      lessonId: { notIn: lessonIds },
    },
  })
  await prisma.lesson.deleteMany({
    where: {
      courseId: course.id,
      id: { notIn: lessonIds },
    },
  })

  for (const lesson of course.lessons) {
    const vodEntry = vodMap[lesson.id]
    const fileId = typeof vodEntry === 'string' ? vodEntry : vodEntry?.fileId

    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        courseId: course.id,
        title: lesson.title,
        description: lesson.description,
        videoProvider: lesson.videoProvider,
        tencentVodFileId: fileId || null,
        videoUrl: typeof vodEntry === 'object' ? vodEntry.mediaUrl || null : null,
        order: lesson.order,
        duration: lesson.duration,
        isPreview: lesson.isPreview,
        hasPractice: lesson.hasPractice,
        hasGame: lesson.hasGame,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        gradeLevel: lesson.gradeLevel,
        difficulty: lesson.difficulty,
      },
      create: {
        id: lesson.id,
        courseId: course.id,
        title: lesson.title,
        description: lesson.description,
        videoProvider: lesson.videoProvider,
        tencentVodFileId: fileId || null,
        videoUrl: typeof vodEntry === 'object' ? vodEntry.mediaUrl || null : null,
        order: lesson.order,
        duration: lesson.duration,
        isPreview: lesson.isPreview,
        hasPractice: lesson.hasPractice,
        hasGame: lesson.hasGame,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        gradeLevel: lesson.gradeLevel,
        difficulty: lesson.difficulty,
      },
    })

    await prisma.lessonActivity.upsert({
      where: { id: `activity-${lesson.id}-practice` },
      update: {
        courseId: course.id,
        lessonId: lesson.id,
        type: 'practice',
        title: lesson.practice.title,
        description: `Practice quest for ${lesson.title}`,
        config: JSON.stringify(lesson.practice),
        provider: 'internal-practice',
        order: 1,
        isRequired: true,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        published: true,
      },
      create: {
        id: `activity-${lesson.id}-practice`,
        courseId: course.id,
        lessonId: lesson.id,
        type: 'practice',
        title: lesson.practice.title,
        description: `Practice quest for ${lesson.title}`,
        config: JSON.stringify(lesson.practice),
        provider: 'internal-practice',
        order: 1,
        isRequired: true,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        published: true,
      },
    })

    console.log(`upserted ${lesson.id}${fileId ? ` vod=${fileId}` : ' without VOD fileId'}`)
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
