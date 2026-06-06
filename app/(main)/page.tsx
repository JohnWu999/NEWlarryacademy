'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
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
  watchIntro: string
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
  featureKicker: string
  features: Array<{
    title: string
    desc: string
  }>
}> = {
  zh: {
    eyebrow: 'Learn with AI. Grow together.',
    title: '未来学习，\n学生创造',
    subtitle: 'AI 赋能的视频课程、同龄人创造的学习路径、每节课即时练习，让复杂知识变清楚、变好玩，也真正学得进去。',
    allCourses: '查看全部课程',
    watchIntro: '了解 Larry',
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
    featureKicker: 'Powerful learning experience',
    features: [
      { title: 'AI 赋能学习', desc: '更聪明的解释、提示和练习反馈。' },
      { title: '同龄人创造课程', desc: '由学生出发，为学生设计。' },
      { title: '边学边练', desc: '视频后马上进入互动练习和游戏。' },
      { title: '看见成长', desc: '记录进度、奖励和每一次突破。' },
    ],
  },
  en: {
    eyebrow: 'Learn with AI. Grow together.',
    title: 'Future learning,\nbuilt by students.',
    subtitle: 'AI-powered lessons and peer-created courses that make complex topics clear, engaging, and ready for the future.',
    allCourses: 'View all courses',
    watchIntro: 'Watch intro',
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
    featureKicker: 'Powerful learning experience',
    features: [
      { title: 'AI-Powered Learning', desc: 'Smart explanations and instant support.' },
      { title: 'Peer-Created Courses', desc: 'Built by students, for students.' },
      { title: 'Learn by Doing', desc: 'Videos flow into practice and games.' },
      { title: 'Track Your Growth', desc: 'See progress, rewards, and momentum.' },
    ],
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

function FeatureIcon({ index }: { index: number }) {
  const icons = [
    (
      <path
        key="ai"
        d="M8 7h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm2 10v3m4-3v3M9 4v3m6-3v3M4 10H2m2 4H2m20-4h-2m2 4h-2m-9-4-1.4 4h1.1l.25-.85h1.55l.25.85h1.12L12.45 10H11Zm.18 2.35L12 11.18l.35 1.17h-.7Zm3.1 1.65v-4h1.05v4h-1.05Z"
      />
    ),
    (
      <path
        key="peer"
        d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0"
      />
    ),
    (
      <path
        key="game"
        d="M7 9h10a4 4 0 0 1 3.7 2.5l.8 2a3 3 0 0 1-5.05 3.05L15 15H9l-1.45 1.55A3 3 0 0 1 2.5 13.5l.8-2A4 4 0 0 1 7 9Zm1 2v4m-2-2h4m7-1h.01M15 15h.01"
      />
    ),
    (
      <path
        key="growth"
        d="M5 19V9m7 10V5m7 14v-7M3 19h18"
      />
    ),
  ]

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[index] ?? icons[0]}
    </svg>
  )
}

