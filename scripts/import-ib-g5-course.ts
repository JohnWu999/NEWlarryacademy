import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

type LessonSeed = {
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
  practice: Record<string, unknown>
}

type CourseSeed = {
  id: string
  title: string
  description: string
  category: string
  courseTrack: string
  status: string
  accessLevel: string
  isFree: boolean
  price: number
  difficultyLevel: string
  gradeLevel: string
  difficulty: string
  videoProvider: string
  lessons: LessonSeed[]
}

const prisma = new PrismaClient()
const dataPath = path.join(process.cwd(), 'data/ib-pyp-g5-course.json')
const vodMapPath = path.join(process.cwd(), 'data/ib-pyp-g5-vod-map.json')

type VodMapValue = string | { fileId?: string; mediaUrl?: string }

function loadVodMap() {
  if (!fs.existsSync(vodMapPath)) return {}
  return JSON.parse(fs.readFileSync(vodMapPath, 'utf8')) as Record<string, VodMapValue>
}

async function main() {
  const course = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as CourseSeed
  const vodMap = loadVodMap()
  const totalDuration = course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0)

  await prisma.course.upsert({
    where: { id: course.id },
    update: {
      title: course.title,
      description: course.description,
      price: course.price,
      isFree: course.isFree,
      accessLevel: course.accessLevel,
      category: course.category,
      courseTrack: course.courseTrack,
      status: course.status,
      difficultyLevel: course.difficultyLevel,
      videoProvider: course.videoProvider,
      duration: totalDuration,
      gradeLevel: course.gradeLevel,
      difficulty: course.difficulty,
      featured: true,
      published: true,
    },
    create: {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      isFree: course.isFree,
      accessLevel: course.accessLevel,
      category: course.category,
      courseTrack: course.courseTrack,
      status: course.status,
      difficultyLevel: course.difficultyLevel,
      videoProvider: course.videoProvider,
      duration: totalDuration,
      gradeLevel: course.gradeLevel,
      difficulty: course.difficulty,
      featured: true,
      published: true,
    },
  })

  for (const lesson of course.lessons) {
    const vodEntry = vodMap[lesson.id]
    const tencentVodFileId = typeof vodEntry === 'string' ? vodEntry : vodEntry?.fileId || null
    const videoUrl = typeof vodEntry === 'object' ? vodEntry.mediaUrl || null : null

    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        title: lesson.title,
        description: lesson.description,
        videoUrl,
        videoProvider: lesson.videoProvider,
        tencentVodFileId,
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
        videoUrl,
        videoProvider: lesson.videoProvider,
        tencentVodFileId,
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
      where: { id: `activity-ib-pyp-g5-ep${String(lesson.order).padStart(2, '0')}-practice` },
      update: {
        title: `${lesson.title} Practice Quest`,
        description: '10-question interactive quest with points, gems, hints, sound feedback, and review advice.',
        config: JSON.stringify(lesson.practice),
        provider: 'internal-quiz',
        order: 1,
        isRequired: true,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        published: true,
      },
      create: {
        id: `activity-ib-pyp-g5-ep${String(lesson.order).padStart(2, '0')}-practice`,
        courseId: course.id,
        lessonId: lesson.id,
        type: 'practice',
        title: `${lesson.title} Practice Quest`,
        description: '10-question interactive quest with points, gems, hints, sound feedback, and review advice.',
        config: JSON.stringify(lesson.practice),
        provider: 'internal-quiz',
        order: 1,
        isRequired: true,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        published: true,
      },
    })
  }

  console.log(`Imported ${course.lessons.length} IB G5 lessons into ${course.id}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
