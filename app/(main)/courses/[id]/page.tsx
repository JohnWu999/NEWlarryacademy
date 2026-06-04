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
    visits: 'Peer Learning',
    noLessons: '正在制作课节内容。',
    viewAllLevels: '进入学习页查看全部 {count} 级',
    statsLessons: '课节',
    statsQuestions: '题目',
    statsStarted: 'Peer Learning',
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
    visits: 'Peer Learning',
    noLessons: 'Lesson content is in production.',
    viewAllLevels: 'Open learning page for all {count} levels',
    statsLessons: 'Lessons',
    statsQuestions: 'Questions',
    statsStarted: 'Peer Learning',
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

const visualWallCopy = {
  zh: {
    label: '课程视觉预览',
    title: '像打开一张学习大片海报',
    subtitle: '每一格都代表一次视频、一次练习、一次探索。',
  },
  en: {
    label: 'Visual Preview',
    title: 'A cinematic map of the learning journey',
    subtitle: 'Every tile hints at a lesson, a practice moment, or a discovery.',
  },
} satisfies Record<Locale, Record<string, string>>

const ibVisualMotifs = [
  { title: 'Foundation Quest', subtitle: 'models + drills', symbol: '4,820', tone: 'from-blue-500/35 via-cyan-400/18 to-slate-950' },
  { title: 'Fraction Lab', subtitle: 'parts to whole', symbol: '3/8', tone: 'from-violet-500/35 via-fuchsia-400/18 to-slate-950' },
  { title: 'Ratio Arena', subtitle: 'compare + scale', symbol: '5:8', tone: 'from-emerald-500/30 via-teal-300/16 to-slate-950' },
  { title: 'Geometry Grid', subtitle: 'shape reasoning', symbol: 'A = lw', tone: 'from-sky-500/32 via-indigo-400/16 to-slate-950' },
  { title: 'Data Mission', subtitle: 'patterns + proof', symbol: 'mean', tone: 'from-amber-400/30 via-orange-500/14 to-slate-950' },
  { title: 'Equation Gate', subtitle: 'solve with logic', symbol: 'x + 7', tone: 'from-rose-500/30 via-red-400/14 to-slate-950' },
  { title: 'Percent Boost', subtitle: 'change + compare', symbol: '25%', tone: 'from-cyan-400/28 via-blue-500/18 to-slate-950' },
  { title: 'Problem Studio', subtitle: 'model before solve', symbol: '→', tone: 'from-lime-400/25 via-emerald-500/14 to-slate-950' },
  { title: 'Full Score Path', subtitle: 'practice loop', symbol: '100', tone: 'from-purple-500/30 via-blue-500/16 to-slate-950' },
]

const scienceVisualMotifs = [
  { title: 'Matter Lab', subtitle: 'particles + evidence', symbol: 'H2O', tone: 'from-emerald-400/30 via-cyan-400/18 to-slate-950' },
  { title: 'Force Field', subtitle: 'motion + cause', symbol: 'F', tone: 'from-sky-500/32 via-blue-400/18 to-slate-950' },
  { title: 'Energy Core', subtitle: 'systems + transfer', symbol: 'kJ', tone: 'from-amber-400/32 via-orange-500/16 to-slate-950' },
  { title: 'Wave Chamber', subtitle: 'light + sound', symbol: 'λ', tone: 'from-violet-500/34 via-fuchsia-400/16 to-slate-950' },
  { title: 'Earth System', subtitle: 'cycles + change', symbol: 'CO2', tone: 'from-teal-400/30 via-green-500/14 to-slate-950' },
  { title: 'Cell World', subtitle: 'life in detail', symbol: 'DNA', tone: 'from-lime-400/28 via-emerald-400/16 to-slate-950' },
  { title: 'Data Evidence', subtitle: 'claim + reasoning', symbol: 'CER', tone: 'from-blue-400/28 via-cyan-500/14 to-slate-950' },
  { title: 'Design Test', subtitle: 'variables + control', symbol: 'IV', tone: 'from-rose-400/28 via-orange-400/14 to-slate-950' },
  { title: 'Future Lab', subtitle: 'explore + explain', symbol: 'NGSS', tone: 'from-indigo-500/32 via-cyan-400/16 to-slate-950' },
]

