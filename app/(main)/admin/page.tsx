import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminUser, shanghaiDay } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function labelForEvent(type: string) {
  const labels: Record<string, string> = {
    lesson_progress: '观看课节',
    lesson_completed: '完成课节',
    quiz_completed: '完成 Quiz',
    practice_completed: '完成 Practice',
  }
  return labels[type] || type
}

function safeJson(value?: string | null) {
  try {
    return value ? JSON.parse(value) as Record<string, unknown> : null
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin')
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { email: true, name: true, role: true },
  })

  if (!isAdminUser(adminUser)) {
    return (
      <div className="min-h-dvh bg-[#050505] px-6 py-32 text-white">
        <div className="mx-auto max-w-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Admin only</p>
          <h1 className="mt-3 text-3xl font-black">没有后台权限</h1>
          <p className="mt-4 text-sm leading-6 text-white/60">
            请把你的账号 role 设为 admin，或在服务器环境变量 ADMIN_EMAILS 中加入你的邮箱。
          </p>
        </div>
      </div>
    )
  }

  const since = new Date()
  since.setDate(since.getDate() - 13)
  const today = shanghaiDay()

  const [totalVisitors, visitorEvents, latestVisitors, learningEvents] = await Promise.all([
    prisma.visitor.count(),
    prisma.visitorEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 2500,
      select: {
        day: true,
        visitorKey: true,
        path: true,
        createdAt: true,
      },
    }),
    prisma.visitor.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 24,
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { path: true, createdAt: true, day: true },
        },
      },
    }),
    prisma.customerLearningEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
  ])

  const visitorDaily = Array.from(
    visitorEvents.reduce((map, event) => {
      const bucket = map.get(event.day) || { day: event.day, visitors: new Set<string>(), pageviews: 0 }
      bucket.visitors.add(event.visitorKey)
      bucket.pageviews += 1
      map.set(event.day, bucket)
      return map
    }, new Map<string, { day: string; visitors: Set<string>; pageviews: number }>())
  )
    .map(([, value]) => ({ day: value.day, visitors: value.visitors.size, pageviews: value.pageviews }))
    .sort((a, b) => b.day.localeCompare(a.day))

  const learningDaily = Array.from(
    learningEvents.reduce((map, event) => {
      const bucket = map.get(event.day) || { day: event.day, users: new Set<string>(), events: 0, content: new Set<string>() }
      bucket.users.add(event.userId)
      bucket.events += 1
      const content = event.activityTitle || event.lessonTitle || event.courseTitle
      if (content) bucket.content.add(content)
      map.set(event.day, bucket)
      return map
    }, new Map<string, { day: string; users: Set<string>; events: number; content: Set<string> }>())
  )
    .map(([, value]) => ({
      day: value.day,
      users: value.users.size,
      events: value.events,
      content: Array.from(value.content).slice(0, 5),
    }))
    .sort((a, b) => b.day.localeCompare(a.day))

  const todayVisitors = visitorDaily.find((row) => row.day === today)?.visitors || 0
  const todayLearningUsers = learningDaily.find((row) => row.day === today)?.users || 0

  return (
    <div className="min-h-dvh bg-[#050505] px-4 py-28 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Larry Academy Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">访问与学习记录</h1>
          </div>
          <div className="text-sm font-bold text-white/48">Asia/Shanghai · 最近 14 天</div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            ['今日不同访客', todayVisitors],
            ['总访客', totalVisitors],
            ['今日学习客户', todayLearningUsers],
            ['学习事件', learningEvents.length],
          ].map(([label, value]) => (
            <div key={label} className="border border-white/10 bg-white/[0.045] px-5 py-4">
              <div className="text-2xl font-black tabular-nums">{value}</div>
              <div className="mt-1 text-xs font-bold text-white/45">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">Visitor 每日统计</h2>
              <span className="text-xs font-bold text-white/40">匿名、未登录</span>
            </div>
            <div className="overflow-hidden border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-white/44">
                  <tr>
                    <th className="px-4 py-3">日期</th>
                    <th className="px-4 py-3 text-right">不同访客</th>
                    <th className="px-4 py-3 text-right">路径事件</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {visitorDaily.length ? visitorDaily.map((row) => (
                    <tr key={row.day}>
                      <td className="px-4 py-3 font-bold">{row.day}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.visitors}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-white/60">{row.pageviews}</td>
                    </tr>
                  )) : (
                    <tr><td className="px-4 py-6 text-white/45" colSpan={3}>部署后开始记录 Visitor 数据。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">Customer 每日学习</h2>
              <span className="text-xs font-bold text-white/40">登录用户</span>
            </div>
            <div className="overflow-hidden border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-white/44">
                  <tr>
                    <th className="px-4 py-3">日期</th>
                    <th className="px-4 py-3 text-right">客户</th>
                    <th className="px-4 py-3">学习内容</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {learningDaily.length ? learningDaily.map((row) => (
                    <tr key={row.day}>
                      <td className="px-4 py-3 font-bold">{row.day}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.users}</td>
                      <td className="px-4 py-3 text-white/65">{row.content.join(' · ') || `${row.events} events`}</td>
                    </tr>
                  )) : (
                    <tr><td className="px-4 py-6 text-white/45" colSpan={3}>部署后开始记录 Customer 学习数据。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Visitor 行为路径</h2>
            <span className="text-xs font-bold text-white/40">最近 24 个访客</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {latestVisitors.length ? latestVisitors.map((visitor) => (
              <div key={visitor.id} className="border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-black">Visitor {visitor.visitorKey.slice(0, 8)}</div>
                  <div className="shrink-0 text-xs font-bold text-white/42">{formatTime(visitor.lastSeenAt)}</div>
                </div>
                <div className="mt-3 space-y-2">
                  {visitor.events.map((event, index) => (
                    <div key={`${event.createdAt.toISOString()}-${index}`} className="grid grid-cols-[4.8rem_1fr] gap-2 text-xs">
                      <span className="font-bold tabular-nums text-white/35">{formatTime(event.createdAt)}</span>
                      <span className="truncate text-white/70">{event.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="border border-white/10 p-6 text-sm text-white/45">还没有匿名访客路径。</div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Customer 学习明细</h2>
            <span className="text-xs font-bold text-white/40">最近 500 条</span>
          </div>
          <div className="overflow-hidden border border-white/10">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-white/44">
                <tr>
                  <th className="px-4 py-3">时间</th>
                  <th className="px-4 py-3">客户</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">课程 / 内容</th>
                  <th className="px-4 py-3 text-right">进度 / 分数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {learningEvents.length ? learningEvents.map((event) => {
                  const metadata = safeJson(event.metadata)
                  const metric = typeof metadata?.percent === 'number'
                    ? `${metadata.percent}%`
                    : typeof metadata?.progressPercentage === 'number'
                      ? `${metadata.progressPercentage}%`
                      : ''
                  return (
                    <tr key={event.id}>
                      <td className="px-4 py-3 text-xs font-bold text-white/45">{formatTime(event.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold">{event.user.name || 'Student'}</div>
                        <div className="text-xs text-white/42">{event.user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-white/64">{labelForEvent(event.eventType)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold">{event.activityTitle || event.lessonTitle || event.courseTitle || 'Learning activity'}</div>
                        <div className="text-xs text-white/42">{event.courseTitle}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-black tabular-nums">{metric}</td>
                    </tr>
                  )
                }) : (
                  <tr><td className="px-4 py-6 text-white/45" colSpan={5}>还没有客户学习明细。</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
