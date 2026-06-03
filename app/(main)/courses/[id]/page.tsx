import PurchaseCourseButton from '@/components/courses/PurchaseCourseButton'
import { authOptions } from '@/lib/auth'
import { resolveCourseAccess } from '@/lib/course-access'
import { prisma } from '@/lib/prisma'
import { getVideoEmbedUrl, getVideoSourceLabel } from '@/lib/video'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

function difficultyLabel(level: string) {
  if (level === 'beginner') return '初级'
  if (level === 'intermediate') return '中级'
  if (level === 'advanced') return '高级'
  return level
}

function accessCopy(reason: string, price: number) {
  if (reason === 'public') return '公开免费，任何人都可以学习。'
  if (reason === 'registered') return '注册登录后即可学习。'
  if (reason === 'purchased') return '你已经拥有这门课的学习权限。'
  if (reason === 'coming-soon') return '课程内容正在制作中，当前开放介绍页。'
  if (reason === 'login-required') return '请先登录，再继续学习这门课。'
  return `付费课程，开通后即可学习。当前价格 ¥${price}。`
}

function courseTrackLabel(track: string) {
  if (track === 'ngss-science') return 'NGSS Science'
  if (track === 'ib-big-math') return 'IB Big Math'
  if (track === 'larry-math') return 'Larry Math'
  return 'Future Course'
}

function courseCoverPath(course: { id: string; courseTrack: string; thumbnailUrl?: string | null }) {
  if (course.thumbnailUrl) return course.thumbnailUrl
  if (course.id === 'course-ngss-science' || course.courseTrack === 'ngss-science') {
    return '/course-covers/ngss-science-cover.png'
  }
  return null
}

function plannedCourseStats(course: { id: string; status: string; courseTrack: string; lessons: unknown[] }) {
  const plannedIbPypIds = new Set(['course-ib-big-math', 'course-ib-big-math-g7-pyp', 'course-ib-big-math-g8-pyp'])
  if (course.status === 'coming-soon' && course.courseTrack === 'ib-big-math' && plannedIbPypIds.has(course.id)) {
    return { lessons: 40, questions: 800 }
  }
  const plannedNgssIds = new Set(['course-ngss-science-g7', 'course-ngss-science-g8'])
  if (course.status === 'coming-soon' && course.courseTrack === 'ngss-science' && plannedNgssIds.has(course.id)) {
    return { lessons: 20, questions: 200 }
  }
  return { lessons: course.lessons.length, questions: null as number | null }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

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
  const featureCards = course.expectedFeatures
    ? JSON.parse(course.expectedFeatures) as string[]
    : ['视频课程', '互动答题', 'Practice 练习', '小游戏挑战']

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <Link href="/courses" className="mb-8 inline-flex text-sm font-bold text-blue-300 hover:text-blue-200">
          返回课程列表
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
                  {difficultyLabel(course.difficultyLevel)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                  {getVideoSourceLabel(course)}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{course.title}</h1>
              <p className="mt-6 text-lg leading-8 text-gray-400">{course.description}</p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['课节', plannedStats.lessons],
                  ['题目', plannedStats.questions ?? '待定'],
                  ['访问', course.viewCount],
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
              <h2 className="text-2xl font-black">学习权限</h2>
              <p className="mt-3 text-sm leading-7 text-gray-400">{accessCopy(access.reason, course.price)}</p>

              <div className="mt-6">
                {access.hasAccess ? (
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block rounded-2xl bg-blue-600 px-6 py-4 text-center text-lg font-black text-white transition hover:bg-blue-500"
                  >
                    {progress ? '继续学习' : '开始学习'}
                  </Link>
                ) : access.reason === 'coming-soon' ? (
                  <Link
                    href="/courses"
                    className="block rounded-2xl bg-white/10 px-6 py-4 text-center text-lg font-black text-white/70"
                  >
                    查看其他课程
                  </Link>
                ) : access.reason === 'login-required' ? (
                  <Link
                    href={`/login?callbackUrl=/courses/${course.id}`}
                    className="block rounded-2xl bg-blue-600 px-6 py-4 text-center text-lg font-black text-white transition hover:bg-blue-500"
                  >
                    登录后学习
                  </Link>
                ) : (
                  <PurchaseCourseButton courseId={course.id} price={course.price} />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <h2 className="text-2xl font-black">课程内容</h2>
              <div className="mt-5 space-y-3">
                {course.lessons.length > 0 ? course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-sm font-black text-blue-200">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white">{lesson.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{lesson.description || '课节说明待补充'}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-400">
                          {lesson.isPreview && <span>试看</span>}
                          {lesson.hasPractice && <span>Practice</span>}
                          {lesson.hasGame && <span>小游戏</span>}
                          <span>{lesson.viewCount} 访问</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-gray-500">
                    正在制作课节内容。
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
