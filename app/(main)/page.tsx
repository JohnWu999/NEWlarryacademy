'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type Locale = 'zh' | 'en'

type CourseShowcase = {
  id: string
  href: string
  image: string
  tone: string
  glow: string
  stats: {
    lessons: string
    questions: string
  }
  copy: Record<Locale, {
    title: string
    eyebrow: string
    line: string
    detail: string
    preview: string
    cta: string
  }>
}

const homeCopy: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  allCourses: string
  heroKicker: string
  lessons: string
  questions: string
  preview: string
  browse: string
  readyTitle: string
  readySubtitle: string
  statCourses: string
  statLessons: string
  statQuestions: string
  statPreview: string
}> = {
  zh: {
    eyebrow: '面向 AI 时代的学习平台',
    title: '从免费试学开始，进入真正有生命力的课程',
    subtitle: 'Larry Academy 把学生自创精神、AI 技术、视频讲解和游戏化练习放在一起，让孩子从第一节课就能看见目标、马上练习、持续进步。',
    allCourses: '查看全部课程',
    heroKicker: '正在开放',
    lessons: '课节',
    questions: '题目',
    preview: '免费试学',
    browse: '切换课程焦点',
    readyTitle: '现有课程都可以马上进入',
    readySubtitle: '付费课程也开放前几节免费试学；孩子先体验视频和练习节奏，再决定是否解锁完整路径。',
    statCourses: '课程入口',
    statLessons: '视频课节',
    statQuestions: '互动题目',
    statPreview: '免费试学',
  },
  en: {
    eyebrow: 'Built for the AI generation',
    title: 'Start with a free preview. Keep going with courses that feel alive.',
    subtitle: 'Larry Academy blends student-built ambition, AI-powered learning, video lessons, and game-like practice so learners can see the path, try the work, and build momentum from lesson one.',
    allCourses: 'View all courses',
    heroKicker: 'Now available',
    lessons: 'Lessons',
    questions: 'Questions',
    preview: 'Free preview',
    browse: 'Switch course focus',
    readyTitle: 'Ready-to-learn courses',
    readySubtitle: 'Even paid courses include free preview lessons, so students can try the video-plus-practice flow before unlocking the full path.',
    statCourses: 'Course paths',
    statLessons: 'Video lessons',
    statQuestions: 'Practice questions',
    statPreview: 'Free previews',
  },
}