function getLessonShortTitle(title: string) {
  return title
    .replace(/^NGSS G[678]\s+Science\s*\d+:\s*/i, '')
    .replace(/^IB G[45]\s+Level\s+\d+\s*\|\s*/i, '')
    .replace(/^Larry Math Class\s*/i, '')
    .slice(0, 42)
}

function courseVisualImages(course: { id: string; courseTrack: string; thumbnailUrl?: string | null }) {
  if (course.id === 'course-ngss-science') {
    return [1, 3, 5, 7, 9, 11, 13, 15, 17].map((number) => `/lesson-covers/ngss-g6/lesson-${String(number).padStart(2, '0')}.jpg`)
  }

  if (course.courseTrack === 'ib-big-math') {
    return [
      course.thumbnailUrl,
      '/course-covers/ib-g4-cover.svg',
      '/course-covers/ib-g5-cover.svg',
      '/course-covers/ib-g6-pyp-cover.svg',
      '/course-covers/ib-g7-pyp-cover.svg',
      '/course-covers/ib-g8-pyp-cover.svg',
    ].filter(Boolean) as string[]
  }

  if (course.courseTrack === 'ngss-science') {
    return [
      course.thumbnailUrl,
      '/course-covers/ngss-g6-cover.svg',
      '/course-covers/ngss-g7-cover.svg',
      '/course-covers/ngss-g8-cover.svg',
      '/course-covers/ngss-science-cover.png',
    ].filter(Boolean) as string[]
  }

  return [course.thumbnailUrl].filter(Boolean) as string[]
}

function buildVisualWallItems(
  course: { id: string; courseTrack: string; thumbnailUrl?: string | null },
  lessons: { title: string }[]
) {
  const images = courseVisualImages(course)
  const motifs = course.courseTrack === 'ngss-science' ? scienceVisualMotifs : ibVisualMotifs
  const lessonTitles = lessons.map((lesson) => getLessonShortTitle(lesson.title)).filter(Boolean)

  return Array.from({ length: 9 }, (_, index) => {
    const motif = motifs[index % motifs.length]
    return {
      image: images[index % images.length] || null,
      title: lessonTitles[index] || motif.title,
      subtitle: motif.subtitle,
      symbol: motif.symbol,
      tone: motif.tone,
    }
  })
}

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
  const visualWallItems = buildVisualWallItems(course, course.lessons)
  const wallCopy = visualWallCopy[locale]

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

              <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-2xl shadow-black/30">
                <div className="flex flex-col gap-2 border-b border-white/10 bg-white/[0.025] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">{wallCopy.label}</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{wallCopy.title}</h2>
                  </div>
                  <p className="max-w-md text-xs font-medium leading-5 text-gray-500 sm:text-right">{wallCopy.subtitle}</p>
                </div>
                <div className="grid aspect-[1.18] min-h-[360px] grid-cols-3 gap-2 bg-black p-2 sm:min-h-[520px] sm:gap-3 sm:p-3">
                  {visualWallItems.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.tone}`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={`${course.title} visual ${index + 1}`}
                          className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="absolute inset-0">
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_38%,rgba(255,255,255,0.08))]" />
                          <div className="absolute right-3 top-3 text-3xl font-black text-white/20 sm:right-5 sm:top-5 sm:text-5xl">
                            {item.symbol}
                          </div>
                          <div className="absolute bottom-3 left-3 h-16 w-16 rounded-full border border-white/15 sm:h-24 sm:w-24" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                        <p className="line-clamp-2 text-sm font-black leading-tight text-white drop-shadow-xl sm:text-base">
                          {item.title}
                        </p>
                        <p className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.18em] text-white/50 sm:block">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
