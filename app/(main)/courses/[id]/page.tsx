import PurchaseCourseButton from '@/components/courses/PurchaseCourseButton'
import { authOptions } from '@/lib/auth'
import { resolveCourseAccess } from '@/lib/course-access'
import type { Locale } from '@/lib/i18n'
import { prisma } from '@/lib/prisma'
import { getServerLocale } from '@/lib/server-i18n'
import { getVideoEmbedUrl, getVideoSourceLabel } from '@/lib/video'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function difficultyLabel(level: string, locale: Locale) {
  if (locale === 'en') {
    if (level === 'beginner') return 'Beginner'
    if (level === 'intermediate') return 'Intermediate'
    if (level === 'advanced') return 'Advanced'
    return level
  }
  if (level === 'beginner') return '初级'
  if (level === 'intermediate') return '中级'
  if (level === 'advanced') return '高级'
  return level
}

const previewLessonCount = 3

const detailCopy = {
  zh: {
    back: '返回课程列表',
    accessTitle: '学习权限',
    publicAccess: '公开免费，任何人都可以学习。',
    registeredAccess: '注册登录后即可学习。',
    purchasedAccess: '你已经拥有这门课的学习权限。',
    comingSoonAccess: '课程内容正在制作中，当前开放介绍页。',
    loginRequiredAccess: `前 ${previewLessonCount} 节可免费试看；继续学习完整课程需登录并开通权限。`,
    purchaseRequiredAccess: `前 ${previewLessonCount} 节可免费试看；第 ${previewLessonCount + 1} 节开始需要开通课程权限。`,
    currentPrice: '当前价格',
    continueLearning: '继续学习',
    startNow: '立即开始',
    viewOtherCourses: '查看其他课程',
    previewLessons: `免费试看前 ${previewLessonCount} 节`,
    loginForFullCourse: '登录后开通完整课程',
    contentTitle: '课程内容',
    contentSubtitle: `前 ${previewLessonCount} 级可免费试看，完整路径共 {count} 级。`,
    levels: 'Levels',
    noLessonDesc: '课节说明待补充',
    preview: '试看',
    practice: 'Practice',
    game: '小游戏',
    visits: '访问',
    noLessons: '正在制作课节内容。',
    viewAllLevels: '进入学习页查看全部 {count} 级',
    statsLessons: '课节',
    statsQuestions: '题目',
    statsStarted: '已开始学习',
  },
  en: {
    back: 'Back to Courses',
    accessTitle: 'Course Access',
    publicAccess: 'Free and open to everyone.',
    registeredAccess: 'Available after registration.',
    purchasedAccess: 'You already have access to this course.',
    comingSoonAccess: 'This course is in production. The introduction page is open for now.',
    loginRequiredAccess: `The first ${previewLessonCount} lessons are free to preview. Log in and unlock the full course to continue.`,
    purchaseRequiredAccess: `The first ${previewLessonCount} lessons are free to preview. Lesson ${previewLessonCount + 1} and beyond require course access.`,
    currentPrice: 'Current price',
    continueLearning: 'Continue Learning',
    startNow: 'Start Now',
    viewOtherCourses: 'View Other Courses',
    previewLessons: `Preview First ${previewLessonCount} Lessons`,
    loginForFullCourse: 'Log In to Unlock Full Course',
    contentTitle: 'Course Content',
    contentSubtitle: `The first ${previewLessonCount} levels are free to preview. Full pathway: {count} levels.`,
    levels: 'Levels',
    noLessonDesc: 'Lesson description coming soon',
    preview: 'Preview',
    practice: 'Practice',
    game: 'Game',
    visits: 'visits',
    noLessons: 'Lesson content is in production.',
    viewAllLevels: 'Open learning page for all {count} levels',
    statsLessons: 'Lessons',
    statsQuestions: 'Questions',
    statsStarted: 'Started',
  },
} satisfies Record<Locale, Record<string, string>>

function formatUsdPrice(price: number) {
  return `$${price} USD`
}

