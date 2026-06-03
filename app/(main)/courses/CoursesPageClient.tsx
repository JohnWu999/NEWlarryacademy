'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

type CourseListItem = {
  id: string
  title: string
  description: string
  status: string
  accessLevel: string
  isFree: boolean
  price: number
  courseTrack: string
  thumbnailUrl: string | null
  viewCount: number
  lessonCount: number
  questionCount: number
}

type TrackCopy = {
  title: string
  eyebrow: string
  accent: string
  description: string
  cardCopy: string
}

const trackOrder = ['larry-math', 'ib-big-math', 'ngss-science', 'other']

const trackCopy: Record<'zh' | 'en', Record<string, TrackCopy>> = {
  zh: {
    'larry-math': {
      title: 'Larry Math',
      eyebrow: 'Larry 讲课 + Practice + 小游戏',
      accent: 'from-blue-500/25 to-cyan-400/15',
      description: 'Larry Math 围绕 Larry 的讲解视频、技能刷题、Practice 和小游戏组织，让孩子在同龄人的讲解中建立更有信心的数学思维。',
      cardCopy: '和同龄小讲师一起学数学：Larry 讲解、循环练习和小游戏，让数学不再孤单。',
    },
    'ib-big-math': {
      title: 'IB Big Math',
      eyebrow: '视频 + 互动答题 + 每节课小游戏',
      accent: 'from-violet-500/25 to-fuchsia-400/15',
      description: 'IB 数学没有统一官方核心教材。Larry Academy 把最经典、最重要的概念整理成系统的视频与练习学习伴侣，帮助学生预习、复习，并清楚看到自己的数学进度。',
      cardCopy: 'IB 数学核心学习伴侣：经典概念、可视化进度、视频支持和系统练习，补上教材缺口。',
    },
    'ngss-science': {
      title: 'NGSS Science',
      eyebrow: '科学探究 + 实验模拟 + 游戏化练习',
      accent: 'from-emerald-500/25 to-teal-400/15',
      description: 'NGSS Science 是纯科学课程线，围绕科学现象、探究练习、证据推理、开放式反思，以及未来的实验模拟来组织。',
      cardCopy: '围绕真实科学思维设计：现象、证据、反思和多样化练习。',
    },
    other: {
      title: 'Future Courses',
      eyebrow: '课程介绍已开放，内容陆续上线',
      accent: 'from-slate-500/25 to-indigo-400/15',
      description: '这些未来方向会先保留精美介绍，等课程内容准备好后再正式开放学习。',
      cardCopy: '未来课程方向先以精美介绍呈现，完整内容准备好后再开放。',
    },
  },
  en: {
    'larry-math': {
      title: 'Larry Math',
      eyebrow: 'Larry lessons + Practice + Games',
      accent: 'from-blue-500/25 to-cyan-400/15',
      description: 'Larry Math focuses on Larry video lessons, skill drills, Practice, and small games that help students build confident math thinking.',
      cardCopy: 'Learn with a peer teacher: Larry explanations, practice loops, and games that make math less lonely.',
    },
    'ib-big-math': {
      title: 'IB Big Math',
      eyebrow: 'Video + Interactive Questions + Games',
      accent: 'from-violet-500/25 to-fuchsia-400/15',
      description: 'IB Math does not come with one official core textbook. Larry Academy turns the most essential IB concepts into a systematic video-and-practice companion, so students can preview, review, and see exactly where their math understanding stands.',
      cardCopy: 'A core IB Math companion: classic concepts, visual progress, video support, and practice where the textbook is missing.',
    },
    'ngss-science': {
      title: 'NGSS Science',
      eyebrow: 'Inquiry + Simulations + Practice',
      accent: 'from-emerald-500/25 to-teal-400/15',
      description: 'NGSS Science is a science-only learning track with phenomenon-based videos, inquiry practice, evidence reasoning, open-response reflection, and future lab-style simulations.',
      cardCopy: 'Phenomena, evidence, reflection, and practice designed around real scientific thinking.',
    },
    other: {
      title: 'Future Courses',
      eyebrow: 'Introductions open, lessons coming soon',
      accent: 'from-slate-500/25 to-indigo-400/15',
      description: 'These future course areas are being shaped into polished introductions first, with full lessons opening when the content is ready.',
      cardCopy: 'Future directions are introduced beautifully first, then opened when lessons are ready.',
    },
  },
}

