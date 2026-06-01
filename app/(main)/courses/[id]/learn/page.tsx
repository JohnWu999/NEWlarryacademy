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
  type: 'multiple-choice' | 'true-false' | 'order-steps' | 'numeric-input' | 'fill-blank' | 'multiple-select' | 'open-response'
  prompt: string
  choices: string[]
  answer?: string | string[]
  alternativeAnswers?: string[]
  acceptableKeywords?: string[]
  answerPreview?: string
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
  userProgress?: {
    progressPercentage: number
    lastWatchedPosition: number
    completedAt: string | null
  } | null
  latestPracticeAttempt?: PracticeAttemptSummary | null
  bestPracticeAttempt?: PracticeAttemptSummary | null
}

interface PracticeAttemptSummary {
  score: number | null
  maxScore: number | null
  completed: boolean
  earnedPoints: number
  earnedGems: number
  data?: string | null
  createdAt?: string
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

const lessonCoverThemes = [
  { background: 'radial-gradient(circle at 20% 18%, rgba(96, 165, 250, 0.82), transparent 28%), linear-gradient(135deg, #071326 0%, #123f6c 52%, #0a1018 100%)', accent: '#60a5fa' },
  { background: 'radial-gradient(circle at 78% 22%, rgba(45, 212, 191, 0.78), transparent 30%), linear-gradient(135deg, #071914 0%, #0f5a4b 50%, #09110f 100%)', accent: '#2dd4bf' },
  { background: 'radial-gradient(circle at 22% 76%, rgba(250, 204, 21, 0.74), transparent 28%), linear-gradient(135deg, #1d1306 0%, #7c4a12 52%, #100b05 100%)', accent: '#facc15' },
  { background: 'radial-gradient(circle at 76% 28%, rgba(167, 139, 250, 0.78), transparent 30%), linear-gradient(135deg, #120924 0%, #4c1d95 50%, #09050f 100%)', accent: '#a78bfa' },
  { background: 'radial-gradient(circle at 30% 18%, rgba(251, 113, 133, 0.76), transparent 28%), linear-gradient(135deg, #24070e 0%, #8f243b 50%, #110509 100%)', accent: '#fb7185' },
  { background: 'radial-gradient(circle at 75% 72%, rgba(52, 211, 153, 0.76), transparent 28%), linear-gradient(135deg, #061711 0%, #166247 52%, #07100d 100%)', accent: '#34d399' },
]

function getNgssLessonCover(index: number) {
  return `/lesson-covers/ngss-g6/lesson-${String(index + 1).padStart(2, '0')}.jpg`
}

const resumeCookiePrefix = 'larry_last_lesson'
const openLessonCount = 5

function getResumeCookieName(courseId: string) {
  return `${resumeCookiePrefix}_${courseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function setCookieValue(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
}

function getCookieValue(name: string) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
}

function getDraftKey(courseId: string, activityId: string) {
  return `larry_practice_draft_${courseId}_${activityId}`
}

function parseAttemptData(attempt?: PracticeAttemptSummary | null) {
  if (!attempt?.data) return null
  try {
    return JSON.parse(attempt.data) as {
      answers?: { questionId: string; value: string | string[] }[]
      results?: { correct: boolean }[]
      percent?: number
    }
  } catch {
    return null
  }
}

function isLessonCompleted(lesson: Lesson) {
  return Boolean(lesson.userProgress?.completedAt || lesson.latestPracticeAttempt?.completed)
}

function isLessonUnlocked(lessons: Lesson[], index: number) {
  if (index < openLessonCount) return true
  return lessons.slice(0, index).every(isLessonCompleted)
}

function getBestResumeIndex(lessons: Lesson[], preferredIndex = -1) {
  if (preferredIndex >= 0 && isLessonUnlocked(lessons, preferredIndex)) return preferredIndex
  const firstUnlockedIncomplete = lessons.findIndex((lesson, index) => isLessonUnlocked(lessons, index) && !isLessonCompleted(lesson))
  if (firstUnlockedIncomplete >= 0) return firstUnlockedIncomplete
  const lastUnlocked = lessons.findLastIndex((_, index) => isLessonUnlocked(lessons, index))
  return Math.max(0, lastUnlocked)
}

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function buildShuffledQuestionOrder(config: PracticeConfig) {
  const openResponse = config.questions.filter((question) => question.type === 'open-response')
  const closedQuestions = config.questions.filter((question) => question.type !== 'open-response')
  return [...shuffleItems(closedQuestions), ...openResponse].map((question) => question.id)
}

function getOrderedPracticeQuestions(config: PracticeConfig, questionOrder: string[]) {
  const byId = new Map(config.questions.map((question) => [question.id, question]))
  const ordered = questionOrder.map((id) => byId.get(id)).filter(Boolean) as PracticeQuestion[]
  const missing = config.questions.filter((question) => !questionOrder.includes(question.id))
  return [...ordered, ...missing]
}

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

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function LessonCoverMark({ index, completed, unlocked }: { index: number; completed: boolean; unlocked: boolean }) {
  if (completed) return <CheckIcon />
  if (!unlocked) return <LockIcon />
  return <span>{String(index + 1).padStart(2, '0')}</span>
}

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\times/g, 'x')
    .replace(/\\div/g, '÷')
    .replace(/\{,\}/g, ',')
    .replace(/[.$]/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
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
  if (question.type === 'open-response') {
    const response = Array.isArray(value) ? value.join(' ') : value
    const normalized = normalizeAnswer(response)
    const keywords = question.acceptableKeywords || []
    const keywordHits = keywords.filter((keyword) => normalized.includes(normalizeAnswer(keyword))).length
    return normalized.length >= 18 && (keywords.length === 0 || keywordHits >= Math.min(2, keywords.length))
  }
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
  const actual = normalizeAnswer(Array.isArray(value) ? value.join(' > ') : value)
  const accepted = [question.answer, ...(question.alternativeAnswers || [])]
    .filter((answer): answer is string => typeof answer === 'string')
    .map(normalizeAnswer)
  return accepted.some((answer) => answer === actual || (answer.length >= 4 && actual.includes(answer)) || (actual.length >= 4 && answer.includes(actual)))
}

function getQuestionLabel(type: PracticeQuestion['type']) {
  const labels: Record<PracticeQuestion['type'], string> = {
    'multiple-choice': 'Choose',
    'true-false': 'True / False',
    'order-steps': 'Order the steps',
    'numeric-input': 'Type the answer',
    'fill-blank': 'Fill the blank',
    'multiple-select': 'Select all',
    'open-response': 'Reflect',
  }
  return labels[type] || 'Practice'
}

function getQuestionKeywords(question: PracticeQuestion) {
  const source = `${question.prompt} ${question.visual || ''}`.toLowerCase()
  const scienceTerms = [
    'evidence',
    'model',
    'pattern',
    'variable',
    'data',
    'claim',
    'reasoning',
    'force',
    'energy',
    'particle',
    'density',
    'gravity',
    'friction',
    'wave',
    'light',
    'heat',
  ]
  const foundScience = scienceTerms.filter((term) => source.includes(term)).slice(0, 3)
  if (foundScience.length) return foundScience.map((term) => term.replace(/^\w/, (letter) => letter.toUpperCase()))

  const mathTerms = [
    ['percent', '%'],
    ['ratio', 'ratio'],
    ['area', 'area'],
    ['perimeter', 'perimeter'],
    ['angle', 'angle'],
    ['triangle', 'triangle'],
    ['fraction', 'fraction'],
    ['average', 'average'],
    ['speed', 'speed'],
    ['distance', 'distance'],
    ['time', 'time'],
  ]
  const foundMath = mathTerms.filter(([term]) => source.includes(term)).map(([, label]) => label).slice(0, 3)
  return foundMath.length ? foundMath : ['Model', 'Solve', 'Check']
}

function getQuestionNumbers(question: PracticeQuestion) {
  return question.prompt.match(/-?\d+(?:\.\d+)?%?/g)?.slice(0, 5) || []
}

function MathText({ text }: { text: string }) {
  const source = String(text)
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\Box/g, '□')
    .replace(/\{,\}/g, ',')
  const parts: Array<{ type: 'text' | 'frac'; text?: string; top?: string; bottom?: string }> = []
  let cursor = 0
  const fractionPattern = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g
  let match: RegExpExecArray | null
  while ((match = fractionPattern.exec(source))) {
    if (match.index > cursor) parts.push({ type: 'text', text: source.slice(cursor, match.index) })
    parts.push({ type: 'frac', top: match[1], bottom: match[2] })
    cursor = match.index + match[0].length
  }
  if (cursor < source.length) parts.push({ type: 'text', text: source.slice(cursor) })

  return (
    <>
      {parts.map((part, index) => part.type === 'frac' ? (
        <span key={index} className="mx-0.5 inline-flex translate-y-1 flex-col items-center align-middle text-[0.9em] font-black leading-none">
          <span className="border-b border-current px-1 pb-0.5">{part.top}</span>
          <span className="px-1 pt-0.5">{part.bottom}</span>
        </span>
      ) : (
        <span key={index}>{part.text}</span>
      ))}
    </>
  )
}

function QuestVisual({ question }: { question: PracticeQuestion }) {
  const { type } = question
  const keywords = getQuestionKeywords(question)
  const numbers = getQuestionNumbers(question)

  if (type === 'numeric-input' || type === 'fill-blank') {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-[#fff8e8] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Build the model</div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-900 ring-1 ring-amber-200">? = ___</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-xl bg-white p-3 ring-1 ring-amber-200">
            <div className="text-[10px] font-black uppercase text-amber-700">Given</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(numbers.length ? numbers : keywords).slice(0, 3).map((item) => (
                <span key={item} className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-black text-[#171717]">{item}</span>
              ))}
            </div>
          </div>
          <div className="hidden text-2xl font-black text-amber-700 sm:block">→</div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-amber-200">
            <div className="text-[10px] font-black uppercase text-amber-700">Find</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-black text-[#171717]">
              <span className="rounded-lg bg-[#171717] px-3 py-1 text-white">?</span>
              <span className="text-sm text-amber-800">use units and relationships</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'order-steps') {
    return (
      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-blue-800">Reasoning ladder</div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="rounded-xl bg-white p-3 ring-1 ring-blue-100">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">{step}</div>
              <div className="h-2 rounded-full bg-blue-100" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-blue-100" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'multiple-select') {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Choose every useful clue</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {keywords.map((keyword, index) => (
            <div key={keyword} className="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
              <div className={`mb-2 h-2 rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-cyan-400' : 'bg-lime-400'}`} />
              <div className="text-sm font-black text-emerald-950">{keyword}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'true-false') {
    return (
      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-sky-800">Test the statement</div>
        <div className="grid grid-cols-2 gap-3">
          {['Evidence supports it', 'Counterexample breaks it'].map((label) => (
            <div key={label} className="rounded-xl bg-white p-3 ring-1 ring-sky-100">
              <div className="text-sm font-black text-sky-950">{label}</div>
              <div className="mt-3 h-2 rounded-full bg-sky-100" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'open-response') {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-violet-100 bg-violet-50 p-3">
        {['Evidence', 'Model', 'Next test'].map((label, index) => (
          <div key={label} className="rounded-xl bg-white p-3 ring-1 ring-violet-100">
            <div className={`mb-2 h-2 rounded-full ${index === 0 ? 'bg-violet-500' : index === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <div className="text-[10px] font-black uppercase text-violet-800">{label}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">Think before choosing</div>
        <div className="text-xs font-black text-slate-500">{numbers.length ? numbers.join(' · ') : 'A · B · C · D'}</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {keywords.map((keyword) => (
          <div key={keyword} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-sm font-black text-slate-950">{keyword}</div>
          </div>
        ))}
      </div>
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
  const [questHintVisible, setQuestHintVisible] = useState(false)
  const [questSubmitted, setQuestSubmitted] = useState(false)
  const [questSaving, setQuestSaving] = useState(false)
  const [questAutoAdvancing, setQuestAutoAdvancing] = useState(false)
  const [questResult, setQuestResult] = useState<{ score: number; maxScore: number; percent: number; earnedPoints: number; earnedGems: number; wrongCount?: number } | null>(null)
  const [questEffect, setQuestEffect] = useState<{ kind: 'correct' | 'incorrect' | 'complete'; key: number } | null>(null)
  const [questQuestionOrder, setQuestQuestionOrder] = useState<string[]>([])

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
    const currentLesson = course?.lessons[currentLessonIndex]
    const attemptData = parseAttemptData(currentLesson?.latestPracticeAttempt)
    const practiceActivity = currentLesson?.activities?.find((activity) => activity.type === 'practice' && activity.config)
    const questConfig = parsePracticeConfig(practiceActivity)
    const draftKey = course?.id && activePracticeId ? getDraftKey(course.id, activePracticeId) : null
    let draft: { questIndex?: number; answers?: Record<string, string | string[]>; questionOrder?: string[] } | null = null
    if (draftKey) {
      try {
        const rawDraft = window.localStorage.getItem(draftKey)
        draft = rawDraft ? JSON.parse(rawDraft) : null
      } catch {
        draft = null
      }
    }
    const questionIds = questConfig?.questions.map((question) => question.id) || []
    const draftOrderIsValid = draft?.questionOrder?.length === questionIds.length && draft.questionOrder.every((id) => questionIds.includes(id))
    const nextQuestionOrder = questConfig
      ? currentLesson?.latestPracticeAttempt?.completed
        ? questionIds
        : draftOrderIsValid
        ? draft?.questionOrder || []
        : buildShuffledQuestionOrder(questConfig)
      : []

    setSelectedChoice(null)
    setPracticeChecked(false)
    setQuestQuestionOrder(nextQuestionOrder)
    setQuestIndex(Math.min(Math.max(0, Number(draft?.questIndex || 0)), Math.max(0, nextQuestionOrder.length - 1)))
    setQuestAnswers(
      currentLesson?.latestPracticeAttempt?.completed && attemptData?.answers
        ? Object.fromEntries(attemptData.answers.map((answer) => [answer.questionId, answer.value]))
        : draft?.answers || {}
    )
    setQuestFeedback(null)
    setQuestHintVisible(false)
    setQuestSubmitted(Boolean(currentLesson?.latestPracticeAttempt?.completed))
    setQuestResult(currentLesson?.latestPracticeAttempt?.completed ? {
      score: Number(currentLesson.latestPracticeAttempt.score || 0),
      maxScore: Number(currentLesson.latestPracticeAttempt.maxScore || 0),
      percent: Number(attemptData?.percent || 0),
      earnedPoints: 0,
      earnedGems: 0,
      wrongCount: attemptData?.results?.filter((result) => !result.correct).length || 0,
    } : null)
    setQuestEffect(null)
    setQuestAutoAdvancing(false)
  }, [course?.id, currentLessonIndex, activeLessonId, activePracticeId])

  useEffect(() => {
    const lesson = course?.lessons[currentLessonIndex]
    if (!course || !lesson) return
    setCookieValue(getResumeCookieName(course.id), lesson.id)
    if (!lesson.userProgress?.completedAt) {
      void saveLessonProgress(lesson, false, Math.max(10, Number(lesson.userProgress?.progressPercentage || 0)))
    }
  }, [course?.id, activeLessonId])

  useEffect(() => {
    if (!course || !activePracticeId || questSubmitted) return
    if (!Object.keys(questAnswers).length && questIndex === 0) return
    window.localStorage.setItem(getDraftKey(course.id, activePracticeId), JSON.stringify({
      questIndex,
      answers: questAnswers,
      questionOrder: questQuestionOrder,
      updatedAt: new Date().toISOString(),
    }))
  }, [course?.id, activePracticeId, questAnswers, questIndex, questQuestionOrder, questSubmitted])

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
        if (index !== -1) {
          const resumeIndex = getBestResumeIndex(courseData.lessons, index)
          setCurrentLessonIndex(resumeIndex)
          setCookieValue(getResumeCookieName(courseData.id), courseData.lessons[resumeIndex]?.id || lessonId)
        }
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
        const resumeLessonId = getCookieValue(getResumeCookieName(data.id))
        const resumeIndex = data.lessons.findIndex((lesson: Lesson) => lesson.id === resumeLessonId)
        setCurrentLessonIndex(getBestResumeIndex(data.lessons, resumeIndex))
      } else {
        router.push('/courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveLessonProgress = async (lesson: Lesson, completed: boolean, lessonProgressPercentage = completed ? 100 : 10) => {
    if (!course) return
    setSavingProgress(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          lessonProgressPercentage,
          completed,
        }),
      })
      if (response.ok && completed) {
        setCourse((current) => current ? {
          ...current,
          lessons: current.lessons.map((item) => item.id === lesson.id ? {
            ...item,
            userProgress: {
              progressPercentage: 100,
              lastWatchedPosition: Number(item.duration || 0),
              completedAt: new Date().toISOString(),
            },
          } : item),
        } : current)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setSavingProgress(false)
    }
  }

  const goToLesson = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, (course?.lessons.length || 1) - 1))
    const lesson = course?.lessons[nextIndex]
    if (course && !isLessonUnlocked(course.lessons, nextIndex)) return
    if (course && lesson) setCookieValue(getResumeCookieName(course.id), lesson.id)
    setCurrentLessonIndex(nextIndex)
  }

  const markPracticeComplete = async (force = false) => {
    if (!course || (!force && !selectedIsCorrect)) return
    setPracticeChecked(true)
    await saveLessonProgress(course.lessons[currentLessonIndex], true)
  }

  const checkFallbackPractice = async () => {
    setPracticeChecked(true)
    if (selectedIsCorrect) await markPracticeComplete()
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
    setQuestHintVisible(false)
    setQuestEffect(null)
  }

  const recordWrongQuestion = async (activity: LessonActivity, question: PracticeQuestion, value: string | string[]) => {
    try {
      await fetch('/api/wrong-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          questionId: question.id,
          value,
        }),
      })
    } catch (error) {
      console.error('Error recording wrong question:', error)
    }
  }

  const checkCurrentQuest = (question: PracticeQuestion, config: PracticeConfig, activity: LessonActivity) => {
    if (questAutoAdvancing) return
    const value = questAnswers[question.id] || ''
    const correct = checkPracticeAnswer(question, value)
    setQuestFeedback(correct ? 'correct' : 'incorrect')
    setQuestEffect({ kind: correct ? 'correct' : 'incorrect', key: Date.now() })
    setQuestAutoAdvancing(true)
    playFeedbackTone(correct ? 'correct' : 'incorrect')
    if (!correct) {
      void recordWrongQuestion(activity, question, value)
    }
    window.setTimeout(() => {
      void continueQuest(config, activity)
    }, correct ? 950 : 1250)
  }

  const continueQuest = async (config: PracticeConfig, activity: LessonActivity) => {
    const orderedQuestions = getOrderedPracticeQuestions(config, questQuestionOrder)
    if (questIndex < orderedQuestions.length - 1) {
      setQuestIndex((index) => index + 1)
      setQuestFeedback(null)
      setQuestHintVisible(false)
      setQuestEffect(null)
      setQuestAutoAdvancing(false)
      return
    }

    setQuestSaving(true)
    try {
      const answers = orderedQuestions.map((question) => ({
        questionId: question.id,
        value: questAnswers[question.id] || '',
      }))
      const response = await fetch(`/api/activities/${activity.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, recordWrongQuestions: false }),
      })
      if (response.ok) {
        const result = await response.json()
        setQuestResult(result)
        setQuestSubmitted(true)
        setQuestEffect({ kind: 'complete', key: Date.now() })
        playFeedbackTone('complete')
        if (result.earnedPoints > 0 || result.earnedGems > 0) {
          window.dispatchEvent(new CustomEvent('larry:reward-earned', {
            detail: {
              points: Number(result.earnedPoints || 0),
              gems: Number(result.earnedGems || 0),
            },
          }))
        }
        if (course) {
          const completedLesson = course.lessons[currentLessonIndex]
          setCourse((current) => current ? {
            ...current,
            lessons: current.lessons.map((lesson) => lesson.id === completedLesson.id ? {
              ...lesson,
              userProgress: {
                progressPercentage: 100,
                lastWatchedPosition: Number(lesson.duration || 0),
                completedAt: new Date().toISOString(),
              },
              latestPracticeAttempt: {
                score: Number(result.score || 0),
                maxScore: Number(result.maxScore || 0),
                completed: true,
                earnedPoints: Number(result.earnedPoints || 0),
                earnedGems: Number(result.earnedGems || 0),
                data: JSON.stringify({
                  answers,
                  results: result.results || [],
                  percent: result.percent,
                  maxCorrectStreak: result.maxCorrectStreak,
                }),
              },
              bestPracticeAttempt: lesson.bestPracticeAttempt && Number(lesson.bestPracticeAttempt.score || 0) > Number(result.score || 0)
                ? lesson.bestPracticeAttempt
                : {
                    score: Number(result.score || 0),
                    maxScore: Number(result.maxScore || 0),
                    completed: true,
                    earnedPoints: Number(result.earnedPoints || 0),
                    earnedGems: Number(result.earnedGems || 0),
                    data: JSON.stringify({
                      answers,
                      results: result.results || [],
                      percent: result.percent,
                      maxCorrectStreak: result.maxCorrectStreak,
                    }),
                  },
            } : lesson),
          } : current)
          if (activePracticeId) window.localStorage.removeItem(getDraftKey(course.id, activePracticeId))
        }
        await markPracticeComplete(true)
      }
    } catch (error) {
      console.error('Error saving quest:', error)
    } finally {
      setQuestSaving(false)
      setQuestAutoAdvancing(false)
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
  const orderedQuestQuestions = questConfig ? getOrderedPracticeQuestions(questConfig, questQuestionOrder) : []
  const currentQuestQuestion = orderedQuestQuestions[questIndex]
  const questScorePreview = orderedQuestQuestions.reduce((sum, question) => {
    const value = questAnswers[question.id]
    if (!hasQuestAnswer(question, value)) return sum
    return sum + (checkPracticeAnswer(question, value) ? question.points : -question.penalty)
  }, 0) || 0
  const practice = buildPracticePrompt(currentLesson)
  const completedLessonIds = new Set(course.lessons.filter((lesson) => lesson.userProgress?.completedAt || lesson.latestPracticeAttempt?.completed).map((lesson) => lesson.id))
  const completedLessonCount = completedLessonIds.size
  const progressPercent = Math.round((completedLessonCount / course.lessons.length) * 100)
  const currentLessonComplete = completedLessonIds.has(currentLesson.id)
  const selectedIsCorrect = selectedChoice === practice.answer
  const nextLessonUnlocked = currentLessonIndex < course.lessons.length - 1 && isLessonUnlocked(course.lessons, currentLessonIndex + 1)

  const learningSteps = [
    {
      title: 'Watch',
      text: 'Follow Larry’s explanation and pause when the diagram or equation changes.',
      active: true,
    },
    {
      title: 'Practice',
      text: currentLesson.hasPractice ? 'Complete the quick check below to lock in the method.' : 'A quick check is ready here while the full worksheet is being prepared.',
      active: practiceChecked || currentLessonComplete,
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
                <span>Completed lessons</span>
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
              disabled={currentLessonIndex === course.lessons.length - 1 || !nextLessonUnlocked}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next lesson"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6">
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

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">Views</div>
                  <div className="mt-2 text-xl font-black text-white">{currentLesson.viewCount || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#101012] p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Course Map</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {completedLessonCount} of {course.lessons.length} lessons completed. New lessons unlock as you finish each quiz.
                </p>
              </div>
              <div className="min-w-[180px]">
                <div className="mb-2 flex justify-between text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {course.lessons.map((lesson, index) => {
                const active = currentLessonIndex === index
                const completed = completedLessonIds.has(lesson.id)
                const unlocked = isLessonUnlocked(course.lessons, index)
                const latestAttemptData = parseAttemptData(lesson.latestPracticeAttempt)
                const theme = lessonCoverThemes[index % lessonCoverThemes.length]
                const coverUrl = getNgssLessonCover(index)
                return (
                  <button
                    key={lesson.id}
                    onClick={() => goToLesson(index)}
                    disabled={!unlocked}
                    className={`group overflow-hidden rounded-3xl border text-left transition ${
                      active
                        ? 'border-blue-400 bg-blue-500/10 shadow-2xl shadow-blue-950/40'
                        : unlocked
                        ? 'border-white/10 bg-white/[0.035] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]'
                        : 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] opacity-55'
                    }`}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden" style={{ background: theme.background }}>
                      <img
                        src={coverUrl}
                        alt=""
                        loading="lazy"
                        className={`h-full w-full object-cover transition duration-500 ${unlocked ? 'group-hover:scale-105' : 'grayscale'}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/12 to-black/20" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.24),transparent_24%)]" />
                      <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/35 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur">
                        <LessonCoverMark index={index} completed={completed} unlocked={unlocked} />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                          <span>{lesson.gradeLevel || 'Lesson'}</span>
                          <span>{formatDuration(lesson.duration)}</span>
                          <span>{unlocked ? 'Quiz' : 'Locked'}</span>
                        </div>
                        <div className="line-clamp-2 text-xl font-black leading-tight text-white drop-shadow">
                          {lesson.title.replace(/^NGSS G6 Science\s*\d+:\s*/i, '').replace(/^Larry Math Class\s*/i, '')}
                        </div>
                      </div>
                      <div className="absolute right-4 top-4 h-3 w-3 rounded-full shadow-[0_0_28px_currentColor]" style={{ color: theme.accent, backgroundColor: theme.accent }} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`text-xs font-black uppercase tracking-[0.16em] ${active ? 'text-blue-300' : completed ? 'text-emerald-300' : unlocked ? 'text-gray-500' : 'text-gray-700'}`}>
                          {active ? 'Now Playing' : completed ? 'Completed' : unlocked ? 'Unlocked' : 'Locked'}
                        </div>
                        {lesson.latestPracticeAttempt?.completed && (
                          <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-300">
                            {lesson.bestPracticeAttempt?.score || lesson.latestPracticeAttempt.score || 0}/{lesson.bestPracticeAttempt?.maxScore || lesson.latestPracticeAttempt.maxScore || 100}
                          </div>
                        )}
                      </div>
                      <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm leading-6 text-gray-500">
                        {lesson.description || 'Watch the lesson and complete the quiz to keep moving.'}
                      </p>
                      {latestAttemptData?.percent !== undefined && !lesson.latestPracticeAttempt?.completed && (
                        <div className="mt-3 text-xs font-black text-blue-300">{latestAttemptData.percent}% saved</div>
                      )}
                    </div>
                  </button>
                )
              })}
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
                    {orderedQuestQuestions.map((question, index) => {
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
                          Question {questIndex + 1} of {orderedQuestQuestions.length}
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
                          <p className="text-lg font-black leading-8">
                            <MathText text={currentQuestQuestion.prompt} />
                          </p>
                          <QuestVisual question={currentQuestQuestion} />

                          {currentQuestQuestion.type === 'open-response' ? (
                            <div className="mt-5">
                              <textarea
                                value={String(questAnswers[currentQuestQuestion.id] || '')}
                                onChange={(event) => answerCurrentQuest(currentQuestQuestion, event.target.value)}
                                disabled={Boolean(questFeedback) || questAutoAdvancing}
                                placeholder={currentQuestQuestion.inputPlaceholder || 'Write your idea in 2-3 sentences.'}
                                rows={5}
                                className="min-h-[150px] w-full resize-y rounded-2xl border-2 border-[#171717] bg-white px-5 py-4 text-base font-bold leading-7 text-[#171717] outline-none shadow-[0_8px_0_#171717] placeholder:text-[#b6ad9d] focus:border-violet-600 disabled:opacity-70"
                              />
                              <p className="mt-3 text-xs font-bold text-[#857b69]">Use evidence, a model, or a next-test idea. There is no single perfect answer.</p>
                            </div>
                          ) : currentQuestQuestion.type === 'numeric-input' || currentQuestQuestion.type === 'fill-blank' ? (
                            <div className="mt-5">
                              <div className="flex overflow-hidden rounded-2xl border-2 border-[#171717] bg-white shadow-[0_8px_0_#171717] focus-within:border-blue-600">
                                <input
                                  value={String(questAnswers[currentQuestQuestion.id] || '')}
                                  onChange={(event) => answerCurrentQuest(currentQuestQuestion, event.target.value)}
                                  disabled={Boolean(questFeedback) || questAutoAdvancing}
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
                                          if (isSelected || questFeedback || questAutoAdvancing) return
                                          answerCurrentQuest(currentQuestQuestion, [...selectedValue, choice])
                                        }}
                                        disabled={isSelected || Boolean(questFeedback) || questAutoAdvancing}
                                        className={`w-full rounded-2xl border p-3 text-left text-sm font-bold leading-6 transition ${
                                          isSelected ? 'border-blue-200 bg-blue-50 text-blue-900 opacity-60' : 'border-[#e2ded3] bg-white hover:border-blue-400 hover:bg-blue-50'
                                        }`}
	                                      >
	                                        <MathText text={choice} />
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
                                      if (questFeedback || questAutoAdvancing) return
                                      answerCurrentQuest(currentQuestQuestion, [])
                                      setQuestFeedback(null)
                                    }}
                                    disabled={Boolean(questFeedback) || questAutoAdvancing}
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
                                        if (questFeedback || questAutoAdvancing) return
                                        const selectedValue = Array.isArray(questAnswers[currentQuestQuestion.id]) ? questAnswers[currentQuestQuestion.id] as string[] : []
                                        answerCurrentQuest(currentQuestQuestion, selectedValue.filter((_, selectedIndex) => selectedIndex !== index))
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl bg-[#171717] p-3 text-left text-sm font-black text-white"
                                    >
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500">{index + 1}</span>
	                                      <MathText text={choice} />
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
                                const showCorrect = questFeedback === 'correct' && isCorrectChoice
                                const showWrong = questFeedback === 'incorrect' && isSelected && !isCorrectChoice
                                return (
                                  <button
                                    key={choice}
                                    onClick={() => {
                                      if (questFeedback || questAutoAdvancing) return
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
	                                    <MathText text={choice} />
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {(questFeedback || questHintVisible) && (
                        <div className={`mt-5 rounded-2xl p-4 text-sm font-bold leading-6 ${questFeedback === 'correct' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}>
                          <div>{questFeedback === 'correct' ? currentQuestQuestion.encouragement?.correct || 'Correct.' : questHintVisible ? 'Try this hint before checking.' : currentQuestQuestion.encouragement?.incorrect || 'Not quite yet.'}</div>
                          <div className="mt-2 font-semibold">
                            {questFeedback === 'correct'
                              ? currentQuestQuestion.explanation
                              : questHintVisible
                              ? currentQuestQuestion.hint
                              : `${currentQuestQuestion.hint} This one is saved to your mistake notebook. Next question is coming up.`}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => checkCurrentQuest(currentQuestQuestion, questConfig, practiceActivity)}
                          disabled={!hasQuestAnswer(currentQuestQuestion, questAnswers[currentQuestQuestion.id]) || questSaving || questAutoAdvancing}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {questSaving ? 'Saving...' : questAutoAdvancing ? (questIndex === orderedQuestQuestions.length - 1 ? 'Finishing quest...' : 'Next question...') : 'Check answer'}
                        </button>
                        <button
                          onClick={() => {
                            setQuestHintVisible(true)
                          }}
                          disabled={Boolean(questFeedback) || questAutoAdvancing}
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
                        {questResult?.wrongCount ? (
                          <div className="mt-3 rounded-xl bg-white/70 px-4 py-2 text-xs font-black text-blue-800">
                            {questResult.wrongCount} question{questResult.wrongCount > 1 ? 's were' : ' was'} saved. Review them from Profile.
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => {
                            setQuestIndex(0)
                            setQuestAnswers({})
                            setQuestQuestionOrder(questConfig ? buildShuffledQuestionOrder(questConfig) : [])
                            setQuestFeedback(null)
                            setQuestHintVisible(false)
                            setQuestSubmitted(false)
                            setQuestResult(null)
                            setQuestAutoAdvancing(false)
                            if (course && activePracticeId) window.localStorage.removeItem(getDraftKey(course.id, activePracticeId))
                          }}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black"
                        >
                          Try again
                        </button>
                        <button
                          onClick={() => goToLesson(currentLessonIndex + 1)}
                          disabled={currentLessonIndex === course.lessons.length - 1 || !nextLessonUnlocked}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d7d0c3] px-5 py-4 text-sm font-black text-[#171717] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {nextLessonUnlocked || currentLessonIndex === course.lessons.length - 1 ? 'Next lesson' : 'Complete this quiz to unlock'}
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
                        onClick={checkFallbackPractice}
                        disabled={!selectedChoice || savingProgress}
                        className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingProgress ? 'Saving...' : practiceChecked ? 'Saved' : 'Check answer'}
                      </button>
                      <button
                        onClick={() => goToLesson(currentLessonIndex + 1)}
                        disabled={currentLessonIndex === course.lessons.length - 1 || !nextLessonUnlocked}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d7d0c3] px-5 py-4 text-sm font-black text-[#171717] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {nextLessonUnlocked || currentLessonIndex === course.lessons.length - 1 ? 'Next lesson' : 'Complete this quiz to unlock'}
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
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