const showcaseCourses: CourseShowcase[] = [
  {
    id: 'ib-g4',
    href: '/courses/course-ib-pyp-g4',
    image: '/course-covers/ib-g4-cover.svg',
    tone: 'from-cyan-300 via-blue-400 to-indigo-500',
    glow: 'rgba(56, 189, 248, 0.28)',
    stats: { lessons: '40', questions: '800' },
    copy: {
      zh: {
        title: 'IB Big Math G4',
        eyebrow: '基础打牢',
        line: '40 节系统数学训练，从数感、模型到表达一步步铺稳。',
        detail: '适合希望提前建立 IB 数学核心能力的学生，视频后紧接练习，学完就能练透。',
        preview: '前 3 课免费试学',
        cta: '开始免费试学',
      },
      en: {
        title: 'IB Big Math G4',
        eyebrow: 'Foundation quest',
        line: '40 structured lessons that build number sense, models, and clear math expression.',
        detail: 'Made for students who want a strong IB math base before the pace gets fast.',
        preview: 'First 3 lessons free',
        cta: 'Start free preview',
      },
    },
  },
  {
    id: 'ib-g5',
    href: '/courses/course-ib-pyp-g5-math',
    image: '/course-covers/ib-g5-cover.svg',
    tone: 'from-violet-300 via-fuchsia-400 to-cyan-300',
    glow: 'rgba(168, 85, 247, 0.3)',
    stats: { lessons: '40', questions: '800' },
    copy: {
      zh: {
        title: 'IB Big Math G5',
        eyebrow: '冲满分基础',
        line: '把 IB 没有官方教材的空白，变成可视化、可练习的核心学习路径。',
        detail: '围绕经典概念、应用题和推理表达设计，是预习、复习和查漏补缺的学习伴侣。',
        preview: '前 3 课免费试学',
        cta: '进入 G5 试学',
      },
      en: {
        title: 'IB Big Math G5',
        eyebrow: 'Full-score foundation',
        line: 'A visible core path for IB math where official textbooks often leave gaps.',
        detail: 'Classic concepts, word problems, and reasoning practice for preview, review, and confidence.',
        preview: 'First 3 lessons free',
        cta: 'Try G5 free',
      },
    },
  },
  {
    id: 'ngss-g6',
    href: '/courses/course-ngss-science',
    image: '/lesson-covers/ngss-g6/lesson-11.jpg',
    tone: 'from-emerald-300 via-teal-400 to-sky-400',
    glow: 'rgba(45, 212, 191, 0.24)',
    stats: { lessons: '20', questions: '200' },
    copy: {
      zh: {
        title: 'NGSS Science G6',
        eyebrow: '现象驱动科学',
        line: '从问题、证据、模型到解释，带孩子像科学家一样思考。',
        detail: '覆盖物质、能量、力、波、地球系统和生态系统，每集都有互动练习。',
        preview: '可免费试看',
        cta: '探索 G6 科学',
      },
      en: {
        title: 'NGSS Science G6',
        eyebrow: 'Phenomena first',
        line: 'Students move from questions and evidence to models and explanations.',
        detail: 'Matter, energy, forces, waves, Earth systems, and ecosystems with practice in every lesson.',
        preview: 'Free lessons available',
        cta: 'Explore G6 science',
      },
    },
  },
  {
    id: 'ngss-g7',
    href: '/courses/course-ngss-science-g7',
    image: '/lesson-covers/ngss-g7/lesson-03.jpg',
    tone: 'from-lime-300 via-emerald-400 to-violet-400',
    glow: 'rgba(132, 204, 22, 0.22)',
    stats: { lessons: '20', questions: '200' },
    copy: {
      zh: {
        title: 'NGSS Science G7',
        eyebrow: '生命科学进阶',
        line: '细胞、系统、遗传、适应和波动，把抽象科学变成清晰模型。',
        detail: '每一课都配套练习与开放思考题，帮助学生把证据讲清楚。',
        preview: '可免费试看',
        cta: '进入 G7 科学',
      },
      en: {
        title: 'NGSS Science G7',
        eyebrow: 'Life science upgrade',
        line: 'Cells, systems, heredity, adaptation, and waves become clear, usable models.',
        detail: 'Practice plus open-response reflection helps students explain evidence with confidence.',
        preview: 'Free lessons available',
        cta: 'Enter G7 science',
      },
    },
  },
  {
    id: 'larry-math',
    href: '/courses?category=larry-math',
    image: '/about/larry-cafe.jpg',
    tone: 'from-amber-200 via-orange-300 to-sky-300',
    glow: 'rgba(251, 191, 36, 0.24)',
    stats: { lessons: '100+', questions: '100+' },
    copy: {
      zh: {
        title: 'Larry Math',
        eyebrow: '同龄人带你学',
        line: 'Larry 从 6 岁开始录数学小讲师，跟同龄人学数学更轻松、更有动力。',
        detail: '按年级和知识点整理的视频库，适合孩子用自己的节奏补基础、练思维。',
        preview: '可免费试看',
        cta: '打开 Larry Math',
      },
      en: {
        title: 'Larry Math',
        eyebrow: 'Peer-led math',
        line: 'Larry started teaching math on video at age six. Learning from a peer makes math feel possible.',
        detail: 'A growing video library organized by grade and skill so students can practice at their own pace.',
        preview: 'Free previews available',
        cta: 'Open Larry Math',
      },
    },
  },
]