function accessCopy(reason: string, price: number, locale: Locale) {
  const copy = detailCopy[locale]
  if (reason === 'public') return copy.publicAccess
  if (reason === 'registered') return copy.registeredAccess
  if (reason === 'purchased') return copy.purchasedAccess
  if (reason === 'coming-soon') return copy.comingSoonAccess
  if (reason === 'login-required') return `${copy.loginRequiredAccess} ${copy.currentPrice}: ${formatUsdPrice(price)}.`
  return `${copy.purchaseRequiredAccess} ${copy.currentPrice}: ${formatUsdPrice(price)}.`
}

function courseTrackLabel(track: string) {
  if (track === 'ngss-science') return 'NGSS Science'
  if (track === 'ib-big-math') return 'IB Big Math'
  if (track === 'larry-math') return 'Larry Math'
  return 'Future Course'
}

const courseDescriptionOverrides: Record<Locale, Record<string, string>> = {
  zh: {
    'course-ib-pyp-g4': '完整的 40 节 IB G4 数学路径，配套视频课、技能刷题、反思题、学习进度和游戏化奖励，帮助孩子把基础打牢。',
    'course-ib-pyp-g5-math': '面向 G5 的 IB 数学核心学习伴侣：视频讲解、概念检查和游戏化练习共同支持预习、复习和满分基础。',
    'course-ib-big-math': 'G6 进入 IB 数学风格的重要桥梁：分数、比例、小数、几何、数据和应用题都会被拆成清楚的视觉模型与日常练习，让学生不只是会做题，也理解为什么。',
    'course-ib-big-math-g7-pyp': 'G7 数学推理进阶路径：代数规律、比例关系、概率统计、面积体积和多步问题被组织成系统的 IB 数学学习伴侣。',
    'course-ib-big-math-g8-pyp': 'G8 高阶数学启动器：方程、函数、坐标几何、图形变换、概率和证明式推理相互连接，为之后更高阶的 IB 数学建立有条理的基础。',
    'course-ngss-science': 'G6 NGSS 科学主课：从科学提问、实验公平性、数据证据，到物质、力、能量、波、地球系统和生态影响，配套 20 节视频与 200 道练习。',
    'course-ngss-science-g7': 'G7 NGSS 已开放前 5 课：从系统、尺度和模型进入细胞世界，学习细胞结构、动植物细胞、光合作用和细胞呼吸，并通过证据推理练习把生命科学真正讲清楚。',
    'course-ngss-science-g8': 'G8 NGSS 即将开放：聚焦力与运动、波、遗传、自然选择、空间系统、气候证据和工程约束，为高阶科学学习打下清晰基础。',
  },
  en: {
    'course-ib-pyp-g4': 'A complete 40-lesson Grade 4 IB Big Math pathway with video lessons, focused skill drills, reflection prompts, progress tracking, and game-style rewards.',
    'course-ib-pyp-g5-math': 'A Grade 5 IB Math core companion: video explanations, concept checks, and game-like practice that support preview, review, and a full-score foundation.',
    'course-ib-big-math': 'Grade 6 is the bridge into IB-style math: fractions, ratios, decimals, geometry, data, and word problems become clear visual models and daily practice.',
    'course-ib-big-math-g7-pyp': 'A Grade 7 reasoning pathway for algebraic patterns, proportional relationships, probability, statistics, area, volume, and multi-step problem solving.',
    'course-ib-big-math-g8-pyp': 'A Grade 8 launchpad for advanced math: equations, functions, coordinate geometry, transformations, probability, and proof-style reasoning.',
    'course-ngss-science': 'Grade 6 NGSS Science: 20 phenomenon-based lessons and 200 practice questions across scientific questions, fair tests, data evidence, matter, forces, energy, waves, Earth systems, and ecosystems.',
    'course-ngss-science-g7': 'Grade 7 NGSS is open with its first 5 lessons: systems, scale, cell structures, plant and animal cells, photosynthesis, and cellular respiration, paired with evidence-based practice that helps students explain life science clearly.',
    'course-ngss-science-g8': 'Coming soon for Grade 8: forces, waves, genetics, natural selection, space systems, climate evidence, and engineering constraints for high-school-ready science thinking.',
  },
}

