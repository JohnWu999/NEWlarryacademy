'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import PurchaseCourseButton from '@/components/courses/PurchaseCourseButton'
import LearningGameShowcase, { type TemplateId } from '@/components/games/LearningGameShowcase'
import { useLanguage } from '@/context/LanguageContext'
import { getPeerLearningCount } from '@/lib/peer-learning'
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
  visualAsset?: string
  visualCaption?: string
  inputPlaceholder?: string
  unit?: string
  tolerance?: number
  encouragement?: {
    correct?: string
    incorrect?: string
  }
}

interface SurprisePracticeGame {
  id: string
  templateId: TemplateId
  insertAfter: number
  title?: string
  titleZh?: string
  titleEn?: string
  description?: string
  descriptionZh?: string
  descriptionEn?: string
  requiredRounds?: number
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
  surpriseGame?: SurprisePracticeGame
  questions: PracticeQuestion[]
}

type QuestSequenceItem =
  | { type: 'question'; id: string }
  | { type: 'game'; id: string }

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
  price: number
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

function getNgssLessonCover(courseId: string, index: number) {
  if (courseId === 'course-ngss-science-g4') {
    return `/lesson-covers/ngss-g4/lesson-${String(index + 1).padStart(2, '0')}.jpg`
  }
  if (courseId === 'course-ngss-science-g7') {
    return `/lesson-covers/ngss-g7/lesson-${String(index + 1).padStart(2, '0')}.jpg`
  }
  return `/lesson-covers/ngss-g6/lesson-${String(index + 1).padStart(2, '0')}.jpg`
}

function isIbMathCourse(course?: Course | null) {
  return Boolean(course?.id.includes('ib') || course?.title.toLowerCase().includes('ib big math'))
}

function isLarryMathCourse(course?: Course | null) {
  return Boolean(course?.id.includes('larry-math') || course?.title.toLowerCase().includes('larry math'))
}

function getLessonCoverUrl(course: Course, index: number) {
  if (course.id === 'course-ib-big-math') {
    return `/lesson-covers/ib-myp-g6/lesson-${String(index + 1).padStart(2, '0')}.svg`
  }
  if (course.id === 'course-ngss-science-g4' || course.id === 'course-ngss-science' || course.id === 'course-ngss-science-g7') return getNgssLessonCover(course.id, index)
  return null
}

function getLessonCardTitle(lesson: Lesson) {
  return lesson.title
    .replace(/^NGSS G[678]\s+Science\s*\d+:\s*/i, '')
    .replace(/^Larry Math Class\s*/i, '')
    .replace(/^IB G[45]\s+Level\s+\d+\s*\|\s*/i, '')
}

const ibMathCardMotifs = [
  { formula: 'ratio', symbol: '3:5', detail: 'unit rate' },
  { formula: 'area', symbol: 'A = l × w', detail: 'model' },
  { formula: 'percent', symbol: '25%', detail: 'change' },
  { formula: 'graph', symbol: 'y = 4x + 3', detail: 'rule' },
  { formula: 'volume', symbol: 'V = lwh', detail: '3D' },
  { formula: 'data', symbol: 'mean', detail: 'evidence' },
]

const larryMathCardMotifs = [
  { sketch: 'number-line', symbol: '42', label: 'Mental math', accent: '#38bdf8' },
  { sketch: 'bar-model', symbol: 'A + B', label: 'Visual model', accent: '#34d399' },
  { sketch: 'fraction', symbol: '3/4', label: 'Parts and whole', accent: '#f59e0b' },
  { sketch: 'geometry', symbol: 'A', label: 'Shape reasoning', accent: '#a78bfa' },
  { sketch: 'logic', symbol: 'AMC', label: 'Problem solving', accent: '#fb7185' },
  { sketch: 'graph', symbol: 'x', label: 'Pattern thinking', accent: '#22d3ee' },
]

function getLarryMathLessonMotif(lesson: Lesson, index: number) {
  const text = `${lesson.title} ${lesson.description || ''}`.toLowerCase()
  if (text.includes('fraction') || text.includes('percent') || text.includes('ratio') || text.includes('rate')) {
    return larryMathCardMotifs[2]
  }
  if (text.includes('triangle') || text.includes('circle') || text.includes('angle') || text.includes('area') || text.includes('geometry') || text.includes('cube')) {
    return larryMathCardMotifs[3]
  }
  if (text.includes('word') || text.includes('speed') || text.includes('distance') || text.includes('time') || text.includes('model')) {
    return larryMathCardMotifs[1]
  }
  if (text.includes('pattern') || text.includes('sequence') || text.includes('graph') || text.includes('average') || text.includes('data')) {
    return larryMathCardMotifs[5]
  }
  if (text.includes('logic') || text.includes('amc') || text.includes('combin') || text.includes('factor') || text.includes('prime')) {
    return larryMathCardMotifs[4]
  }
  return larryMathCardMotifs[index % larryMathCardMotifs.length]
}

