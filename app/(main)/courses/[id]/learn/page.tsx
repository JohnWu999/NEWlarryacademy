'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { getVideoEmbedUrl, getVideoSourceLabel } from '@/lib/video'

interface LessonActivity {
  id: string
  type: string
  title: string
  description: string | null
  config?: string | null
  rewardsPoints: number
  rewardsGems: number
}

interface PracticeQuestion {
  id: string
  type: 'multiple-choice' | 'true-false' | 'order-steps' | 'numeric-input' | 'fill-blank' | 'multiple-select'
  prompt: string
  choices: string[]
  answer: string | string[]
  points: number
  penalty: number
  hint: string
  explanation: string
  visual?: string
  inputPlaceholder?: string
  unit?: string
  tolerance?: number
  encouragement?: {
    correct?: string
    incorrect?: string
  }
}

interface PracticeConfig {
  title: string
  maxScore: number
  passingScore: number
  rewards?: {
    gemsOnPass?: number
    gemsOnPerfect?: number
    streakBonus?: number
  }
  reviewAdvice?: {
    rewatchMessage?: string
    focus?: string
  }
  questions: PracticeQuestion[]
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

function SparkIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 14.6 8.4 21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6L12 2Z" />
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

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ')
}

function normalizeNumber(value: string) {
  const number = Number(normalizeAnswer(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(number) ? number : null
}

function hasQuestAnswer(question: PracticeQuestion, value?: string | string[]) {
  if (Array.isArray(value)) {
    return question.type === 'order-steps' ? value.length === question.choices.length : value.length > 0
  }
  return Boolean(value && value.trim())
}

function parsePracticeConfig(activity?: LessonActivity) {
  if (!activity?.config) return null
  try {
    const config = JSON.parse(activity.config) as PracticeConfig
    return Array.isArray(config.questions) && config.questions.length ? config : null
  } catch {
    return null
  }
}

function checkPracticeAnswer(question: PracticeQuestion, value: string | string[] | null) {
  if (!value) return false
  if (question.type === 'numeric-input') {
    const expected = normalizeNumber(String(question.answer))
    const actual = normalizeNumber(Array.isArray(value) ? value.join('') : value)
    if (expected === null || actual === null) return false
    return Math.abs(expected - actual) <= Number(question.tolerance || 0.0001)
  }
  if (Array.isArray(question.answer)) {
    const actual = Array.isArray(value) ? value : [value]
    if (question.type === 'multiple-select') {
      const expected = question.answer.map(normalizeAnswer).sort()
      const selected = actual.map(normalizeAnswer).sort()
      return expected.length === selected.length && expected.every((answer, index) => answer === selected[index])
    }
    return question.answer.length === actual.length && question.answer.every((answer, index) => normalizeAnswer(answer) === normalizeAnswer(actual[index] || ''))
  }
  return normalizeAnswer(String(question.answer)) === normalizeAnswer(Array.isArray(value) ? value.join(' > ') : value)
}

function getQuestionLabel(type: PracticeQuestion['type']) {
  const labels: Record<PracticeQuestion['type'], string> = {
    'multiple-choice': 'Choose',
    'true-false': 'True / False',
    'order-steps': 'Order the steps',
    'numeric-input': 'Type the answer',
    'fill-blank': 'Fill the blank',
    'multiple-select': 'Select all',
  }
  return labels[type] || 'Practice'
}

function QuestVisual({ type }: { type: PracticeQuestion['type'] }) {
  if (type === 'numeric-input' || type === 'fill-blank') {
    return (
      <div className="mt-4 grid grid-cols-5 gap-1 rounded-2xl bg-[#f7f0dd] p-3">
        {[...Array(15)].map((_, index) => (
          <div key={index} className={`h-8 rounded-lg border border-[#e2d4b8] ${index % 3 === 1 ? 'bg-white' : 'bg-[#fbf8ef]'}`} />
        ))}
      </div>
    )
  }

  if (type === 'order-steps') {
    return (
      <div className="mt-4 flex items-end gap-2 rounded-2xl bg-blue-50 p-3">
        {[1, 2, 3, 4].map((height) => (
          <div key={height} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-xl bg-blue-500/70" style={{ height: `${height * 14}px` }} />
            <span className="text-[10px] font-black text-blue-700">{height}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 flex gap-2 rounded-2xl bg-emerald-50 p-3">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className={`h-10 flex-1 rounded-xl ${index === 0 ? 'bg-emerald-500' : 'bg-white'} ring-1 ring-emerald-100`} />
      ))}
    </div>
  )
}

function TencentVodPlayer({ fileId, mediaUrl, title }: { fileId: string; mediaUrl?: string | null; title: string }) {
  const playerId = `tcplayer-${fileId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const appId = process.env.NEXT_PUBLIC_TENCENT_VOD_APP_ID
  const licenseUrl = process.env.NEXT_PUBLIC_TENCENT_VOD_LICENSE_URL
  const psign = process.env.NEXT_PUBLIC_TENCENT_VOD_PLAYER_SIGNATURE
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    const win = window as Window & { TCPlayer?: (id: string, options: Record<string, unknown>) => unknown }
    if (!win.TCPlayer || !appId || !scriptReady) return
    win.TCPlayer(playerId, {
      fileID: fileId,
      appID: appId,
      psign,
      licenseUrl,
      language: 'en',
      autoplay: false,
      controls: true,
      width: '100%',
      height: '100%',
    })
  }, [appId, fileId, licenseUrl, playerId, psign, scriptReady])

  if (!appId) {
    if (mediaUrl) {
      return <video className="h-full w-full bg-black" src={mediaUrl} title={title} controls preload="metadata" playsInline />
    }

    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500/10 to-white/[0.02]">
        <div className="max-w-md px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-blue-200">
            <PlayIcon />
          </div>
          <p className="font-black text-white">{title}</p>
          <p className="mt-3 text-sm leading-6 text-gray-500">Tencent VOD video is uploaded, but the web player app ID still needs to be configured.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script src="https://web.sdk.qcloud.com/player/tcplayer/release/v5.1.0/tcplayer.v5.1.0.min.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <video id={playerId} className="h-full w-full" preload="metadata" playsInline />
    </>
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
  const [questIndex, setQuestIndex] = useState(0)
  const [questAnswers, setQuestAnswers] = useState<Record<string, string | string[]>>({})
  const [questFeedback, setQuestFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [questSubmitted, setQuestSubmitted] = useState(false)
  const [questSaving, setQuestSaving] = useState(false)
  const [questResult, setQuestResult] = useState<{ score: number; maxScore: number; percent: number; earnedPoints: number; earnedGems: number } | null>(null)
  const [questEffect, setQuestEffect] = useState<{ kind: 'correct' | 'incorrect' | 'complete'; key: number } | null>(null)

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

  const activeLessonId = course?.lessons[currentLessonIndex]?.id
  const activePracticeId = course?.lessons[currentLessonIndex]?.activities?.find((activity) => activity.type === 'practice' && activity.config)?.id

  useEffect(() => {
    setSelectedChoice(null)
    setPracticeChecked(false)
    setQuestIndex(0)
    setQuestAnswers({})
    setQuestFeedback(null)
    setQuestSubmitted(false)
    setQuestResult(null)
    setQuestEffect(null)
  }, [course?.id, activeLessonId, activePracticeId])

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

  const playFeedbackTone = (kind: 'correct' | 'incorrect' | 'complete') => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const sequence = kind === 'incorrect'
        ? [180, 140]
        : kind === 'complete'
        ? [523, 659, 784, 1046]
        : [523, 659, 880]
      sequence.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        const start = ctx.currentTime + index * 0.085
        oscillator.type = kind === 'incorrect' ? 'sawtooth' : 'sine'
        oscillator.frequency.setValueAtTime(frequency, start)
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(kind === 'incorrect' ? 0.06 : 0.1, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.start(start)
        oscillator.stop(start + 0.18)
      })
    } catch {
      // Audio feedback is optional; browsers may block it in some contexts.
    }
  }

  const answerCurrentQuest = (question: PracticeQuestion, value: string | string[]) => {
    setQuestAnswers((answers) => ({ ...answers, [question.id]: value }))
    setQuestFeedback(null)
    setQuestEffect(null)
  }

  const checkCurrentQuest = (question: PracticeQuestion) => {
    const correct = checkPracticeAnswer(question, questAnswers[question.id] || null)
    setQuestFeedback(correct ? 'correct' : 'incorrect')
    setQuestEffect({ kind: correct ? 'correct' : 'incorrect', key: Date.now() })
    playFeedbackTone(correct ? 'correct' : 'incorrect')
  }

  const continueQuest = async (config: PracticeConfig, activity: LessonActivity) => {
    if (questIndex < config.questions.length - 1) {
      setQuestIndex((index) => index + 1)
      setQuestFeedback(null)
      setQuestEffect(null)
      return
    }

    setQuestSaving(true)
    try {
      const answers = config.questions.map((question) => ({
        questionId: question.id,
        value: questAnswers[question.id] || '',
      }))
      const response = await fetch(`/api/activities/${activity.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (response.ok) {
        const result = await response.json()
        setQuestResult(result)
        setQuestSubmitted(true)
        setQuestEffect({ kind: 'complete', key: Date.now() })
        playFeedbackTone('complete')
        await markPracticeComplete()
      }
    } catch (error) {
      console.error('Error saving quest:', error)
    } finally {
      setQuestSaving(false)
    }
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
  const practiceActivity = currentLesson.activities?.find((activity) => activity.type === 'practice' && activity.config)
  const questConfig = parsePracticeConfig(practiceActivity)
  const currentQuestQuestion = questConfig?.questions[questIndex]
  const questScorePreview = questConfig?.questions.reduce((sum, question) => {
    const value = questAnswers[question.id]
    if (!hasQuestAnswer(question, value)) return sum
    return sum + (checkPracticeAnswer(question, value) ? question.points : -question.penalty)
  }, 0) || 0
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
              ) : currentLesson.videoProvider === 'tencent-vod' && currentLesson.tencentVodFileId ? (
                <TencentVodPlayer fileId={currentLesson.tencentVodFileId} mediaUrl={currentLesson.videoUrl} title={currentLesson.title} />
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
              {questConfig && practiceActivity && currentQuestQuestion ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#777064]">Practice quest</p>
                      <h2 className="mt-2 text-2xl font-black leading-tight">{questConfig.title}</h2>
                    </div>
                    <div className="rounded-2xl bg-[#171717] px-3 py-2 text-sm font-black text-white">
                      {Math.max(0, questScorePreview)} / {questConfig.maxScore}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-10 gap-1.5">
                    {questConfig.questions.map((question, index) => {
                      const answered = Boolean(questAnswers[question.id])
                      return (
                        <div
                          key={question.id}
                          className={`h-2 rounded-full ${index === questIndex ? 'bg-blue-600' : answered ? 'bg-emerald-500' : 'bg-[#d8d0c2]'}`}
                        />
                      )
                    })}
                  </div>

                  {!questSubmitted ? (
                    <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          <SparkIcon />
                          Question {questIndex + 1} of {questConfig.questions.length}
                        </div>
                        <div className="text-sm font-black text-[#777064]">
                          +{currentQuestQuestion.points} / -{currentQuestQuestion.penalty}
                        </div>
                      </div>

                      <div className="relative overflow-hidden">
                        {questEffect && (
                          <div key={questEffect.key} className={`pointer-events-none absolute inset-0 z-10 ${questEffect.kind === 'incorrect' ? 'quest-shake' : 'quest-fireworks'}`}>
                            {questEffect.kind === 'incorrect' ? (
                              <div className="absolute right-4 top-4 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900 shadow-lg">
                                Try a new strategy
                              </div>
                            ) : (
                              [...Array(18)].map((_, index) => (
                                <span
                                  key={index}
                                  className="quest-spark"
                                  style={{
                                    left: `${12 + ((index * 37) % 76)}%`,
                                    top: `${10 + ((index * 23) % 68)}%`,
                                    animationDelay: `${index * 0.025}s`,
                                  }}
                                />
                              ))
                            )}
                          </div>
                        )}

                        <div className={`rounded-3xl border border-[#efe7d8] bg-[#fffdf8] p-4 ${questEffect?.kind === 'correct' ? 'quest-pop' : ''} ${questEffect?.kind === 'incorrect' ? 'quest-wobble' : ''}`}>
                          <div className="mb-3 inline-flex rounded-full bg-[#f4f1e8] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#777064]">
                            {getQuestionLabel(currentQuestQuestion.type)}
                          </div>
                          <p className="text-lg font-black leading-8">{currentQuestQuestion.prompt}</p>
                          <QuestVisual type={currentQuestQuestion.type} />

                          {currentQuestQuestion.type === 'numeric-input' || currentQuestQuestion.type === 'fill-blank' ? (
                            <div className="mt-5">
                              <div className="flex overflow-hidden rounded-2xl border-2 border-[#171717] bg-white shadow-[0_8px_0_#171717] focus-within:border-blue-600">
                                <input
                                  value={String(questAnswers[currentQuestQuestion.id] || '')}
                                  onChange={(event) => answerCurrentQuest(currentQuestQuestion, event.target.value)}
                                  inputMode={currentQuestQuestion.type === 'numeric-input' ? 'decimal' : 'text'}
                                  placeholder={currentQuestQuestion.inputPlaceholder || 'Type your answer'}
                                  className="min-w-0 flex-1 bg-transparent px-5 py-4 text-xl font-black text-[#171717] outline-none placeholder:text-[#b6ad9d]"
                                />
                                {currentQuestQuestion.unit && (
                                  <div className="flex items-center border-l border-[#e2ded3] bg-[#f4f1e8] px-4 text-sm font-black text-[#777064]">
                                    {currentQuestQuestion.unit}
                                  </div>
                                )}
                              </div>
                              <p className="mt-3 text-xs font-bold text-[#857b69]">Type it yourself. This is where the math muscles grow.</p>
                            </div>
                          ) : currentQuestQuestion.type === 'order-steps' ? (
                            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                              <div>
                                <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#777064]">Tap in order</div>
                                <div className="space-y-2">
                                  {currentQuestQuestion.choices.map((choice) => {
                                    const selectedValue = Array.isArray(questAnswers[currentQuestQuestion.id]) ? questAnswers[currentQuestQuestion.id] as string[] : []
                                    const isSelected = selectedValue.includes(choice)
                                    return (
                                      <button
                                        key={choice}
                                        onClick={() => {
                                          if (isSelected || questFeedback) return
                                          answerCurrentQuest(currentQuestQuestion, [...selectedValue, choice])
                                        }}
                                        disabled={isSelected || Boolean(questFeedback)}
                                        className={`w-full rounded-2xl border p-3 text-left text-sm font-bold leading-6 transition ${
                                          isSelected ? 'border-blue-200 bg-blue-50 text-blue-900 opacity-60' : 'border-[#e2ded3] bg-white hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                      >
                                        {choice}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <div className="text-xs font-black uppercase tracking-[0.16em] text-[#777064]">Your ladder</div>
                                  <button
                                    onClick={() => {
                                      answerCurrentQuest(currentQuestQuestion, [])
                                      setQuestFeedback(null)
                                    }}
                                    className="text-xs font-black text-blue-700"
                                  >
                                    Reset
                                  </button>
                                </div>
                                <div className="min-h-[190px] space-y-2 rounded-2xl border border-dashed border-[#d7d0c3] bg-[#fbfaf6] p-3">
                                  {(Array.isArray(questAnswers[currentQuestQuestion.id]) ? questAnswers[currentQuestQuestion.id] as string[] : []).map((choice, index) => (
                                    <button
                                      key={`${choice}-${index}`}
                                      onClick={() => {
                                        const selectedValue = Array.isArray(questAnswers[currentQuestQuestion.id]) ? questAnswers[currentQuestQuestion.id] as string[] : []
                                        answerCurrentQuest(currentQuestQuestion, selectedValue.filter((_, selectedIndex) => selectedIndex !== index))
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl bg-[#171717] p-3 text-left text-sm font-black text-white"
                                    >
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500">{index + 1}</span>
                                      {choice}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-5 space-y-3">
                              {currentQuestQuestion.choices.map((choice) => {
                                const selectedValue = questAnswers[currentQuestQuestion.id]
                                const selectedList = Array.isArray(selectedValue) ? selectedValue : []
                                const isSelected = currentQuestQuestion.type === 'multiple-select' ? selectedList.includes(choice) : selectedValue === choice
                                const isCorrectChoice = Array.isArray(currentQuestQuestion.answer)
                                  ? currentQuestQuestion.answer.includes(choice)
                                  : currentQuestQuestion.answer === choice
                                const showCorrect = questFeedback && isCorrectChoice
                                const showWrong = questFeedback === 'incorrect' && isSelected && !isCorrectChoice
                                return (
                                  <button
                                    key={choice}
                                    onClick={() => {
                                      if (currentQuestQuestion.type === 'multiple-select') {
                                        const next = isSelected ? selectedList.filter((item) => item !== choice) : [...selectedList, choice]
                                        answerCurrentQuest(currentQuestQuestion, next)
                                      } else {
                                        answerCurrentQuest(currentQuestQuestion, choice)
                                      }
                                    }}
                                    className={`w-full rounded-2xl border p-4 text-left text-sm font-bold leading-6 transition ${
                                      showCorrect
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                        : showWrong
                                        ? 'border-red-400 bg-red-50 text-red-900'
                                        : isSelected
                                        ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-[0_4px_0_#2563eb]'
                                        : 'border-[#e2ded3] bg-[#fbfaf6] text-[#28251f] hover:border-[#bdb5a6]'
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {questFeedback && (
                        <div className={`mt-5 rounded-2xl p-4 text-sm font-bold leading-6 ${questFeedback === 'correct' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}>
                          <div>{questFeedback === 'correct' ? currentQuestQuestion.encouragement?.correct || 'Correct.' : currentQuestQuestion.encouragement?.incorrect || 'Not quite yet.'}</div>
                          <div className="mt-2 font-semibold">{questFeedback === 'correct' ? currentQuestQuestion.explanation : currentQuestQuestion.hint}</div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => questFeedback ? continueQuest(questConfig, practiceActivity) : checkCurrentQuest(currentQuestQuestion)}
                          disabled={!hasQuestAnswer(currentQuestQuestion, questAnswers[currentQuestQuestion.id]) || questSaving}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {questSaving ? 'Saving...' : questFeedback ? (questIndex === questConfig.questions.length - 1 ? 'Finish quest' : 'Continue') : 'Check answer'}
                        </button>
                        <button
                          onClick={() => {
                            setQuestFeedback('incorrect')
                            setQuestEffect({ kind: 'incorrect', key: Date.now() })
                            playFeedbackTone('incorrect')
                          }}
                          disabled={Boolean(questFeedback)}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#d7d0c3] px-5 py-4 text-sm font-black text-[#171717] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Need a hint
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative mt-6 overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
                      {questEffect?.kind === 'complete' && (
                        <div key={questEffect.key} className="pointer-events-none absolute inset-0 z-10 quest-fireworks">
                          {[...Array(28)].map((_, index) => (
                            <span
                              key={index}
                              className="quest-spark"
                              style={{
                                left: `${8 + ((index * 29) % 84)}%`,
                                top: `${8 + ((index * 31) % 76)}%`,
                                animationDelay: `${index * 0.018}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <SparkIcon />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#777064]">Quest complete</p>
                          <h3 className="text-2xl font-black">{questResult?.score || 0} / {questResult?.maxScore || questConfig.maxScore}</h3>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#f4f1e8] p-4">
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#777064]">Points earned</div>
                          <div className="mt-2 text-2xl font-black">+{questResult?.earnedPoints || 0}</div>
                        </div>
                        <div className="rounded-2xl bg-[#f4f1e8] p-4">
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#777064]">Gems earned</div>
                          <div className="mt-2 text-2xl font-black">+{questResult?.earnedGems || 0}</div>
                        </div>
                      </div>
                      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-950">
                        {questResult && questResult.percent >= questConfig.passingScore
                          ? 'Strong work. You are ready to keep climbing.'
                          : questConfig.reviewAdvice?.rewatchMessage || 'Review the video once more, then come back for a higher score.'}
                        <div className="mt-2 text-blue-700">Focus: {questConfig.reviewAdvice?.focus || currentLesson.title}</div>
                      </div>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => {
                            setQuestIndex(0)
                            setQuestAnswers({})
                            setQuestFeedback(null)
                            setQuestSubmitted(false)
                            setQuestResult(null)
                          }}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black"
                        >
                          Try again
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
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
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
      <style jsx global>{`
        .quest-pop {
          animation: quest-pop 520ms cubic-bezier(.2, 1.5, .35, 1);
        }

        .quest-wobble {
          animation: quest-wobble 420ms ease-in-out;
        }

        .quest-fireworks .quest-spark {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #facc15;
          box-shadow:
            18px 0 #22c55e,
            -14px 8px #3b82f6,
            6px -18px #f97316,
            -10px -14px #ec4899;
          opacity: 0;
          transform: scale(.4);
          animation: quest-spark 760ms ease-out forwards;
        }

        .quest-shake {
          animation: quest-shake-layer 420ms ease-in-out;
        }

        @keyframes quest-pop {
          0% { transform: scale(.97); }
          45% { transform: scale(1.035); }
          100% { transform: scale(1); }
        }

        @keyframes quest-wobble {
          0%, 100% { transform: translateX(0); }
          18% { transform: translateX(-8px) rotate(-.6deg); }
          38% { transform: translateX(7px) rotate(.5deg); }
          58% { transform: translateX(-4px) rotate(-.3deg); }
          78% { transform: translateX(3px); }
        }

        @keyframes quest-spark {
          0% { opacity: 0; transform: scale(.4) translateY(0); }
          18% { opacity: 1; transform: scale(1.2) translateY(-8px); }
          100% { opacity: 0; transform: scale(.1) translateY(-42px); }
        }

        @keyframes quest-shake-layer {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .quest-pop,
          .quest-wobble,
          .quest-shake,
          .quest-fireworks .quest-spark {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
