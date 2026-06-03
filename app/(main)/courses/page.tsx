import { prisma } from '@/lib/prisma'
import CoursesPageClient from './CoursesPageClient'

const categoryToTrack: Record<string, string> = {
  math: 'larry-math',
  'larry-math': 'larry-math',
  'ib-big-math': 'ib-big-math',
  'ngss-science': 'ngss-science',
}

function countActivityQuestions(config?: string | null) {
  if (!config) return 0
  try {
    const parsed = JSON.parse(config) as { questions?: unknown[] }
    return Array.isArray(parsed.questions) ? parsed.questions.length : 0
  } catch {
    return 0
  }
}

function courseQuestionCount(course: { lessons: { activities: { config: string | null }[] }[] }) {
  return course.lessons.reduce((courseTotal, lesson) => {
    return courseTotal + lesson.activities.reduce((lessonTotal, activity) => lessonTotal + countActivityQuestions(activity.config), 0)
  }, 0)
}

function plannedCourseStats(course: { id: string; status: string; courseTrack: string; _count: { lessons: number }; lessons: { activities: { config: string | null }[] }[] }) {
  const plannedIbPypIds = new Set(['course-ib-big-math', 'course-ib-big-math-g7-pyp', 'course-ib-big-math-g8-pyp'])
  if (course.status === 'coming-soon' && course.courseTrack === 'ib-big-math' && plannedIbPypIds.has(course.id)) {
    return { lessons: 40, questions: 800 }
  }
  const plannedNgssIds = new Set(['course-ngss-science-g7', 'course-ngss-science-g8'])
  if (course.status === 'coming-soon' && course.courseTrack === 'ngss-science' && plannedNgssIds.has(course.id)) {
    return { lessons: 20, questions: 200 }
  }
  return { lessons: course._count.lessons, questions: courseQuestionCount(course) }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const selectedTrackKey = category ? categoryToTrack[category] || 'other' : null

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(category ? { category: { equals: category } } : {}),
    },
    include: {
      lessons: {
        select: {
          activities: {
            where: { type: 'practice' },
            select: { config: true },
          },
        },
      },
      _count: {
        select: { lessons: true, activities: true },
      },
    },
    orderBy: [
      { featured: 'desc' },
      { gradeLevel: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  const totalLessonCount = courses.reduce((sum, course) => sum + plannedCourseStats(course).lessons, 0)
  const totalQuestionCount = courses.reduce((sum, course) => sum + plannedCourseStats(course).questions, 0)

  return (
    <CoursesPageClient
      selectedTrackKey={selectedTrackKey}
      totalLessonCount={totalLessonCount}
      totalQuestionCount={totalQuestionCount}
      courses={courses.map((course) => {
        const stats = plannedCourseStats(course)
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          status: course.status,
          accessLevel: course.accessLevel,
          isFree: course.isFree,
          price: course.price,
          courseTrack: course.courseTrack || 'other',
          thumbnailUrl: course.thumbnailUrl,
          viewCount: course.viewCount,
          lessonCount: stats.lessons,
          questionCount: stats.questions,
        }
      })}
    />
  )
}