function LarryMathLessonVisual({
  lesson,
  index,
  unlocked,
}: {
  lesson: Lesson
  index: number
  unlocked: boolean
}) {
  const motif = getLarryMathLessonMotif(lesson, index)
  const title = getLessonCardTitle(lesson)

  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#f7f5ef] text-[#151515] transition duration-500 ${unlocked ? 'group-hover:scale-[1.015]' : 'grayscale'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(255,255,255,0.9),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,232,222,0.9))]" />
      <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="absolute left-20 top-4 flex items-center gap-2">
        <span className="rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
          Larry Math
        </span>
        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_22px_currentColor]" style={{ backgroundColor: motif.accent, color: motif.accent }} />
      </div>

      <div className="absolute right-4 top-4 rounded-full border border-black/10 bg-white/75 px-3 py-1 text-[10px] font-black text-black/50">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="absolute inset-x-5 top-14 h-[42%] rounded-[1.35rem] border border-black/10 bg-white/72 shadow-sm">
        {motif.sketch === 'number-line' && (
          <div className="absolute inset-x-7 top-1/2">
            <div className="h-1 rounded-full bg-[#171717]" />
            {[0, 1, 2, 3, 4, 5].map((tick) => (
              <span key={tick} className="absolute -top-2 h-5 w-px bg-[#171717]" style={{ left: `${tick * 20}%` }}>
                <span className="absolute -bottom-7 -translate-x-1/2 text-[10px] font-black text-black/45">{tick * 10}</span>
              </span>
            ))}
            <span className="absolute -top-5 left-[62%] h-4 w-4 rounded-full border-4 border-sky-400 bg-white shadow-lg" />
          </div>
        )}

        {motif.sketch === 'bar-model' && (
          <div className="flex h-full flex-col justify-center gap-2 px-7">
            <div className="grid grid-cols-[1.4fr_1fr] gap-1.5">
              <span className="h-7 rounded-lg bg-emerald-300" />
              <span className="h-7 rounded-lg bg-cyan-300" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <span className="h-6 rounded-lg border border-black/15 bg-white" />
              <span className="h-6 rounded-lg border border-black/15 bg-white" />
              <span className="h-6 rounded-lg border border-black/15 bg-white" />
            </div>
          </div>
        )}

        {motif.sketch === 'fraction' && (
          <div className="flex h-full items-center justify-center gap-2">
            {Array.from({ length: 6 }).map((_, part) => (
              <span key={part} className={`h-12 w-7 rounded-xl border border-black/10 ${part < 4 ? 'bg-amber-300' : 'bg-white'}`} />
            ))}
          </div>
        )}

        {motif.sketch === 'geometry' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-24 w-32" viewBox="0 0 150 110" aria-hidden="true">
              <path d="M25 88 L76 18 L126 88 Z" fill="rgba(167,139,250,0.25)" stroke="#7c3aed" strokeWidth="5" strokeLinejoin="round" />
              <path d="M38 88 H112" stroke="#111" strokeWidth="4" strokeLinecap="round" />
              <circle cx="76" cy="18" r="5" fill="#111" />
            </svg>
          </div>
        )}

        {motif.sketch === 'logic' && (
          <div className="grid h-full grid-cols-4 gap-2 p-6">
            {Array.from({ length: 12 }).map((_, cell) => (
              <span key={cell} className={`rounded-xl border border-black/10 ${cell === 2 || cell === 5 || cell === 11 ? 'bg-rose-300' : 'bg-white'}`} />
            ))}
          </div>
        )}

        {motif.sketch === 'graph' && (
          <svg className="absolute inset-5 h-[calc(100%-2.5rem)] w-[calc(100%-2.5rem)]" viewBox="0 0 180 90" aria-hidden="true">
            <path d="M12 78 H172 M12 78 V8" stroke="rgba(0,0,0,0.32)" strokeWidth="3" strokeLinecap="round" />
            <path d="M18 70 C48 26 70 60 98 34 S145 30 166 14" fill="none" stroke="#06b6d4" strokeWidth="7" strokeLinecap="round" />
            <circle cx="98" cy="34" r="6" fill="#111" />
          </svg>
        )}
      </div>

      <div className="absolute inset-x-5 bottom-4 rounded-[1.35rem] border border-black/10 bg-white/90 p-3 shadow-sm">
        <p className="line-clamp-2 text-[17px] font-black leading-tight text-[#111]">{title}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/45">{motif.label}</p>
      </div>
    </div>
  )
}

const pathwayModules = [
  {
    id: 'course-ib-pyp-g4',
    title: 'IB Big Math Grade 4',
    href: '/courses/course-ib-pyp-g4',
    cover: '/course-covers/ib-g4-cover.svg',
    status: 'Foundation',
    summary: 'A 40-lesson foundation quest for fractions, operations, geometry, data, and model thinking.',
  },
  {
    id: 'course-ib-big-math',
    title: 'IB Big Math G6 (MYP)',
    href: '/courses/course-ib-big-math',
    cover: '/course-covers/ib-g6-pyp-cover.svg',
    status: 'Next Pathway',
    summary: 'A 40-lesson bridge into MYP-style reasoning: ratios, geometry, data, algebra, and multi-step modeling.',
  },
  {
    id: 'course-ib-big-math-g7-pyp',
    title: 'IB Big Math G7',
    href: '/courses/course-ib-big-math-g7-pyp',
    cover: '/course-covers/ib-g7-pyp-cover.svg',
    status: 'Coming Soon',
    summary: 'A deeper reasoning path for proportional relationships, probability, statistics, area, volume, and algebraic patterns.',
  },
  {
    id: 'course-ib-big-math-g8-pyp',
    title: 'IB Big Math G8',
    href: '/courses/course-ib-big-math-g8-pyp',
    cover: '/course-covers/ib-g8-pyp-cover.svg',
    status: 'Coming Soon',
    summary: 'A high-school-ready launchpad for equations, functions, coordinate geometry, transformations, and proof-style thinking.',
  },
]

const resumeCookiePrefix = 'larry_last_lesson'
const previewLessonCount = 3

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

function isPreviewLesson(lesson: Lesson | undefined, index: number) {
  return Boolean(lesson?.isPreview || index < previewLessonCount)
}

function isLessonUnlocked(course: Course, index: number) {
  if (isLarryMathCourse(course)) return true
  const lesson = course.lessons[index]
  if (isPreviewLesson(lesson, index)) return true
  if (!course.hasAccess) return false
  return course.lessons.slice(previewLessonCount, index).every(isLessonCompleted)
}