const courseDescriptionOverrides: Record<'zh' | 'en', Record<string, string>> = {
  zh: {
    'course-ib-pyp-g4': '完整的 40 节 IB G4 数学路径，配套视频课、技能刷题、反思题、学习进度和游戏化奖励，帮助孩子把基础打牢。',
    'course-ib-pyp-g5-math': '面向 G5 的 IB 数学核心学习伴侣：视频讲解、概念检查和游戏化练习共同支持预习、复习和满分基础。',
    'course-ib-big-math': 'G6 进入 IB 数学风格的重要桥梁：分数、比例、小数、几何、数据和应用题都会被拆成清楚的视觉模型与日常练习，让学生不只是会做题，也理解为什么。',
    'course-ib-big-math-g7-pyp': 'G7 数学推理进阶路径：代数规律、比例关系、概率统计、面积体积和多步问题被组织成系统的 IB 数学学习伴侣。',
    'course-ib-big-math-g8-pyp': 'G8 高阶数学启动器：方程、函数、坐标几何、图形变换、概率和证明式推理相互连接，为之后更高阶的 IB 数学建立有条理的基础。',
    'course-ngss-science': '围绕 NGSS 标准设计的科学探究课程，包含现象视频、证据推理、开放式表达和多样练习，让科学学习更像真正的探索。',
  },
  en: {},
}

function localizedDescription(course: CourseListItem, locale: 'zh' | 'en') {
  return courseDescriptionOverrides[locale][course.id] || course.description
}

function accessLabel(course: CourseListItem, locale: 'zh' | 'en') {
  if (course.status === 'coming-soon') return locale === 'zh' ? '即将开放' : 'Coming Soon'
  if (course.accessLevel === 'registered') return locale === 'zh' ? '注册可学' : 'Register to Learn'
  if (course.isFree || course.price <= 0 || course.accessLevel === 'public') return locale === 'zh' ? '公开免费' : 'Free'
  return locale === 'zh' ? `付费课程 ¥${course.price}` : `Paid Course ¥${course.price}`
}

function accessTone(course: CourseListItem) {
  if (course.status === 'coming-soon') return 'bg-white/10 text-white/70 ring-white/10'
  if (course.accessLevel === 'registered') return 'bg-cyan-300 text-[#05131d] ring-cyan-100/50'
  if (course.isFree || course.price <= 0 || course.accessLevel === 'public') return 'bg-emerald-300 text-[#04140f] ring-emerald-100/50'
  return 'bg-amber-300 text-[#1c1003] ring-amber-100/50'
}

