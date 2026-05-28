'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getVideoEmbedUrl, getVideoSourceLabel } from '@/lib/video'

interface LessonActivity {
  id: string
  type: string
  title: string
  description: string | null
  rewardsPoints: number
  rewardsGems: number
}

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  videoProvider?: string | null
  youtubeVideoId?: string | null
  tencentVodFileId?: string | null
  order: number
  duration: number | null
  isPreview?: boolean
  hasPractice?: boolean
  hasGame?: boolean
  rewardsPoints?: number
  rewardsGems?: number
  viewCount?: number
  gradeLevel?: string | null
  difficulty?: string | null
  activities?: LessonActivity[]
}

interface Course {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  hasAccess: boolean
  accessReason?: string
  progress: {
    progressPercentage: number
    lastWatchedPosition: number
  } | null
}

const difficultyStars: Record<string, number> = {
  Easy: 1,
  Medium: 3,
  Hard: 5,
}

const practiceChoices = [
  'Draw a quick diagram, label what is known, then choose a relationship to test.',
  'Try random numbers until the answer looks close.',
  'Skip the setup and calculate from the largest number first.',
]

function ChevronLeftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.4v13.2c0 .8.9 1.3 1.6.9l10.1-6.6c.6-.4.6-1.4 0-1.8L9.6 4.5C8.9 4 8 4.6 8 5.4Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '10 min'
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