export default function HomePage() {
  const { locale, t } = useLanguage()
  const activeLocale: Locale = locale === 'zh' ? 'zh' : 'en'
  const copy = homeCopy[activeLocale]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseCourses.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [])

  const activeCourse = showcaseCourses[activeIndex]
  const activeCopy = activeCourse.copy[activeLocale]

  const totalStats = useMemo(() => ({
    lessons: '220+',
    questions: '1800+',
    courses: showcaseCourses.length.toString(),
  }), [])

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(14,23,45,0.92)_0%,rgba(5,5,5,1)_42%,rgba(16,8,25,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_0%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(20,184,166,0.1),transparent_26%)]" />

      <section className="relative px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32 lg:pb-20 lg:pt-36">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-sky-300">
              {copy.eyebrow}
            </div>

            <h1 className="text-[clamp(2.2rem,6.4vw,6.25rem)] font-black leading-[0.95] tracking-normal text-white">
              {copy.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:text-xl">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={activeCourse.href}
                className="group inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-6 text-base font-black text-black transition hover:-translate-y-0.5 hover:bg-sky-100"
              >
                {activeCopy.cta}
                <span className="ml-3 transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-6 text-base font-bold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                {copy.allCourses}
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black">{totalStats.courses}</div>
                <div className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.24em] text-slate-500">Courses</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black">{totalStats.lessons}</div>
                <div className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.24em] text-slate-500">{copy.lessons}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black">{totalStats.questions}</div>
                <div className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.24em] text-slate-500">{copy.questions}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-4 rounded-[2rem] opacity-40 blur-3xl"
              style={{ background: activeCourse.glow }}
            />
            <Link
              href={activeCourse.href}
              className="group relative block overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04] shadow-2xl shadow-black/40"
              aria-label={activeCopy.title}
            >
              <div className="relative aspect-[16/10] min-h-[320px] overflow-hidden">
                <Image
                  src={activeCourse.image}
                  alt={activeCopy.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/36 to-black/14" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/45 to-transparent" />
                <div className={`absolute left-6 top-6 rounded-full bg-gradient-to-r ${activeCourse.tone} px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-black shadow-lg`}>
                  {activeCopy.preview}
                </div>
                <div className="absolute bottom-7 left-6 right-6 max-w-2xl">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-sky-200">
                    {copy.heroKicker}
                  </div>
                  <h2 className="text-4xl font-black leading-none tracking-normal sm:text-5xl lg:text-6xl">
                    {activeCopy.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                    {activeCopy.line}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="rounded-full border border-white/14 bg-black/35 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                      {activeCourse.stats.lessons} {copy.lessons}
                    </span>
                    <span className="rounded-full border border-white/14 bg-black/35 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                      {activeCourse.stats.questions} {copy.questions}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-8 w-full max-w-7xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">{copy.browse}</div>
            <div className="hidden h-px flex-1 bg-white/10 sm:block" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {showcaseCourses.map((course, index) => {
              const courseCopy = course.copy[activeLocale]
              const isActive = index === activeIndex

              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`group overflow-hidden rounded-3xl border text-left transition ${
                    isActive
                      ? 'border-sky-300/70 bg-white/[0.08] shadow-lg shadow-sky-500/10'
                      : 'border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={course.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className={`mb-2 inline-flex rounded-full bg-gradient-to-r ${course.tone} px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-black`}>
                        {courseCopy.preview}
                      </div>
                      <h3 className="line-clamp-2 text-xl font-black leading-tight text-white">{courseCopy.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 min-h-12 text-sm leading-6 text-slate-400">{courseCopy.detail}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-sky-300">{copy.preview}</div>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal text-white sm:text-5xl">
              {copy.readyTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              {copy.readySubtitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {showcaseCourses.slice(0, 4).map((course) => {
              const courseCopy = course.copy[activeLocale]

              return (
                <Link
                  key={course.id}
                  href={course.href}
                  className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="relative h-20 w-28 flex-none overflow-hidden rounded-2xl">
                    <Image
                      src={course.image}
                      alt={courseCopy.title}
                      fill
                      sizes="112px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">{courseCopy.eyebrow}</div>
                    <div className="mt-1 truncate text-lg font-black text-white">{courseCopy.title}</div>
                    <div className="mt-1 text-sm font-bold text-slate-400">{courseCopy.preview}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-500/12 to-purple-600/12 p-6 text-center backdrop-blur-3xl sm:p-10 lg:rounded-[40px] lg:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl font-black text-white">
            10c
          </div>
          <h3 className="text-xl font-black text-white sm:text-2xl lg:text-3xl">{t('home.charity.title')}</h3>
          <p className="mx-auto mt-4 max-w-2xl text-base font-light leading-relaxed text-slate-300 sm:text-lg lg:text-xl">
            {t('home.charity.desc')}
          </p>
        </div>
      </section>

      <section className="relative px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-4 text-center md:grid-cols-4 sm:gap-8 lg:gap-12">
          <div>
            <div className="mb-1 text-3xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">5</div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">{copy.statCourses}</div>
          </div>
          <div>
            <div className="mb-1 text-3xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">220+</div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-purple-400">{copy.statLessons}</div>
          </div>
          <div>
            <div className="mb-1 text-3xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">1800+</div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-400">{copy.statQuestions}</div>
          </div>
          <div>
            <div className="mb-1 text-3xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">3+</div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">{copy.statPreview}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