const featureCardCopy = {
  zh: ['视频课程', '互动答题', 'Practice 练习', '小游戏挑战'],
  en: ['Video Lessons', 'Interactive Questions', 'Practice Drills', 'Mini Game Challenges'],
} satisfies Record<Locale, string[]>

function courseCoverPath(course: { id: string; courseTrack: string; thumbnailUrl?: string | null }) {
  if (course.thumbnailUrl) return course.thumbnailUrl
  if (course.id === 'course-ngss-science' || course.courseTrack === 'ngss-science') {
    return '/course-covers/ngss-science-cover.png'
  }
  return null
}

function countLessonQuestions(lessons: { activities?: { config: string | null }[] }[]) {
  return lessons.reduce((total, lesson) => {
    const lessonQuestions = lesson.activities?.reduce((activityTotal, activity) => {
      if (!activity.config) return activityTotal
      try {
        const config = JSON.parse(activity.config) as { questions?: unknown[] }
        return activityTotal + (Array.isArray(config.questions) ? config.questions.length : 0)
      } catch {
        return activityTotal
      }
    }, 0) || 0
    return total + lessonQuestions
  }, 0)
}

function plannedCourseStats(course: { id: string; status: string; courseTrack: string; lessons: { activities?: { config: string | null }[] }[] }) {
  const plannedIbPypIds = new Set(['course-ib-big-math', 'course-ib-big-math-g7-pyp', 'course-ib-big-math-g8-pyp'])
  if (course.status === 'coming-soon' && course.courseTrack === 'ib-big-math' && plannedIbPypIds.has(course.id)) {
    return { lessons: 40, questions: 800 }
  }
  const plannedNgssIds = new Set(['course-ngss-science-g7', 'course-ngss-science-g8'])
  if (course.status === 'coming-soon' && course.courseTrack === 'ngss-science' && plannedNgssIds.has(course.id)) {
    return { lessons: 20, questions: 200 }
  }
  return { lessons: course.lessons.length, questions: countLessonQuestions(course.lessons) }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const locale = await getServerLocale()
  const copy = detailCopy[locale]

  const existingCourse = await prisma.course.findUnique({ where: { id }, select: { id: true } })
  if (!existingCourse) redirect('/courses')

  const course = await prisma.course.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    include: {
      lessons: {
        include: {
          activities: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      activities: {
        where: { lessonId: null },
        orderBy: { order: 'asc' },
      },
    },
  })

  const access = await resolveCourseAccess(course, session?.user?.email)
  const progress = session?.user?.email
    ? await prisma.userCourseProgress.findUnique({
        where: {
          userId_courseId: {
            userId: (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id || '',
            courseId: id,
          },
        },
      }).catch(() => null)
    : null

  const heroEmbed = getVideoEmbedUrl(course)
  const coverPath = courseCoverPath(course)
  const plannedStats = plannedCourseStats(course)
  const startedLearners = Number(course.viewCount || 0) + 100
  const featureCards = course.expectedFeatures
    ? locale === 'zh'
      ? JSON.parse(course.expectedFeatures) as string[]
      : featureCardCopy.en
    : featureCardCopy[locale]
  const courseDescription = courseDescriptionOverrides[locale][course.id] || course.description

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <Link href="/courses" className="mb-8 inline-flex text-sm font-bold text-blue-300 hover:text-blue-200">
          {copy.back}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
          <main className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
            <div className="relative aspect-video overflow-hidden bg-black">
              {coverPath ? (
                <>
                  <img
                    src={coverPath}
                    alt={`${course.title} course cover`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(16,185,129,0.08),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.64),rgba(0,0,0,0.16)_52%,rgba(0,0,0,0.56))]" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-white/70">
                      {courseTrackLabel(course.courseTrack)}
                    </p>
                    <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white drop-shadow-2xl sm:text-6xl">
                      {course.title}
                    </h1>
                  </div>
                </>
              ) : heroEmbed ? (
                <iframe
                  className="h-full w-full"
                  src={heroEmbed}
                  title={course.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-violet-500/10 text-center">
                  <div>
                    <div className="text-6xl opacity-40">📹</div>
                    <p className="mt-4 text-sm font-bold uppercase tracking-[0.25em] text-white/50">
                      {getVideoSourceLabel(course)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-200">
                  {courseTrackLabel(course.courseTrack)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                  {difficultyLabel(course.difficultyLevel, locale)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                  {getVideoSourceLabel(course)}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{course.title}</h1>
              <p className="mt-6 text-lg leading-8 text-gray-400">{courseDescription}</p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  [copy.statsLessons, plannedStats.lessons],
                  [copy.statsQuestions, plannedStats.questions ?? 'TBD'],
                  [copy.statsStarted, startedLearners],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/[0.04] p-4">
                    <div className="text-2xl font-black">{value}</div>
                    <div className="mt-1 text-xs font-bold text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {course.status === 'coming-soon' && (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {featureCards.map((feature) => (
                    <div key={feature} className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-gray-300">
                      {feature}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <h2 className="text-2xl font-black">{copy.accessTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-400">{accessCopy(access.reason, course.price, locale)}</p>

              <div className="mt-6">
                {access.hasAccess ? (
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block rounded-2xl bg-blue-600 px-6 py-4 text-center text-lg font-black text-white transition hover:bg-blue-500"
                  >
                    {progress ? copy.continueLearning : copy.startNow}
                  </Link>
                ) : access.reason === 'coming-soon' ? (
                  <Link
                    href="/courses"
                    className="block rounded-2xl bg-white/10 px-6 py-4 text-center text-lg font-black text-white/70"
                  >
                    {copy.viewOtherCourses}
                  </Link>
                ) : access.reason === 'login-required' ? (
                  <div className="space-y-3">
                    {course.lessons.length > 0 && (
                      <Link
                        href={`/courses/${course.id}/learn`}
                        className="block rounded-2xl border border-blue-400/25 bg-blue-500/10 px-6 py-4 text-center text-lg font-black text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-500/15"
                      >
                        {copy.previewLessons}
                      </Link>
                    )}
                    <Link
                      href={`/login?callbackUrl=/courses/${course.id}`}
                      className="block rounded-2xl bg-blue-600 px-6 py-4 text-center text-lg font-black text-white transition hover:bg-blue-500"
                    >
                      {copy.loginForFullCourse}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.lessons.length > 0 && (
                      <Link
                        href={`/courses/${course.id}/learn`}
                        className="block rounded-2xl border border-blue-400/25 bg-blue-500/10 px-6 py-4 text-center text-lg font-black text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-500/15"
                      >
                        {copy.previewLessons}
                      </Link>
                    )}
                    <PurchaseCourseButton courseId={course.id} price={course.price} />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{copy.contentTitle}</h2>
                  <p className="mt-2 text-sm text-gray-500">{copy.contentSubtitle.replace('{count}', String(plannedStats.lessons))}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] px-4 py-3 text-right">
                  <div className="text-2xl font-black">{plannedStats.lessons}</div>
                  <div className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">{copy.levels}</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {course.lessons.length > 0 ? course.lessons.slice(0, 5).map((lesson, index) => (
                  <div key={lesson.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-sm font-black text-blue-200">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white">{lesson.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{lesson.description || copy.noLessonDesc}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-400">
                          {(lesson.isPreview || index < previewLessonCount) && <span>{copy.preview}</span>}
                          {lesson.hasPractice && <span>{copy.practice}</span>}
                          {lesson.hasGame && <span>{copy.game}</span>}
                          <span>{lesson.viewCount} {copy.visits}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-gray-500">
                    {copy.noLessons}
                  </p>
                )}
                {course.lessons.length > 5 && (
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-center text-sm font-black text-blue-200 transition hover:border-blue-300/40 hover:bg-blue-500/15"
                  >
                    {copy.viewAllLevels.replace('{count}', String(plannedStats.lessons))} →
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
