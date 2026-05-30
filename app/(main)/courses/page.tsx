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
  'ib-big-math': 'IB Big Math will organize each lesson around video, interactive questions, practice, and playful challenges for deeper math reasoning.',
  'ngss-science': 'NGSS Science is a science-only learning track with phenomenon-based videos, inquiry practice, evidence reasoning, open-response reflection, and future lab-style simulations.',
  other: 'These future course areas are being shaped into polished introductions first, with full lessons opening when the content is ready.',
}

function accessLabel(course: { status: string; accessLevel: string; isFree: boolean; price: number }) {
  if (course.status === 'coming-soon') return '即将开放'
  if (course.isFree || course.price <= 0 || course.accessLevel === 'public') return '公开免费'
  if (course.accessLevel === 'registered') return '注册可学'
  return `付费课程 ¥${course.price}`
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
      _count: {
        select: { lessons: true, activities: true },
      },
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  const allTracks = ['larry-math', 'ib-big-math', 'ngss-science', 'other'].map((track) => ({
    key: track,
    ...trackLabels[track],
    courses: courses.filter((course) => (course.courseTrack || 'other') === track),
  }))
  const tracks = selectedTrackKey ? allTracks.filter((track) => track.key === selectedTrackKey) : allTracks

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-24 top-48 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-12 max-w-4xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-blue-400">Courses</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            {selectedTrack ? `${selectedTrack.title} 课程` : '三大主课程体系'}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-400">
            {selectedTrackKey ? trackDescriptions[selectedTrackKey] : 'Larry Academy 目前以 Larry Math、IB Big Math、NGSS Science 为主线。每门主课都会围绕视频、互动答题、Practice 和小游戏来组织；其他方向先保留精美介绍，等内容准备好再开放学习。'}
          </p>
          {selectedTrackKey && (
            <Link href="/courses" className="mt-6 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/75 transition hover:border-white/25 hover:text-white">
              查看全部课程体系
            </Link>
          )}
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
                <p className="mt-5 text-sm text-gray-400">{track.courses.length} 个课程单元</p>
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
                <span className="text-sm text-gray-500">{track.courses.length} courses</span>
              </div>

              {track.courses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {track.courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]"
                    >
                      <div className={`relative aspect-video bg-gradient-to-br ${track.accent} p-6`}>
                        <div className="absolute left-5 top-5 rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white/80 backdrop-blur">
                          {accessLabel(course)}
                        </div>
                        <div className="absolute bottom-5 left-5 right-5">
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
                            {track.title}
                          </p>
                          <h3 className="mt-2 text-2xl font-black leading-tight">{course.title}</h3>
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="line-clamp-3 min-h-20 text-sm leading-7 text-gray-400">
                          {course.description}
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                          <div className="rounded-2xl bg-white/[0.04] p-3">
                            <div className="text-lg font-black text-white">{course._count.lessons}</div>
                            课节
                          </div>
                          <div className="rounded-2xl bg-white/[0.04] p-3">
                            <div className="text-lg font-black text-white">{course._count.activities}</div>
                            活动
                          </div>
                          <div className="rounded-2xl bg-white/[0.04] p-3">
                            <div className="text-lg font-black text-white">{course.viewCount}</div>
                            访问
                          </div>
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