function buildPracticePrompt(lesson: Lesson) {
  const title = lesson.title.replace(/^Larry Math Class\s*/i, '').trim()
  return {
    question: `Before solving "${title}", what is the strongest first move?`,
    answer: practiceChoices[0],
    explanation: 'Larry Math problems usually become clearer after you turn the words into a small model: draw, label, identify the relationship, then compute.',
  }
}

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonIdFromQuery = searchParams.get('lessonId')

  const [course, setCourse] = useState<Course | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [practiceChecked, setPracticeChecked] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/courses/${resolvedParams.id}/learn`)
      return
    }

    if (status === 'authenticated') {
      if (lessonIdFromQuery) {
        fetchLessonDirectly(lessonIdFromQuery)
      } else {
        fetchCourse(resolvedParams.id)
      }
    }
  }, [status, resolvedParams.id, lessonIdFromQuery])

  useEffect(() => {
    setSelectedChoice(null)
    setPracticeChecked(false)
  }, [currentLessonIndex])

  const fetchLessonDirectly = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`)
      if (response.ok) {
        const data = await response.json()
        const courseData = data.course
        setCourse({
          ...courseData,
          hasAccess: data.hasAccess,
          progress: data.progress,
        })

        const index = courseData.lessons.findIndex((lesson: Lesson) => lesson.id === lessonId)
        if (index !== -1) setCurrentLessonIndex(index)
      } else {
        router.push('/subjects/math')
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        if (!data.hasAccess) {
          router.push(`/courses/${courseId}`)
          return
        }
        setCourse(data)
      } else {
        router.push('/courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (percentage: number) => {
    if (!course) return
    setSavingProgress(true)
    try {
      await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastWatchedPosition: Math.round((percentage / 100) * (course.lessons.length || 1) * 600),
          progressPercentage: percentage,
        }),
      })
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setSavingProgress(false)
    }
  }

  const goToLesson = (index: number) => {
    setCurrentLessonIndex(Math.max(0, Math.min(index, (course?.lessons.length || 1) - 1)))
  }

  const markPracticeComplete = async () => {
    if (!course) return
    setPracticeChecked(true)
    const nextPercentage = Math.max(
      course.progress?.progressPercentage || 0,
      Math.round(((currentLessonIndex + 1) / course.lessons.length) * 100)
    )
    await updateProgress(nextPercentage)
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#070707] text-white">
        <div className="text-sm font-black uppercase tracking-[0.35em] text-blue-300">Loading lesson</div>
      </div>
    )
  }

  if (!course || !course.lessons.length) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#070707] px-6 text-center text-white">
        <div>
          <h1 className="text-3xl font-black">Content not found</h1>
          <p className="mt-3 text-gray-500">This course does not have published lessons yet.</p>
        </div>
      </div>
    )
  }

  const currentLesson = course.lessons[currentLessonIndex]
  const embedUrl = getVideoEmbedUrl(currentLesson)
  const practice = buildPracticePrompt(currentLesson)
  const progressPercent = Math.round(((currentLessonIndex + 1) / course.lessons.length) * 100)
  const selectedIsCorrect = selectedChoice === practice.answer

  const learningSteps = [
    {
      title: 'Watch',
      text: 'Follow Larry’s explanation and pause when the diagram or equation changes.',
      active: true,
    },
    {
      title: 'Practice',
      text: currentLesson.hasPractice ? 'Complete the quick check below to lock in the method.' : 'A quick check is ready here while the full worksheet is being prepared.',
      active: practiceChecked,
    },
    {
      title: 'Apply',
      text: currentLesson.hasGame ? 'Open the lesson game after practice.' : 'Try the same strategy on a similar problem before moving on.',
      active: false,
    },
  ]

  return (
    <div className="min-h-dvh bg-[#080808] pt-20 text-white">
      <div className="border-b border-white/10 bg-[#0d0d0f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              <span>{course.title}</span>
              <span className="h-1 w-1 rounded-full bg-gray-700" />
              <span>{currentLessonIndex + 1} / {course.lessons.length}</span>
              <span className="h-1 w-1 rounded-full bg-gray-700" />
              <span>{getVideoSourceLabel(currentLesson)}</span>
            </div>
            <h1 className="mt-2 truncate text-xl font-black tracking-tight sm:text-2xl">
              {currentLesson.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden w-48 sm:block">
              <div className="mb-1 flex justify-between text-[11px] font-bold text-gray-500">
                <span>Course progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <button
              onClick={() => goToLesson(currentLessonIndex - 1)}
              disabled={currentLessonIndex === 0}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous lesson"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => goToLesson(currentLessonIndex + 1)}
              disabled={currentLessonIndex === course.lessons.length - 1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next lesson"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#101012] shadow-2xl shadow-black/40">
            <div className="relative aspect-video bg-black">
              {embedUrl ? (
                <iframe
                  className="h-full w-full"
                  src={`${embedUrl}&autoplay=0`}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentLesson.videoUrl ? (
                <div className="flex h-full items-center justify-center">
                  <a
                    href={currentLesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-500"
                  >
                    <PlayIcon />
                    Open video
                  </a>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500/10 to-white/[0.02]">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-blue-200">
                      <PlayIcon />
                    </div>
                    <p className="font-bold text-gray-400">{getVideoSourceLabel(currentLesson)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200">
                    {currentLesson.gradeLevel || 'Lesson'}
                  </span>
                  {currentLesson.difficulty && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-gray-300">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <span key={star} className={star < (difficultyStars[currentLesson.difficulty || 'Medium'] || 3) ? 'text-yellow-400' : 'text-gray-700'}>
                          ★
                        </span>
                      ))}
                      <span className="ml-1 text-gray-500">{currentLesson.difficulty}</span>
                    </span>
                  )}
                  <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-black text-gray-400">
                    {formatDuration(currentLesson.duration)}
                  </span>
                </div>

                <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  {currentLesson.title}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400 sm:text-lg">
                  {currentLesson.description || 'Watch the lesson, pause to solve along with Larry, then complete the quick practice check below before moving to the next class.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 xl:grid-cols-1">
                {[
                  ['Views', currentLesson.viewCount || 0],
                  ['Reward', `${currentLesson.rewardsPoints || 20} pts`],
                  ['Gems', `${currentLesson.rewardsGems || 0}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">{label}</div>
                    <div className="mt-2 text-xl font-black text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[28px] border border-white/10 bg-[#101012] p-5 sm:p-7">
              <h2 className="text-2xl font-black">Learning path</h2>
              <div className="mt-6 space-y-4">
                {learningSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black ${step.active ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-gray-500'}`}>
                        {step.active ? <CheckIcon /> : index + 1}
                      </div>
                      {index < learningSteps.length - 1 && <div className="mt-2 h-10 w-px bg-white/10" />}
                    </div>
                    <div className="pb-3">
                      <h3 className="font-black text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-500">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#f4f1e8] p-5 text-[#171717] shadow-2xl shadow-black/20 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#777064]">Practice check</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">Try one step before moving on</h2>
                </div>
                <div className="rounded-2xl bg-[#171717] px-3 py-2 text-sm font-black text-white">
                  +{currentLesson.rewardsPoints || 20} pts
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-lg font-black leading-8">{practice.question}</p>

                <div className="mt-5 space-y-3">
                  {practiceChoices.map((choice) => {
                    const isSelected = selectedChoice === choice
                    const isCorrectChoice = choice === practice.answer
                    const showCorrect = practiceChecked && isCorrectChoice
                    const showWrong = practiceChecked && isSelected && !isCorrectChoice
                    return (
                      <button
                        key={choice}
                        onClick={() => {
                          setSelectedChoice(choice)
                          setPracticeChecked(false)
                        }}
                        className={`w-full rounded-2xl border p-4 text-left text-sm font-bold leading-6 transition ${
                          showCorrect
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : showWrong
                            ? 'border-red-400 bg-red-50 text-red-900'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-950'
                            : 'border-[#e2ded3] bg-[#fbfaf6] text-[#28251f] hover:border-[#bdb5a6]'
                        }`}
                      >
                        {choice}
                      </button>
                    )
                  })}
                </div>

                {practiceChecked && (
                  <div className={`mt-5 rounded-2xl p-4 text-sm font-bold leading-6 ${selectedIsCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}>
                    {selectedIsCorrect ? 'Correct. ' : 'Not quite. '}
                    {practice.explanation}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={markPracticeComplete}
                    disabled={!selectedChoice || savingProgress}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingProgress ? 'Saving...' : practiceChecked ? 'Saved' : 'Check answer'}
                  </button>
                  <button
                    onClick={() => goToLesson(currentLessonIndex + 1)}
                    disabled={currentLessonIndex === course.lessons.length - 1}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d7d0c3] px-5 py-4 text-sm font-black text-[#171717] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next lesson
                    <ChevronRightIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#101012]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Curriculum</h2>
                  <p className="mt-1 text-sm text-gray-500">{course.lessons.length} lessons</p>
                </div>
                <div className="rounded-2xl bg-white/[0.05] px-3 py-2 text-xs font-black text-gray-400">
                  {progressPercent}%
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
              {course.lessons.map((lesson, index) => {
                const active = currentLessonIndex === index
                const completed = index < currentLessonIndex
                return (
                  <button
                    key={lesson.id}
                    onClick={() => goToLesson(index)}
                    className={`group w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-blue-500/70 bg-blue-600/15'
                        : 'border-transparent bg-white/[0.035] hover:border-white/10 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                        active ? 'bg-blue-600 text-white' : completed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.07] text-gray-500'
                      }`}>
                        {completed ? <CheckIcon /> : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate font-black ${active ? 'text-white' : 'text-gray-300'}`}>{lesson.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
                          <span>{formatDuration(lesson.duration)}</span>
                          {lesson.gradeLevel && <span>{lesson.gradeLevel}</span>}
                          {lesson.hasPractice && <span>Practice</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
