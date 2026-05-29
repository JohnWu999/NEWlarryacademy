import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseList(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseSubmitted(value: string | null) {
  if (!value) return 'No answer recorded'
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join(' -> ') : value
  } catch {
    return value
  }
}

function questionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    'numeric-input': 'Fill in a number',
    'fill-blank': 'Short answer',
    'multiple-choice': 'Single choice',
    'multiple-select': 'Multiple select',
    'true-false': 'True / False',
    'order-steps': 'Order steps',
  }
  return labels[type] || 'Practice'
}

export default async function WrongbookPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login?callbackUrl=/wrongbook')

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect('/login?callbackUrl=/wrongbook')

  const wrongQuestions = await prisma.wrongQuestion.findMany({
    where: { userId: user.id, status: 'open' },
    orderBy: [{ lastSeenAt: 'desc' }],
    include: {
      activity: {
        include: {
          course: { select: { id: true, title: true } },
          lesson: { select: { id: true, title: true, order: true } },
        },
      },
    },
    take: 200,
  })

  const totalMistakes = wrongQuestions.reduce((sum, item) => sum + item.mistakeCount, 0)
  const courseCount = new Set(wrongQuestions.map((item) => item.activity.courseId)).size

  return (
    <div className="min-h-dvh bg-[#080808] px-4 pb-16 pt-28 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-200">
              Mistake Notebook
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">错题本</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-gray-400">
              答错的题先沉淀在这里。现在阶段只展示题目、你的答案和提示，不直接泄露标准答案，后续会接入错题再学习路径。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[430px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Open</div>
              <div className="mt-2 text-3xl font-black">{wrongQuestions.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Attempts</div>
              <div className="mt-2 text-3xl font-black">{totalMistakes}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Courses</div>
              <div className="mt-2 text-3xl font-black">{courseCount}</div>
            </div>
          </div>
        </div>

        {wrongQuestions.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-white/10 bg-[#101012] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400/15 text-3xl">✓</div>
            <h2 className="mt-5 text-2xl font-black">还没有错题</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">做练习时答错的题会自动进入这里。继续刷题，系统会帮你把薄弱点收集起来。</p>
            <Link href="/subjects/math" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:bg-blue-500">
              Go practice
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {wrongQuestions.map((item) => {
              const choices = parseList(item.choices)
              const lesson = item.activity.lesson
              const course = item.activity.course
              const lessonUrl = `/courses/${course.id}/learn${lesson ? `?lessonId=${lesson.id}` : ''}`
              return (
                <article key={item.id} className="rounded-[24px] border border-white/10 bg-[#101012] p-5 shadow-2xl shadow-black/20">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200">{questionTypeLabel(item.questionType)}</span>
                    <span>{course.title}</span>
                    {lesson && <span>Lesson {lesson.order}</span>}
                    <span className="text-amber-300">x{item.mistakeCount}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-black leading-8 text-white">{item.prompt}</h2>
                  {choices.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {choices.map((choice) => (
                        <div key={choice} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-gray-300">
                          {choice}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-amber-300/10 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Your answer</div>
                      <div className="mt-2 break-words text-base font-black text-white">{parseSubmitted(item.submittedAnswer)}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] p-4">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">Hint</div>
                      <div className="mt-2 text-sm font-bold leading-6 text-gray-300">{item.hint || 'Review the lesson method, then try a similar problem again.'}</div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs font-bold text-gray-600">
                      Last missed: {item.lastSeenAt.toLocaleDateString('en-US')}
                    </div>
                    <Link href={lessonUrl} className="inline-flex justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#171717] transition hover:bg-blue-50">
                      Back to lesson
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