function getBestResumeIndex(course: Course, preferredIndex = -1) {
  if (preferredIndex >= 0 && isLessonUnlocked(course, preferredIndex)) return preferredIndex
  const firstUnlockedIncomplete = course.lessons.findIndex((lesson, index) => isLessonUnlocked(course, index) && !isLessonCompleted(lesson))
  if (firstUnlockedIncomplete >= 0) return firstUnlockedIncomplete
  const lastUnlocked = course.lessons.findLastIndex((_, index) => isLessonUnlocked(course, index))
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

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function seededShuffleItems<T>(items: T[], seed: string) {
  const shuffled = [...items]
  let state = hashString(seed) || 1
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    const swapIndex = state % (index + 1)
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

function buildQuestSequence(config: PracticeConfig, questionOrder: string[]) {
  const questionItems = getOrderedPracticeQuestions(config, questionOrder).map((question) => ({
    type: 'question' as const,
    id: question.id,
  }))
  const game = config.surpriseGame
  if (!game || !questionItems.length) return questionItems

  const maxInsertAfter = Math.max(1, Math.min(14, questionItems.length - 1))
  const insertAfter = Math.max(1, Math.min(Number(game.insertAfter || 8), maxInsertAfter))
  return [
    ...questionItems.slice(0, insertAfter),
    { type: 'game' as const, id: game.id },
    ...questionItems.slice(insertAfter),
  ]
}

function getQuestionNumberInSequence(sequence: QuestSequenceItem[], index: number) {
  return sequence.slice(0, index + 1).filter((item) => item.type === 'question').length
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

function XIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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

function extractNumbers(value: string) {
  return value
    .match(/-?\d[\d,]*(?:\.\d+)?/g)
    ?.map((item) => Number(item.replace(/,/g, '')))
    .filter((item) => Number.isFinite(item)) || []
}

function getPromptProduct(prompt = '') {
  const source = prompt
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\times/g, 'x')
    .replace(/×/g, 'x')
  const match = source.match(/(-?\d[\d,]*(?:\.\d+)?)\s*(?:x|\*)\s*(-?\d[\d,]*(?:\.\d+)?)/i)
  if (!match) return null
  const left = Number(match[1].replace(/,/g, ''))
  const right = Number(match[2].replace(/,/g, ''))
  return Number.isFinite(left) && Number.isFinite(right) ? left * right : null
}

function isEstimateRangeQuestion(question: PracticeQuestion) {
  const prompt = normalizeAnswer(question.prompt)
  return prompt.includes('underestimate') && prompt.includes('overestimate') && getPromptProduct(question.prompt) !== null
}

function getOpenResponseGuide(question: PracticeQuestion) {
  if (isEstimateRangeQuestion(question)) {
    return {
      label: 'Answer format',
      placeholder: 'Underestimate: ___\nOverestimate: ___\nReason: I rounded ...',
      helper: 'Enter two estimates. One must be lower than the real product, and one must be higher.',
      checks: ['Include 2 numbers', 'One underestimate', 'One overestimate'],
    }
  }

  return {
    label: 'Answer format',
    placeholder: question.inputPlaceholder || 'I think ... because ...',
    helper: 'Write one clear sentence. Use math words, a number, or a model from the problem.',
    checks: ['A complete thought', 'Use a number or model', 'Explain why'],
  }
}

function evaluateOpenResponse(question: PracticeQuestion, value: string | string[] | null) {
  const response = Array.isArray(value) ? value.join(' ') : String(value || '')
  const normalized = normalizeAnswer(response)
  if (!normalized) {
    return { correct: false, message: 'Add your answer first.' }
  }

  if (isEstimateRangeQuestion(question)) {
    const target = getPromptProduct(question.prompt)
    const numbers = extractNumbers(response)
    const hasUnder = target !== null && numbers.some((number) => number < target)
    const hasOver = target !== null && numbers.some((number) => number > target)
    if (numbers.length < 2) {
      return { correct: false, message: 'I need two estimates: one underestimate and one overestimate.' }
    }
    if (!hasUnder && !hasOver) {
      return { correct: false, message: 'These numbers are on the same side. Make one estimate lower and one estimate higher than the real product.' }
    }
    if (!hasUnder) {
      return { correct: false, message: 'I can see an overestimate. Add one estimate that is lower than the real product.' }
    }
    if (!hasOver) {
      return { correct: false, message: 'I can see an underestimate. Add one estimate that is higher than the real product.' }
    }
    return { correct: true, message: 'Good range. You bracketed the real product with a lower and higher estimate.' }
  }

  const keywords = question.acceptableKeywords || []
  const keywordHits = keywords.filter((keyword) => normalized.includes(normalizeAnswer(keyword))).length
  const needsKeywords = keywords.length > 0 && keywordHits < Math.min(2, keywords.length)
  if (normalized.length < 18 && needsKeywords) {
    return { correct: false, message: `Make it a fuller sentence and include at least ${Math.min(2, keywords.length)} key idea${Math.min(2, keywords.length) > 1 ? 's' : ''}.` }
  }
  if (normalized.length < 18) {
    return { correct: false, message: 'Make it a fuller sentence so your reasoning is clear.' }
  }
  if (needsKeywords) {
    return { correct: false, message: `Use more math language from the problem. Try including: ${keywords.slice(0, 3).join(', ')}.` }
  }
  return { correct: true, message: 'Clear explanation.' }
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
    return evaluateOpenResponse(question, value).correct
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

function scorePracticeLocally(questions: PracticeQuestion[], answers: { questionId: string; value: string | string[] }[]) {
  const answersById = new Map(answers.map((answer) => [answer.questionId, answer.value]))
  const maxScore = questions.reduce((sum, question) => sum + Number(question.points || 0), 0)
  let rawScore = 0
  let currentCorrectStreak = 0
  let maxCorrectStreak = 0
  const results = questions.map((question) => {
    const correct = checkPracticeAnswer(question, answersById.get(question.id) || null)
    currentCorrectStreak = correct ? currentCorrectStreak + 1 : 0
    maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak)
    rawScore += correct ? Number(question.points || 0) : -Number(question.penalty || 0)
    return {
      questionId: question.id,
      correct,
      points: correct ? Number(question.points || 0) : -Number(question.penalty || 0),
      explanation: question.explanation || null,
      hint: question.hint || null,
    }
  })
  const score = Math.max(0, rawScore)
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return {
    score,
    maxScore,
    percent,
    completed: answers.length >= questions.length,
    earnedPoints: score,
    earnedGems: Math.floor(maxCorrectStreak / 10),
    maxCorrectStreak,
    wrongCount: results.filter((result) => !result.correct).length,
    results,
  }
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
  if (!question.visualAsset && !question.visual) return null
  if (question.visual && !question.visual.startsWith('/')) return null
  const source = question.visualAsset || question.visual
  if (!source) return null
  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-[#eadfcd] bg-[#fffaf1] p-3">
      <img src={source} alt={question.visualCaption || ''} className="mx-auto max-h-72 w-full object-contain" />
      {question.visualCaption && (
        <p className="mt-2 text-center text-xs font-bold text-[#857b69]">{question.visualCaption}</p>
      )}
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

type UnlockModalCopy = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  preview: string
  close: string
}

const unlockModalCopy = {
  zh: {
    eyebrow: '解锁完整课程',
    title: '打开全部精彩课节和练习挑战',
    body: '完整课程包含系统视频、每节课配套练习、游戏化 Spark 和宝石奖励。孩子可以边看、边做、边拿反馈，让学习更有趣，也更有效。',
    bullets: ['全部付费课节立即开放', '大量互动练习帮助真正掌握', 'Spark、宝石和连续学习激励'],
    preview: '你已经可以免费试看前 3 节；继续深入学习需要 Full Access。',
    close: '稍后再说',
  },
  en: {
    eyebrow: 'Unlock Full Access',
    title: 'Open every lesson, practice quest, and reward moment',
    body: 'Full Access includes the complete video pathway, lesson-by-lesson practice, game-style Sparks, and Gems. Students learn by watching, solving, getting feedback, and staying motivated.',
    bullets: ['Unlock every paid lesson instantly', 'Practice deeply with interactive questions', 'Earn Sparks, Gems, and streak motivation'],
    preview: 'The first 3 lessons are free to preview. Full Access opens the rest of the journey.',
    close: 'Maybe later',
  },
} satisfies Record<'zh' | 'en', UnlockModalCopy>

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { status } = useSession()
  const { locale } = useLanguage()
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
  const [unlockPromptLesson, setUnlockPromptLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (lessonIdFromQuery) {
      fetchLessonDirectly(lessonIdFromQuery)
    } else {
      fetchCourse(resolvedParams.id)
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
          const resumeIndex = getBestResumeIndex({ ...courseData, hasAccess: data.hasAccess, progress: data.progress }, index)
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
        const hasPreviewLessons = Array.isArray(data.lessons) && data.lessons.some((lesson: Lesson, index: number) => isPreviewLesson(lesson, index))
        if (!data.hasAccess && !hasPreviewLessons) {
          router.push(`/courses/${courseId}`)
          return
        }
        setCourse(data)
        const resumeLessonId = getCookieValue(getResumeCookieName(data.id))
        const resumeIndex = data.lessons.findIndex((lesson: Lesson) => lesson.id === resumeLessonId)
        setCurrentLessonIndex(getBestResumeIndex(data, resumeIndex))
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
    if (course && !isLessonUnlocked(course, nextIndex)) {
      if (!course.hasAccess && lesson && !isPreviewLesson(lesson, nextIndex)) {
        setUnlockPromptLesson(lesson)
      }
      return
    }
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
      const variant = Date.now() % 3
      const sequence = kind === 'incorrect'
        ? variant === 0 ? [196, 164, 146] : variant === 1 ? [220, 175, 147] : [185, 156, 131]
        : kind === 'complete'
          ? variant === 0 ? [523, 659, 784, 1046, 1319, 1568] : variant === 1 ? [587, 740, 988, 1175, 1480] : [659, 831, 1046, 1319, 1760]
          : variant === 0 ? [523, 659, 880, 1175] : variant === 1 ? [587, 740, 932, 1245] : [659, 784, 988, 1319]

      if (kind === 'complete') {
        const bass = ctx.createOscillator()
        const bassGain = ctx.createGain()
        bass.type = 'triangle'
        bass.frequency.setValueAtTime(98, ctx.currentTime)
        bass.frequency.exponentialRampToValueAtTime(196, ctx.currentTime + 0.26)
        bassGain.gain.setValueAtTime(0.0001, ctx.currentTime)
        bassGain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.035)
        bassGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.46)
        bass.connect(bassGain)
        bassGain.connect(ctx.destination)
        bass.start()
        bass.stop(ctx.currentTime + 0.5)
      }

      sequence.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        const start = ctx.currentTime + index * (kind === 'complete' ? 0.055 : 0.075)
        oscillator.type = (kind === 'incorrect' ? (index % 2 ? 'triangle' : 'sine') : index % 2 ? 'triangle' : 'sine') as OscillatorType
        oscillator.frequency.setValueAtTime(frequency, start)
        if (kind !== 'incorrect') {
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.02, start + 0.08)
        } else {
          oscillator.frequency.exponentialRampToValueAtTime(Math.max(90, frequency * 0.92), start + 0.1)
        }
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(kind === 'incorrect' ? 0.045 : kind === 'complete' ? 0.11 : 0.08, start + 0.018)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === 'complete' ? 0.2 : 0.16))
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.start(start)
        oscillator.stop(start + (kind === 'complete' ? 0.22 : 0.18))
      })
      window.setTimeout(() => void ctx.close().catch(() => {}), 1100)
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
    setQuestAutoAdvancing(correct)
    playFeedbackTone(correct ? 'correct' : 'incorrect')
    if (!correct) {
      void recordWrongQuestion(activity, question, value)
      setQuestHintVisible(true)
      return
    }
    window.setTimeout(() => {
      void continueQuest(config, activity)
    }, 950)
  }

  const continueQuest = async (config: PracticeConfig, activity: LessonActivity) => {
    const orderedQuestions = getOrderedPracticeQuestions(config, questQuestionOrder)
    const questSequence = buildQuestSequence(config, questQuestionOrder)
    if (questIndex < questSequence.length - 1) {
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
      const localOnly = !response.ok
      if (response.ok || (response.status === 401 && course && isLarryMathCourse(course))) {
        const result = response.ok
          ? await response.json()
          : scorePracticeLocally(orderedQuestions, answers)
        setQuestResult(result)
        setQuestSubmitted(true)
        setQuestEffect({ kind: 'complete', key: Date.now() })
        playFeedbackTone('complete')
        if (!localOnly && (result.earnedPoints > 0 || result.earnedGems > 0)) {
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

  const completeSurpriseGame = (config: PracticeConfig, activity: LessonActivity) => {
    if (questAutoAdvancing) return
    setQuestAutoAdvancing(true)
    setQuestFeedback(null)
    setQuestHintVisible(false)
    setQuestEffect({ kind: 'complete', key: Date.now() })
    playFeedbackTone('complete')
    window.setTimeout(() => {
      void continueQuest(config, activity)
    }, 850)
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
  const questSequence = questConfig ? buildQuestSequence(questConfig, questQuestionOrder) : []
  const currentQuestItem = questSequence[questIndex]
  const questQuestionById = new Map(orderedQuestQuestions.map((question) => [question.id, question]))
  const currentQuestQuestion = currentQuestItem?.type === 'question' ? questQuestionById.get(currentQuestItem.id) : undefined
  const currentSurpriseGame = currentQuestItem?.type === 'game' ? questConfig?.surpriseGame : undefined
  const currentQuestionNumber = getQuestionNumberInSequence(questSequence, questIndex)
  const currentQuestAnswer = currentQuestQuestion ? questAnswers[currentQuestQuestion.id] : undefined
  const currentQuestChoiceSeed = `${activePracticeId || 'practice'}:${currentQuestQuestion?.id || 'question'}:${questQuestionOrder.join('|')}`
  const currentQuestChoices = currentQuestQuestion ? seededShuffleItems(currentQuestQuestion.choices, currentQuestChoiceSeed) : []
  const openResponseGuide = currentQuestQuestion?.type === 'open-response' ? getOpenResponseGuide(currentQuestQuestion) : null
  const openResponseEvaluation = currentQuestQuestion?.type === 'open-response'
    ? evaluateOpenResponse(currentQuestQuestion, currentQuestAnswer || null)
    : null
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
  const nextLessonUnlocked = currentLessonIndex < course.lessons.length - 1 && isLessonUnlocked(course, currentLessonIndex + 1)
  const nextLessonRequiresPurchase = currentLessonIndex < course.lessons.length - 1 && !course.hasAccess && !isPreviewLesson(course.lessons[currentLessonIndex + 1], currentLessonIndex + 1)
  const unlockCopy = unlockModalCopy[locale]
  const larryMathCourse = isLarryMathCourse(course)

  const learningSteps = [
    {
      title: 'Watch',
      text: larryMathCourse ? 'Pick any Larry Math episode that looks fun. There is no locked sequence.' : 'Follow Larry’s explanation and pause when the diagram or equation changes.',
      active: true,
    },
    {
      title: 'Practice',
      text: currentLesson.hasPractice ? 'Complete the quick quest below to lock in the method.' : 'A quick check is ready here while the full worksheet is being prepared.',
      active: practiceChecked || currentLessonComplete,
    },
    {
      title: 'Apply',
      text: larryMathCourse ? 'Jump to another topic anytime, or replay the video after practice.' : currentLesson.hasGame ? 'Open the lesson game after practice.' : 'Try the same strategy on a similar problem before moving on.',
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
        <section className="flex min-w-0 flex-col gap-6">
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
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">Peer Learning</div>
                  <div className="mt-2 text-xl font-black text-white">{getPeerLearningCount(currentLesson.id, currentLesson.viewCount)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-3 rounded-[28px] border border-white/10 bg-[#101012] p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Course Map</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {larryMathCourse
                    ? `${completedLessonCount} of ${course.lessons.length} lessons completed. Larry Math is a free public-benefit library, so every lesson is open and you can jump by topic.`
                    : `${completedLessonCount} of ${course.lessons.length} lessons completed. The first ${previewLessonCount} lessons are free to preview; paid lessons continue unlocking as you learn.`}
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
                const unlocked = isLessonUnlocked(course, index)
                const requiresPurchase = !unlocked && !course.hasAccess && !isPreviewLesson(lesson, index)
                const latestAttemptData = parseAttemptData(lesson.latestPracticeAttempt)
                const theme = lessonCoverThemes[index % lessonCoverThemes.length]
                const larryMath = isLarryMathCourse(course)
                const ibMypG6 = course.id === 'course-ib-big-math'
                const coverUrl = larryMath ? null : getLessonCoverUrl(course, index)
                const motif = ibMathCardMotifs[index % ibMathCardMotifs.length]
                return (
                  <button
                    key={lesson.id}
                    onClick={() => goToLesson(index)}
                    disabled={!unlocked && !requiresPurchase}
                    className={`group overflow-hidden rounded-3xl border text-left transition ${
                      active
                        ? 'border-blue-400 bg-blue-500/10 shadow-2xl shadow-blue-950/40'
                      : unlocked
                        ? 'border-white/10 bg-white/[0.035] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]'
                      : requiresPurchase
                        ? 'border-amber-300/20 bg-amber-400/[0.035] opacity-80 hover:-translate-y-1 hover:border-amber-200/45 hover:bg-amber-300/[0.08]'
                        : 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] opacity-55'
                    }`}
                    aria-label={requiresPurchase ? `Unlock ${lesson.title}` : undefined}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden" style={larryMath ? undefined : { background: theme.background }}>
                      {larryMath ? (
                        <LarryMathLessonVisual lesson={lesson} index={index} unlocked={unlocked} />
                      ) : coverUrl ? (
                        <img
                          src={coverUrl}
                          alt=""
                          loading="lazy"
                          className={`h-full w-full object-cover transition duration-500 ${unlocked ? 'group-hover:scale-105' : 'grayscale'}`}
                        />
                      ) : (
                        <div className={`absolute inset-0 transition duration-500 ${unlocked ? 'group-hover:scale-105' : 'grayscale'}`}>
                          <div className="absolute inset-0 opacity-35">
                            <div className="absolute left-[10%] right-[8%] top-[28%] h-px bg-white/40" />
                            <div className="absolute left-[10%] right-[8%] top-[52%] h-px bg-white/25" />
                            <div className="absolute bottom-[18%] left-[10%] right-[8%] h-px bg-white/20" />
                            <div className="absolute bottom-[14%] top-[14%] left-[22%] w-px bg-white/20" />
                            <div className="absolute bottom-[14%] top-[14%] left-[48%] w-px bg-white/20" />
                            <div className="absolute bottom-[14%] top-[14%] left-[74%] w-px bg-white/20" />
                          </div>
                          <div className="absolute right-5 top-5 h-28 w-28 rounded-full border border-white/25 bg-black/10" />
                          <div className="absolute right-14 top-14 h-14 w-14 rounded-2xl border border-white/25 bg-white/10 rotate-45" />
                          <div className="absolute left-5 top-[4.5rem] rounded-2xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">IB Math</div>
                            <div className="mt-1 text-xl font-black text-white">{motif.symbol}</div>
                            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: theme.accent }}>{motif.detail}</div>
                          </div>
                          <div className="absolute bottom-4 right-5 text-5xl font-black text-white/10">{motif.formula}</div>
                        </div>
                      )}
                      {!larryMath && !ibMypG6 && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/12 to-black/20" />}
                      {!larryMath && !ibMypG6 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.24),transparent_24%)]" />}
                      <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/35 text-sm font-black text-white ring-1 ring-white/20 backdrop-blur">
                        <LessonCoverMark index={index} completed={completed} unlocked={unlocked} />
                      </div>
                      {!larryMath && !ibMypG6 && (
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="line-clamp-2 text-xl font-black leading-tight text-white drop-shadow">
                            {getLessonCardTitle(lesson)}
                          </div>
                        </div>
                      )}
                      {!larryMath && !ibMypG6 && <div className="absolute right-4 top-4 h-3 w-3 rounded-full shadow-[0_0_28px_currentColor]" style={{ color: theme.accent, backgroundColor: theme.accent }} />}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`text-xs font-black uppercase tracking-[0.16em] ${active ? 'text-blue-300' : completed ? 'text-emerald-300' : unlocked ? 'text-gray-500' : 'text-gray-700'}`}>
                          {active ? 'Now Playing' : completed ? 'Completed' : larryMath ? 'Free Lesson' : unlocked ? 'Unlocked' : !course.hasAccess && !isPreviewLesson(lesson, index) ? 'Paid Lesson' : 'Locked'}
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

          <div className="order-2 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="order-2 rounded-[28px] border border-white/10 bg-[#101012] p-5 sm:p-7 xl:order-2">
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

            <div className="order-1 rounded-[28px] border border-white/10 bg-[#f4f1e8] p-5 text-[#171717] shadow-2xl shadow-black/20 sm:p-7 xl:order-1">
              {questConfig && practiceActivity && currentQuestItem ? (
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

                  <div
                    className="mt-5 grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${Math.min(questSequence.length || 1, 16)}, minmax(0, 1fr))` }}
                  >
                    {questSequence.map((item, index) => {
                      const answered = item.type === 'game' ? index < questIndex : Boolean(questAnswers[item.id])
                      return (
                        <div
                          key={item.id}
                          className={`h-2 rounded-full ${
                            index === questIndex
                              ? item.type === 'game' ? 'bg-violet-600' : 'bg-blue-600'
                              : answered
                                ? item.type === 'game' ? 'bg-amber-400' : 'bg-emerald-500'
                                : 'bg-[#d8d0c2]'
                          }`}
                        />
                      )
                    })}
                  </div>

                  {!questSubmitted ? (
                    <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          <SparkIcon />
                          {currentSurpriseGame
                            ? 'Surprise game break'
                            : `Question ${currentQuestionNumber} of ${orderedQuestQuestions.length}`}
                        </div>
                        {currentQuestQuestion ? (
                          <div className="rounded-full bg-[#f7f1e6] px-3 py-1 text-xs font-black text-[#777064]">
                            +{currentQuestQuestion.points} / -{currentQuestQuestion.penalty}
                          </div>
                        ) : (
                          <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-800">
                            Play 1 round
                          </div>
                        )}
                      </div>

                      {currentSurpriseGame ? (
                        <div className="relative mt-6 overflow-hidden rounded-[26px] border border-violet-100 bg-[#0a0b12] p-4 text-white shadow-xl shadow-violet-100/30 sm:p-5">
                          {questEffect?.kind === 'complete' && (
                            <div key={questEffect.key} className="pointer-events-none absolute inset-0 z-10 quest-fireworks">
                              <div className="quest-shockwave" />
                              {[...Array(22)].map((_, index) => (
                                <span
                                  key={index}
                                  className="quest-spark"
                                  style={{
                                    left: `${10 + ((index * 31) % 80)}%`,
                                    top: `${8 + ((index * 19) % 72)}%`,
                                    animationDelay: `${index * 0.02}s`,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                                {locale === 'zh' ? '惊喜小游戏' : 'Surprise Game'}
                              </p>
                              <h3 className="mt-1 text-2xl font-black tracking-tight">
                                {locale === 'zh'
                                  ? currentSurpriseGame.titleZh || currentSurpriseGame.title || '玩一关，继续闯题'
                                  : currentSurpriseGame.titleEn || currentSurpriseGame.title || 'Play One Round, Then Keep Going'}
                              </h3>
                              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-white/60">
                                {locale === 'zh'
                                  ? currentSurpriseGame.descriptionZh || currentSurpriseGame.description || '用本课知识点完成一个小挑战，过关后自动回到下一题。'
                                  : currentSurpriseGame.descriptionEn || currentSurpriseGame.description || 'Use this lesson skill in a fast mini-game. Finish one round to return to the next question.'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/72">
                              {locale === 'zh' ? '完成后自动继续' : 'Auto-continue'}
                            </div>
                          </div>
                          <LearningGameShowcase
                            selectedId={currentSurpriseGame.templateId}
                            lockedTemplate
                            compact
                            completionRounds={currentSurpriseGame.requiredRounds || 1}
                            onComplete={() => completeSurpriseGame(questConfig, practiceActivity)}
                          />
                        </div>
                      ) : currentQuestQuestion ? (
                      <div className="relative mt-6 overflow-hidden">
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

                        <div className={`rounded-[26px] border border-[#f0e7d8] bg-[#fffdf8] p-5 sm:p-7 ${questEffect?.kind === 'correct' ? 'quest-pop' : ''} ${questEffect?.kind === 'incorrect' ? 'quest-wobble' : ''}`}>
                          <div className="mb-5 inline-flex rounded-full bg-[#f4f1e8] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#777064]">
                            {getQuestionLabel(currentQuestQuestion.type)}
                          </div>
                          <p className="max-w-3xl text-2xl font-black leading-[1.35] tracking-[-0.01em] text-[#111] sm:text-3xl">
                            <MathText text={currentQuestQuestion.prompt} />
                          </p>
                          <QuestVisual question={currentQuestQuestion} />

                          {currentQuestQuestion.type === 'open-response' ? (
                            <div className="mt-5">
                              {openResponseGuide && (
                                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-950">
                                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">{openResponseGuide.label}</div>
                                  <div className="mt-1">{openResponseGuide.helper}</div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {openResponseGuide.checks.map((check) => (
                                      <span key={check} className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-800 ring-1 ring-blue-100">
                                        {check}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <textarea
                                value={String(questAnswers[currentQuestQuestion.id] || '')}
                                onChange={(event) => answerCurrentQuest(currentQuestQuestion, event.target.value)}
                                disabled={Boolean(questFeedback) || questAutoAdvancing}
                                placeholder={openResponseGuide?.placeholder || currentQuestQuestion.inputPlaceholder || 'Write your idea in 2-3 sentences.'}
                                rows={5}
                                className="min-h-[150px] w-full resize-y rounded-2xl border border-[#d8cdbc] bg-[#fffaf1] px-5 py-4 text-base font-bold leading-7 text-[#171717] outline-none placeholder:text-[#b6ad9d] focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:opacity-70"
                              />
                              <p className="mt-3 text-xs font-bold text-[#857b69]">
                                Press Enter for a new line. Short labels like &quot;Underestimate:&quot; and &quot;Overestimate:&quot; are okay.
                              </p>
                            </div>
                          ) : currentQuestQuestion.type === 'numeric-input' || currentQuestQuestion.type === 'fill-blank' ? (
                            <div className="mt-5">
                                <div className="flex overflow-hidden rounded-2xl border border-[#d8cdbc] bg-[#fffaf1] focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
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
                                  {currentQuestChoices.map((choice) => {
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
                              <div className="mt-6 space-y-3">
                              {currentQuestChoices.map((choice) => {
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
                                      className={`w-full rounded-2xl border p-4 text-left text-base font-bold leading-7 transition ${
                                      showCorrect
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                        : showWrong
                                        ? 'border-red-400 bg-red-50 text-red-900'
                                        : isSelected
                                          ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-[0_3px_0_#2563eb]'
                                          : 'border-[#e5dccd] bg-[#fffaf1] text-[#28251f] hover:border-blue-300 hover:bg-blue-50/50'
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
                      ) : null}

                        {currentQuestQuestion && (questFeedback || questHintVisible) && (
                          <div className={`mt-5 rounded-2xl border p-4 text-sm font-bold leading-6 ${questFeedback === 'correct' ? 'border-emerald-100 bg-emerald-50 text-emerald-900' : 'border-amber-100 bg-amber-50 text-amber-950'}`}>
                            <div>{questFeedback === 'correct' ? currentQuestQuestion.encouragement?.correct || 'Correct.' : questFeedback === 'incorrect' ? currentQuestQuestion.encouragement?.incorrect || 'Not quite yet.' : 'Try this hint before checking.'}</div>
                            <div className="mt-2 font-semibold">
                              {questFeedback === 'correct'
                                ? openResponseEvaluation?.message || currentQuestQuestion.explanation
                                : questFeedback === 'incorrect'
                                  ? openResponseEvaluation?.message || currentQuestQuestion.hint
                                  : currentQuestQuestion.hint}
                            </div>
                            {currentQuestQuestion.type === 'open-response' && questFeedback === 'incorrect' && openResponseGuide && (
                              <div className="mt-3 rounded-xl bg-white/70 p-3 text-xs font-black leading-5 text-amber-900">
                                Check before moving on: {openResponseGuide.checks.join(' · ')}
                              </div>
                            )}
                            {questFeedback === 'incorrect' && (
                              <div className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                                Saved to Practice Review. Move on when you are ready.
                              </div>
                            )}
                          </div>
                        )}

                        {currentQuestQuestion && (
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          {questFeedback === 'incorrect' ? (
                            <button
                              onClick={() => void continueQuest(questConfig, practiceActivity)}
                              disabled={questSaving}
                              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {questSaving ? 'Saving...' : questIndex === questSequence.length - 1 ? 'Finish quest' : 'Next question'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => checkCurrentQuest(currentQuestQuestion, questConfig, practiceActivity)}
                                disabled={!hasQuestAnswer(currentQuestQuestion, questAnswers[currentQuestQuestion.id]) || questSaving || questAutoAdvancing || Boolean(questFeedback)}
                                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#171717] px-5 py-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {questSaving ? 'Saving...' : questAutoAdvancing ? (questIndex === questSequence.length - 1 ? 'Finishing quest...' : 'Next question...') : 'Check answer'}
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
                            </>
                          )}
                        </div>
                        )}
                    </div>
                  ) : (
                    <div className="relative mt-6 overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
                      {questEffect?.kind === 'complete' && (
                        <div key={questEffect.key} className="pointer-events-none absolute inset-0 z-10 quest-fireworks">
                          <div className="quest-shockwave" />
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
                      {questEffect?.kind === 'complete' && (
                        <div className="pointer-events-none absolute right-5 top-5 z-20 quest-reward-orbit" aria-hidden="true">
                          <span className="quest-reward-token quest-reward-token-gem">
                            <img src="/reward-icons/gem.png" alt="" />
                          </span>
                          <span className="quest-reward-token quest-reward-token-spark">
                            <img src="/reward-icons/spark.png" alt="" />
                          </span>
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
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#777064]">Sparks earned</div>
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
                        {status !== 'authenticated' && larryMathCourse ? (
                          <div className="mt-3 rounded-xl bg-white/70 px-4 py-2 text-xs font-black text-blue-800">
                            Free practice complete. Log in when you want Sparks and Gems saved to your profile.
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
                          {nextLessonUnlocked || currentLessonIndex === course.lessons.length - 1
                            ? 'Next lesson'
                            : nextLessonRequiresPurchase
                            ? 'Unlock full course'
                            : 'Complete this quiz to unlock'}
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
                      +{currentLesson.rewardsPoints || 20} Sparks
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
                        {nextLessonUnlocked || currentLessonIndex === course.lessons.length - 1
                          ? 'Next lesson'
                          : nextLessonRequiresPurchase
                          ? 'Unlock full course'
                          : 'Complete this quiz to unlock'}
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {isIbMathCourse(course) && (
            <div className="order-4 rounded-[28px] border border-white/10 bg-[#101012] p-5 shadow-2xl shadow-black/30 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Next IB Big Math pathways</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                    Keep the main flow focused on video and practice. Use these modules when you are ready to move across the IB Math pathway.
                  </p>
                </div>
                <Link href="/courses?category=ib-big-math" className="text-sm font-black text-blue-300 hover:text-blue-200">
                  View all IB courses →
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {pathwayModules.filter((module) => module.id !== course.id).map((module) => (
                  <a
                    key={module.id}
                    href={module.href}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.055]"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-black">
                      <img
                        src={module.cover}
                        alt={`${module.title} cover`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/10" />
                      <div className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/75 ring-1 ring-white/15 backdrop-blur">
                        {module.status}
                      </div>
                      <h3 className="absolute bottom-4 left-4 right-4 text-xl font-black leading-tight text-white drop-shadow">
                        {module.title}
                      </h3>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-500">{module.summary}</p>
                      <div className="mt-4 text-sm font-black text-blue-300">Explore module →</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      {unlockPromptLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 px-4 py-8 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="unlock-course-title">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={unlockCopy.close}
            onClick={() => setUnlockPromptLesson(null)}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#08080b] text-white shadow-2xl shadow-black/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.25),transparent_36%),radial-gradient(circle_at_92%_16%,rgba(245,158,11,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)]" />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">{unlockCopy.eyebrow}</p>
                  <h2 id="unlock-course-title" className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                    {unlockCopy.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setUnlockPromptLesson(null)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.1] hover:text-white"
                  aria-label={unlockCopy.close}
                >
                  <XIcon />
                </button>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Next locked lesson</p>
                <p className="mt-2 text-xl font-black leading-tight">{unlockPromptLesson.title}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
                  {unlockPromptLesson.description || unlockCopy.preview}
                </p>
              </div>

              <p className="mt-5 text-base leading-8 text-gray-300">{unlockCopy.body}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {unlockCopy.bullets.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300 text-black">
                      <SparkIcon />
                    </div>
                    <p className="text-sm font-black leading-5 text-white">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-amber-200/20 bg-amber-200/[0.08] p-4 text-sm font-bold leading-6 text-amber-100">
                {unlockCopy.preview}
              </div>

              <div className="mt-5">
                <PurchaseCourseButton courseId={course.id} price={course.price} />
              </div>

              <button
                type="button"
                onClick={() => setUnlockPromptLesson(null)}
                className="mt-4 w-full rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/60 transition hover:border-white/20 hover:text-white"
              >
                {unlockCopy.close}
              </button>
            </div>
          </div>
        </div>
      )}
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

        .quest-shockwave {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8rem;
          height: 8rem;
          border-radius: 999px;
          border: 2px solid rgba(34, 211, 238, 0.45);
          background: radial-gradient(circle, rgba(250, 204, 21, 0.22), transparent 68%);
          transform: translate(-50%, -50%) scale(.2);
          animation: quest-shockwave 820ms ease-out forwards;
        }

        .quest-reward-orbit {
          width: 5.4rem;
          height: 5.4rem;
          border-radius: 999px;
          background:
            radial-gradient(circle, rgba(255, 255, 255, 0.82), transparent 38%),
            radial-gradient(circle, rgba(34, 211, 238, 0.18), transparent 68%);
          animation: quest-orbit-pop 900ms cubic-bezier(.18, 1.35, .28, 1) both;
        }

        .quest-reward-token {
          position: absolute;
          display: grid;
          place-items: center;
          width: 2.7rem;
          height: 2.7rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.2);
          animation: quest-token-float 1.05s ease-out both;
        }

        .quest-reward-token img {
          width: 2.25rem;
          height: 2.25rem;
          object-fit: contain;
        }

        .quest-reward-token-gem {
          left: -.4rem;
          top: .8rem;
        }

        .quest-reward-token-spark {
          right: -.45rem;
          bottom: .65rem;
          animation-delay: 90ms;
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

        @keyframes quest-shockwave {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(.16); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(.72); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2.35); }
        }

        @keyframes quest-orbit-pop {
          0% { opacity: 0; transform: translateY(10px) scale(.62) rotate(-18deg); }
          35% { opacity: 1; transform: translateY(-2px) scale(1.05) rotate(8deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }

        @keyframes quest-token-float {
          0% { opacity: 0; transform: translateY(18px) scale(.58); }
          36% { opacity: 1; transform: translateY(-6px) scale(1.12); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
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
          .quest-fireworks .quest-spark,
          .quest-shockwave,
          .quest-reward-orbit,
          .quest-reward-token {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