export default function HomePage() {
  const { locale, t } = useLanguage()
  const activeLocale: Locale = locale === 'zh' ? 'zh' : 'en'
  const copy = homeCopy[activeLocale]
  const [activeIndex, setActiveIndex] = useState(2)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseCourses.length)
    }, 6200)

    return () => window.clearInterval(timer)
  }, [])

  const activeCourse = showcaseCourses[activeIndex]

  const goToPreviousCourse = () => {
    setActiveIndex((current) => (current - 1 + showcaseCourses.length) % showcaseCourses.length)
  }

  const goToNextCourse = () => {
    setActiveIndex((current) => (current + 1) % showcaseCourses.length)
  }

  const getCourseOffset = (index: number) => {
    const length = showcaseCourses.length
    const half = Math.floor(length / 2)
    return ((index - activeIndex + length + half) % length) - half
  }

  const getDesktopCardStyle = (offset: number) => {
    const absOffset = Math.abs(offset)
    const translate = offset * 164
    const rotate = offset * -8
    const scale = offset === 0 ? 1 : absOffset === 1 ? 0.9 : 0.78
    const y = offset === 0 ? 0 : absOffset === 1 ? 34 : 68

    return {
      zIndex: 30 - absOffset,
      opacity: absOffset > 2 ? 0 : 1,
      transform: `translateX(calc(-50% + ${translate}px)) translateY(${y}px) rotateY(${rotate}deg) scale(${scale})`,
    }
  }

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(14,23,45,0.92)_0%,rgba(5,5,5,1)_42%,rgba(16,8,25,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_0%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_85%_25%,rgba(20,184,166,0.1),transparent_26%)]" />

      <section className="relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:min-h-[calc(100dvh-1rem)] lg:pb-10 lg:pt-32">
        <div className="mx-auto grid w-full max-w-[1480px] items-center gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8">
          <div className="relative z-20 w-full min-w-0 max-w-2xl">
            <div className="mb-7 text-xs font-black uppercase tracking-[0.34em] text-blue-300 sm:text-sm">
              {copy.eyebrow}
            </div>

            <h1 className="max-w-[calc(100vw-2rem)] whitespace-pre-line text-[clamp(2.45rem,6.7vw,5.5rem)] font-black leading-[1.04] tracking-normal text-white drop-shadow-[0_12px_26px_rgba(255,255,255,0.08)] sm:max-w-[760px]">
              {copy.title}
            </h1>

            <p className="mt-7 max-w-[calc(100vw-2rem)] text-lg leading-9 text-slate-300 [word-break:break-word] sm:max-w-xl sm:text-xl">
              {copy.subtitle}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/courses"
                className="group inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 text-lg font-black text-white shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/35 sm:w-auto"
              >
                {copy.allCourses}
                <span className="ml-4 text-2xl transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.035] px-7 text-lg font-bold text-slate-300 transition hover:border-white/30 hover:bg-white/[0.07] hover:text-white sm:w-auto"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/35 text-xs">▶</span>
                {copy.watchIntro}
              </Link>
            </div>
          </div>

          <div className="relative z-10 lg:min-h-[590px] lg:[perspective:1400px]">
            <div
              className="absolute left-1/2 top-12 hidden h-80 w-96 -translate-x-1/2 rounded-full opacity-50 blur-[100px] lg:block"
              style={{ background: activeCourse.glow }}
            />

            <button
              type="button"
              onClick={goToPreviousCourse}
              className="absolute left-0 top-1/2 z-50 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-2xl text-white shadow-xl backdrop-blur transition hover:border-cyan-300/60 hover:bg-cyan-400/10 lg:flex"
              aria-label="Previous course"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNextCourse}
              className="absolute right-0 top-1/2 z-50 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-2xl text-white shadow-xl backdrop-blur transition hover:border-cyan-300/60 hover:bg-cyan-400/10 lg:flex"
              aria-label="Next course"
            >
              ›
            </button>

            <div className="hidden h-[560px] lg:block">
              {showcaseCourses.map((course, index) => {
                const offset = getCourseOffset(index)
                const courseCopy = course.copy[activeLocale]
                const isActive = offset === 0

                return (
                  <Link
                    key={course.id}
                    href={course.href}
                    className={`group absolute left-1/2 top-4 block overflow-hidden rounded-[1.65rem] border bg-[#07101e] shadow-[0_28px_70px_rgba(0,0,0,0.55)] transition-all duration-700 ease-out ${
                      isActive ? 'h-[520px] w-[270px] border-cyan-300/80' : 'h-[440px] w-[208px] border-blue-400/45'
                    }`}
                    style={getDesktopCardStyle(offset)}
                    aria-label={courseCopy.title}
                  >
                    <div className="relative h-[58%] overflow-hidden">
                      <Image
                        src={course.image}
                        alt={courseCopy.title}
                        fill
                        priority={isActive}
                        sizes={isActive ? '270px' : '208px'}
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/65" />
                      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur">
                        {courseCopy.eyebrow}
                      </div>
                    </div>
                    <div className="relative flex h-[42%] flex-col justify-between border-t border-white/10 bg-black/45 p-5 backdrop-blur">
                      <div>
                        <h2 className={`${isActive ? 'text-3xl' : 'text-2xl'} font-black leading-[1.05] tracking-normal text-white`}>
                          {courseCopy.title}
                        </h2>
                        <p className={`${isActive ? 'mt-4 text-base leading-7' : 'mt-3 text-sm leading-6'} line-clamp-3 text-slate-300`}>
                          {courseCopy.line}
                        </p>
                      </div>
                      <span className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-black transition ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-400/10 text-cyan-200'
                          : 'border-blue-400/70 text-blue-300 group-hover:bg-blue-400/10'
                      }`}>
                        {courseCopy.preview}
                      </span>
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[1.65rem] opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25),0_0_46px_rgba(34,211,238,0.22)] transition group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.22), 0 0 52px ${course.glow}` }}
                    />
                  </Link>
                )
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
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
                        ? 'border-cyan-300/70 bg-white/[0.08] shadow-lg shadow-cyan-500/10'
                        : 'border-white/10 bg-white/[0.035]'
                    }`}
                    aria-pressed={isActive}
                  >
                    <div className="relative aspect-[16/11] overflow-hidden">
                      <Image
                        src={course.image}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className={`mb-2 inline-flex rounded-full bg-gradient-to-r ${course.tone} px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-black`}>
                          {courseCopy.preview}
                        </div>
                        <h3 className="text-2xl font-black leading-tight text-white">{courseCopy.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{courseCopy.line}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 lg:mt-0">
              {showcaseCourses.map((course, index) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-3 rounded-full transition-all ${
                    index === activeIndex ? 'w-8 bg-cyan-400' : 'w-3 bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Show ${course.copy[activeLocale].title}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-[1480px]">
          <div className="mb-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/12" />
            <div className="text-center text-xs font-black uppercase tracking-[0.34em] text-blue-400">{copy.featureKicker}</div>
            <div className="h-px flex-1 bg-white/12" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.features.map((feature, index) => (
              <div
                key={feature.title}
                className="group grid grid-cols-[4.5rem_1fr] items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-blue-300/35 hover:bg-white/[0.06]"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/12 bg-white/[0.04] text-blue-300 shadow-lg shadow-blue-500/5">
                  <FeatureIcon index={index} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
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
