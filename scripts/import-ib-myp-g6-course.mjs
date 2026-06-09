import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const dataPath = path.join(process.cwd(), 'data/ib-myp-g6-course.json')
const vodMapPath = path.join(process.cwd(), 'data/ib-myp-g6-vod-map.json')

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing file: ${filePath}`)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

async function main() {
  const course = readJson(dataPath)
  const vodMap = readJson(vodMapPath, {})
  const lessonIds = course.lessons.map((lesson) => lesson.id)
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
      expectedFeatures: JSON.stringify(course.expectedFeatures || []),
      thumbnailUrl: course.thumbnailUrl,
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
      expectedFeatures: JSON.stringify(course.expectedFeatures || []),
      thumbnailUrl: course.thumbnailUrl,
      duration: totalDuration,
      gradeLevel: course.gradeLevel,
      difficulty: course.difficulty,
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
    const tencentVodFileId = typeof vodEntry === 'string' ? vodEntry : vodEntry?.fileId || null
    const videoUrl = typeof vodEntry === 'object' ? vodEntry.mediaUrl || null : null
    const activityId = `activity-ib-myp-g6-ep${String(lesson.order).padStart(2, '0')}-practice`

    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
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
      where: { id: activityId },
      update: {
        courseId: course.id,
        lessonId: lesson.id,
        type: 'practice',
        title: `${lesson.title} Practice Quest`,
        description: '20-question adaptive mastery quest with SVG visuals, hint-first feedback, wrong-question review, points, gems, and streak rewards.',
        config: JSON.stringify(lesson.practice),
        provider: 'internal-practice',
        order: 1,
        isRequired: true,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        published: true,
      },
      create: {
        id: activityId,
        courseId: course.id,
        lessonId: lesson.id,
        type: 'practice',
        title: `${lesson.title} Practice Quest`,
        description: '20-question adaptive mastery quest with SVG visuals, hint-first feedback, wrong-question review, points, gems, and streak rewards.',
        config: JSON.stringify(lesson.practice),
        provider: 'internal-practice',
        order: 1,
        isRequired: true,
        rewardsPoints: lesson.rewardsPoints,
        rewardsGems: lesson.rewardsGems,
        published: true,
      },
    })

    console.log(`upserted ${lesson.id}${tencentVodFileId ? ` vod=${tencentVodFileId}` : ' without VOD fileId'}`)
  }

  console.log(`Imported ${course.lessons.length} IB MYP G6 lessons and ${course.lessons.length * 20} practice questions into ${course.id}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