export default function CoursesPageClient({
  selectedTrackKey,
  courses,
  totalLessonCount,
  totalQuestionCount,
}: {
  selectedTrackKey: string | null
  courses: CourseListItem[]
  totalLessonCount: number
  totalQuestionCount: number
}) {
  const { locale } = useLanguage()
  const copy = trackCopy[locale]
  const selectedTrack = selectedTrackKey ? copy[selectedTrackKey] : null
  const tracks = trackOrder
    .map((track) => ({
      key: track,
      ...copy[track],
      courses: courses.filter((course) => (course.courseTrack || 'other') === track),
    }))
    .filter((track) => !selectedTrackKey || track.key === selectedTrackKey)

  const labels = locale === 'zh'
    ? {
        eyebrow: '课程',
        allTitle: '三大主课程体系',
        backAll: '查看全部课程体系',
        intro: 'Larry Academy 目前以 Larry Math、IB Big Math、NGSS Science 为主线。每门主课都会围绕视频、互动答题、Practice 和小游戏来组织；其他方向先保留精美介绍，等内容准备好再开放学习。',
        courses: '课程',
        lessons: '课节',
        questions: '题目',
        visits: '访问',
        units: '个课程单元',
        ready: '可以开始',
        preview: '预览开放',
        explore: '探索课程',
        empty: '这一组课程正在整理中，当前只保留入口结构。',
      }
    : {
        eyebrow: 'Courses',
        allTitle: 'Three Core Course Tracks',
        backAll: 'View all course tracks',
        intro: 'Larry Academy currently centers on Larry Math, IB Big Math, and NGSS Science. Each major track is organized around video, interactive questions, Practice, and small games; future directions stay as polished introductions until lessons are ready.',
        courses: 'Courses',
        lessons: 'Lessons',
        questions: 'Questions',
        visits: 'Visits',
        units: 'course units',
        ready: 'Ready to learn',
        preview: 'Preview only',
        explore: 'Explore Course',
        empty: 'This course group is being organized; for now, the entry structure is ready.',
      }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[34rem] w-[34rem] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute -right-32 top-28 h-[36rem] w-[36rem] rounded-full bg-violet-500/12 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-400/8 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-4xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-blue-300">{labels.eyebrow}</p>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              {selectedTrack ? (locale === 'zh' ? `${selectedTrack.title} 课程` : `${selectedTrack.title} Courses`) : labels.allTitle}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-gray-300">
              {selectedTrackKey ? copy[selectedTrackKey].description : labels.intro}
            </p>
            {selectedTrackKey && (
              <Link href="/courses" className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/75 transition hover:border-white/25 hover:text-white">
                {labels.backAll}
              </Link>
            )}
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="text-2xl font-black">{courses.length}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{labels.courses}</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="text-2xl font-black">{totalLessonCount}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{labels.lessons}</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="text-2xl font-black">{totalQuestionCount}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{labels.questions}</div>
              </div>
            </div>
          </div>
        </div>

        {!selectedTrackKey && (
          <div className="grid gap-5 md:grid-cols-3">
            {tracks.slice(0, 3).map((track) => (
              <a
                key={track.key}
                href={`#${track.key}`}
                className={`rounded-3xl border border-white/10 bg-gradient-to-br ${track.accent} p-6 transition hover:border-white/25 hover:bg-white/[0.04]`}
              >
                <p className="text-sm font-bold text-gray-400">{track.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-black">{track.title}</h2>
                <p className="mt-3 min-h-12 text-sm leading-6 text-gray-300">{track.cardCopy}</p>
                <p className="mt-5 text-sm font-bold text-white/60">
                  {track.courses.length} {labels.units}
                </p>
              </a>
            ))}
          </div>
        )}

        <div className="mt-14 space-y-14">
          {tracks.map((track) => (
            <section key={track.key} id={track.key}>
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold text-blue-300">{track.eyebrow}</p>
                  <h2 className="mt-2 text-3xl font-black">{track.title}</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-400">
                  {track.courses.length} {labels.courses}
                </span>
              </div>

              {track.courses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {track.courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#0d0d0d]"
                    >
                      <div className={`relative aspect-[1.72] overflow-hidden bg-gradient-to-br ${track.accent}`}>
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={`${course.title} cover`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                          />
                        ) : (
                          <div className="absolute inset-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/35 via-fuchsia-500/10 to-blue-500/15" />
                            <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-white/15" />
                            <div className="absolute bottom-10 left-8 h-20 w-40 rounded-full border border-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/8 to-black/10" />
                        <div className={`absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-black shadow-lg ring-1 ${accessTone(course)}`}>
                          {accessLabel(course, locale)}
                        </div>
                        <div className="absolute bottom-5 left-5 right-5">
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
                            {track.title}
                          </p>
                          <h3 className="mt-2 text-2xl font-black leading-tight drop-shadow-2xl">{course.title}</h3>
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="line-clamp-3 min-h-20 text-[15px] leading-7 text-gray-300">
                          {localizedDescription(course, locale)}
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                          <div className="rounded-2xl bg-white/[0.055] p-3">
                            <div className="text-lg font-black text-white">{course.lessonCount}</div>
                            {labels.lessons}
                          </div>
                          <div className="rounded-2xl bg-white/[0.055] p-3">
                            <div className="text-lg font-black text-white">{course.questionCount}</div>
                            {labels.questions}
                          </div>
                          <div className="rounded-2xl bg-white/[0.055] p-3">
                            <div className="text-lg font-black text-white">{course.viewCount}</div>
                            {labels.visits}
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                            {course.lessonCount > 0 ? labels.ready : labels.preview}
                          </span>
                          <span className="text-sm font-black text-blue-300 transition group-hover:text-blue-200">
                            {labels.explore} →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-gray-400">
                  {labels.empty}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
