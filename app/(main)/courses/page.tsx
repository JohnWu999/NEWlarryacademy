import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const trackLabels: Record<string, { title: string; eyebrow: string; accent: string }> = {
  'larry-math': {
    title: 'Larry Math',
    eyebrow: 'Larry 讲课 + Practice + 小游戏',
    accent: 'from-blue-500/25 to-cyan-400/15',
  },
  'ib-big-math': {
    title: 'IB Big Math',
    eyebrow: '视频 + 互动答题 + 每节课小游戏',
    accent: 'from-violet-500/25 to-fuchsia-400/15',
  },
  'ngss-science': {
    title: 'NGSS Science',
    eyebrow: '科学探究 + 实验模拟 + 游戏化练习',
    accent: 'from-emerald-500/25 to-teal-400/15',
  },
  other: {
    title: 'Future Courses',
    eyebrow: '课程介绍已开放，内容陆续上线',
    accent: 'from-slate-500/25 to-indigo-400/15',
  },
}

const categoryToTrack: Record<string, string> = {
  math: 'larry-math',
  'larry-math': 'larry-math',
  'ib-big-math': 'ib-big-math',
  'ngss-science': 'ngss-science',
}

const trackDescriptions: Record<string, string> = {
  'larry-math': 'Larry Math focuses on Larry video lessons, skill drills, Practice, and small games that help students build confident math thinking.',
  'ib-big-math': 'IB Big Math is built for students who want a real foundation before chasing full marks: video lessons, focused drills, interactive reasoning, and game-like practice in every released pathway.',
  'ngss-science': 'NGSS Science is a science-only learning track with phenomenon-based videos, inquiry practice, evidence reasoning, open-response reflection, and future lab-style simulations.',
  other: 'These future course areas are being shaped into polished introductions first, with full lessons opening when the content is ready.',
}

function accessLabel(course: { status: string; accessLevel: string; isFree: boolean; price: number }) {
  if (course.status === 'coming-soon') return '即将开放'
  if (course.accessLevel === 'registered') return '注册可学'
  if (course.isFree || course.price <= 0 || course.accessLevel === 'public') return '公开免费'
  return `付费课程 ¥${course.price}`
}

function accessTone(course: { status: string; accessLevel: string; isFree: boolean; price: number }) {
  if (course.status === 'coming-soon') return 'bg-white/10 text-white/70 ring-white/10'
  if (course.accessLevel === 'registered') return 'bg-cyan-300 text-[#05131d] ring-cyan-100/50'
  if (course.isFree || course.price <= 0 || course.accessLevel === 'public') return 'bg-emerald-300 text-[#04140f] ring-emerald-100/50'
  return 'bg-amber-300 text-[#1c1003] ring-amber-100/50'
}

function trackCardCopy(trackKey: string) {
  if (trackKey === 'ib-big-math') return 'IB has no single textbook. These paths turn the missing foundation into a clear, playable climb.'
  if (trackKey === 'ngss-science') return 'Phenomena, evidence, reflection, and practice designed around real scientific thinking.'
  if (trackKey === 'larry-math') return 'Learn with a peer teacher: Larry explanations, practice loops, and games that make math less lonely.'
  return 'Future directions are introduced beautifully first, then opened when lessons are ready.'
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

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const selectedTrackKey = category ? categoryToTrack[category] || 'other' : null
  const selectedTrack = selectedTrackKey ? trackLabels[selectedTrackKey] : null

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
      { createdAt: 'desc' },
    ],
  })

  const totalQuestionCount = courses.reduce((sum, course) => sum + courseQuestionCount(course), 0)

  const allTracks = ['larry-math', 'ib-big-math', 'ngss-science', 'other'].map((track) => ({
    key: track,
    ...trackLabels[track],
    courses: courses.filter((course) => (course.courseTrack || 'other') === track),
  }))
  const tracks = selectedTrackKey ? allTracks.filter((track) => track.key === selectedTrackKey) : allTracks

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
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-blue-300">Courses</p>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              {selectedTrack ? `${selectedTrack.title} 课程` : '三大主课程体系'}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-gray-300">
              {selectedTrackKey ? trackDescriptions[selectedTrackKey] : 'Larry Academy 目前以 Larry Math、IB Big Math、NGSS Science 为主线。每门主课都会围绕视频、互动答题、Practice 和小游戏来组织；其他方向先保留精美介绍，等内容准备好再开放学习。'}
            </p>
            {selectedTrackKey && (
              <Link href="/courses" className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/75 transition hover:border-white/25 hover:text-white">
                查看全部课程体系
              </Link>
            )}
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="text-2xl font-black">{courses.length}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Courses</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="text-2xl font-black">{courses.reduce((sum, course) => sum + course._count.lessons, 0)}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Lessons</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <div className="text-2xl font-black">{totalQuestionCount}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Questions</div>
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
                <p className="mt-3 min-h-12 text-sm leading-6 text-gray-300">{trackCardCopy(track.key)}</p>
                <p className="mt-5 text-sm font-bold text-white/60">{track.courses.length} 个课程单元</p>
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
                <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-400">{track.courses.length} courses</span>
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
                          {accessLabel(course)}
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
                          {course.description}
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                          <div className="rounded-2xl bg-white/[0.055] p-3">
                            <div className="text-lg font-black text-white">{course._count.lessons}</div>
                            课节
                          </div>
                          <div className="rounded-2xl bg-white/[0.055] p-3">
                            <div className="text-lg font-black text-white">{courseQuestionCount(course)}</div>
                            题目
                          </div>
                          <div className="rounded-2xl bg-white/[0.055] p-3">
                            <div className="text-lg font-black text-white">{course.viewCount}</div>
                            访问
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                            {course._count.lessons > 0 ? 'Ready to learn' : 'Preview only'}
                          </span>
                          <span className="text-sm font-black text-blue-300 transition group-hover:text-blue-200">
                            探索课程 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-gray-400">
                  这一组课程正在整理中，当前只保留入口结构。
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
