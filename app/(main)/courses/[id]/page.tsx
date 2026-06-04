import PurchaseCourseButton from '@/components/courses/PurchaseCourseButton'
import { authOptions } from '@/lib/auth'
import { resolveCourseAccess } from '@/lib/course-access'
import type { Locale } from '@/lib/i18n'
import { getPeerLearningCount } from '@/lib/peer-learning'
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
    title: 'Fantastic Learning Journey',
    subtitle: 'Every tile hints at a lesson, a practice moment, or a discovery.',
  },
} satisfies Record<Locale, Record<string, string>>

const ibVisualMotifs = [
  { title: 'Place Value', subtitle: 'model the number', symbol: '4,820', sketch: 'place-value', accent: 'bg-sky-500' },
  { title: 'Fractions', subtitle: 'part to whole', symbol: '3/8', sketch: 'fraction', accent: 'bg-violet-500' },
  { title: 'Ratios', subtitle: 'compare and scale', symbol: '5:8', sketch: 'ratio', accent: 'bg-emerald-500' },
  { title: 'Geometry', subtitle: 'see the structure', symbol: 'A = lw', sketch: 'geometry', accent: 'bg-blue-500' },
  { title: 'Data', subtitle: 'patterns and proof', symbol: 'mean', sketch: 'data', accent: 'bg-amber-500' },
  { title: 'Equations', subtitle: 'solve with logic', symbol: 'x + 7', sketch: 'algebra', accent: 'bg-rose-500' },
  { title: 'Percent', subtitle: 'change and compare', symbol: '25%', sketch: 'ratio', accent: 'bg-cyan-500' },
  { title: 'Graphs', subtitle: 'relationships', symbol: 'y = 2x', sketch: 'graph', accent: 'bg-lime-500' },
  { title: 'Number Line', subtitle: 'direction and distance', symbol: '-3', sketch: 'number-line', accent: 'bg-purple-500' },
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
    .replace(/^IB Big Math G[678]\s*\(PYP\)\s*/i, '')
    .replace(/^Larry Math Class\s*/i, '')
    .slice(0, 42)
}

function getMathVisualMotif(title: string, index: number) {
  const text = title.toLowerCase()
  if (text.includes('fraction')) return { ...ibVisualMotifs[1], symbol: '3/8' }
  if (text.includes('ratio') || text.includes('rate') || text.includes('percent') || text.includes('scale')) return { ...ibVisualMotifs[2], symbol: text.includes('percent') ? '25%' : '5:8' }
  if (text.includes('area') || text.includes('volume') || text.includes('figure') || text.includes('angle') || text.includes('triangle') || text.includes('circle') || text.includes('geometry')) return ibVisualMotifs[3]
  if (text.includes('data') || text.includes('graph') || text.includes('mean') || text.includes('median') || text.includes('probability') || text.includes('statistical')) return { ...ibVisualMotifs[4], sketch: text.includes('graph') ? 'graph' : 'data' }
  if (text.includes('variable') || text.includes('expression') || text.includes('equation') || text.includes('inequal') || text.includes('formula')) return ibVisualMotifs[5]
  if (text.includes('integer') || text.includes('negative') || text.includes('number line')) return ibVisualMotifs[8]
  if (text.includes('decimal') || text.includes('place value') || text.includes('rounding') || text.includes('million')) return ibVisualMotifs[0]
  if (text.includes('coordinate') || text.includes('linear') || text.includes('relationship') || text.includes('function')) return ibVisualMotifs[7]
  if (text.includes('factor') || text.includes('multiple') || text.includes('prime')) return { ...ibVisualMotifs[5], symbol: '12 = 3 x 4' }
  return ibVisualMotifs[index % ibVisualMotifs.length]
}

function courseVisualImages(course: { id: string; courseTrack: string; thumbnailUrl?: string | null }) {
  if (course.id === 'course-ngss-science') {
    return [1, 3, 5, 7, 9, 11, 13, 15, 17].map((number) => `/lesson-covers/ngss-g6/lesson-${String(number).padStart(2, '0')}.jpg`)
  }

  if (course.courseTrack === 'ib-big-math') {
    return []
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
    const title = lessonTitles[index] || ''
    const motif = course.courseTrack === 'ib-big-math' ? getMathVisualMotif(title, index) : motifs[index % motifs.length]
    return {
      image: images[index % images.length] || null,
      title: title || motif.title,
      subtitle: motif.subtitle,
      symbol: motif.symbol,
      tone: 'tone' in motif ? motif.tone : 'from-slate-900 via-slate-800 to-black',
      sketch: 'sketch' in motif ? motif.sketch : 'poster',
      accent: 'accent' in motif ? motif.accent : 'bg-blue-400',
    }
  })
}

function MathVisualPanel({
  item,
  index,
}: {
  item: { title: string; subtitle: string; symbol: string; sketch: string; accent: string }
  index: number
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f6f2e8] text-slate-950">
      <div className="absolute inset-0 opacity-[0.42] [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${item.accent}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">IB Big Math</span>
      </div>
      <div className="absolute right-4 top-4 rounded-full border border-slate-300 bg-white/75 px-3 py-1 text-[10px] font-black text-slate-500">
        Scene {index + 1}
      </div>

      <div className="absolute inset-x-4 top-11 h-14 rounded-2xl border border-slate-200 bg-white/70 shadow-sm sm:inset-x-5 sm:h-16">
        {item.sketch === 'fraction' && (
          <div className="flex h-full items-center justify-center gap-2">
            {Array.from({ length: 8 }).map((_, part) => (
              <span key={part} className={`h-8 w-4 rounded-md border border-slate-300 sm:h-10 sm:w-5 ${part < 3 ? 'bg-violet-400' : 'bg-white'}`} />
            ))}
          </div>
        )}
        {item.sketch === 'ratio' && (
          <div className="flex h-full items-end justify-center gap-3 pb-3 sm:gap-4">
            <span className="h-7 w-11 rounded-t-xl bg-emerald-400 sm:h-8 sm:w-12" />
            <span className="h-10 w-11 rounded-t-xl bg-cyan-400 sm:h-12 sm:w-12" />
            <span className="absolute top-2 text-xl font-black text-slate-700 sm:text-2xl">{item.symbol}</span>
          </div>
        )}
        {item.sketch === 'geometry' && (
          <div className="flex h-full items-center justify-center">
            <div className="h-10 w-20 rotate-[-8deg] rounded-xl border-4 border-blue-400 bg-blue-100/70 sm:h-12 sm:w-24" />
            <span className="absolute text-base font-black text-slate-700 sm:text-xl">{item.symbol}</span>
          </div>
        )}
        {item.sketch === 'data' && (
          <div className="flex h-full items-end justify-center gap-2 pb-4 sm:gap-3">
            {[38, 70, 52, 88, 63].map((height, barIndex) => (
              <span key={barIndex} className="w-5 rounded-t-lg bg-amber-400 sm:w-6" style={{ height: Math.round(height * 0.48) }} />
            ))}
          </div>
        )}
        {item.sketch === 'algebra' && (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-xl bg-slate-950 px-3 py-1.5 text-base font-black text-white shadow-xl sm:text-xl">{item.symbol}</div>
          </div>
        )}
        {item.sketch === 'graph' && (
          <div className="absolute inset-6">
            <div className="absolute bottom-0 left-0 h-px w-full bg-slate-400" />
            <div className="absolute bottom-0 left-0 h-full w-px bg-slate-400" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 84" aria-hidden="true">
              <polyline points="8,70 42,54 78,38 116,25 152,12" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="42" cy="54" r="5" fill="#0f172a" />
              <circle cx="116" cy="25" r="5" fill="#0f172a" />
            </svg>
          </div>
        )}
        {item.sketch === 'number-line' && (
          <div className="absolute inset-x-7 top-1/2">
            <div className="h-1 rounded-full bg-slate-700" />
            {[-3, -2, -1, 0, 1, 2, 3].map((tick, tickIndex) => (
              <span key={tick} className="absolute -top-2 h-5 w-px bg-slate-700" style={{ left: `${tickIndex * 16.6}%` }}>
                <span className="absolute -bottom-7 -translate-x-1/2 text-xs font-black text-slate-500">{tick}</span>
              </span>
            ))}
          </div>
        )}
        {item.sketch === 'place-value' && (
          <div className="grid h-full grid-cols-4 gap-1.5 p-2 sm:gap-2">
            {['1,000', '100', '10', '1'].map((label, labelIndex) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-1 text-center">
                <div className="text-sm font-black text-slate-800 sm:text-base">{labelIndex === 0 ? '4' : labelIndex === 1 ? '8' : labelIndex === 2 ? '2' : '0'}</div>
                <div className="text-[7px] font-black uppercase tracking-widest text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-200/70 sm:inset-x-5">
        <p className="line-clamp-2 text-sm font-black leading-tight text-slate-950 sm:text-base">{item.title}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.subtitle}</p>
      </div>
    </div>
  )
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
  const startedLearners = getPeerLearningCount(course.id, course.viewCount)
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
                      ) : course.courseTrack === 'ib-big-math' ? (
                        <MathVisualPanel item={item} index={index} />
                      ) : (
                        <div className="absolute inset-0">
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_38%,rgba(255,255,255,0.08))]" />
                          <div className="absolute right-3 top-3 text-3xl font-black text-white/20 sm:right-5 sm:top-5 sm:text-5xl">
                            {item.symbol}
                          </div>
                          <div className="absolute bottom-3 left-3 h-16 w-16 rounded-full border border-white/15 sm:h-24 sm:w-24" />
                        </div>
                      )}
                      {course.courseTrack !== 'ib-big-math' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                            <p className="line-clamp-2 text-sm font-black leading-tight text-white drop-shadow-xl sm:text-base">
                              {item.title}
                            </p>
                            <p className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.18em] text-white/50 sm:block">
                              {item.subtitle}
                            </p>
                          </div>
                        </>
                      )}
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
                          <span>{getPeerLearningCount(lesson.id, lesson.viewCount)} {copy.visits}</span>
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
