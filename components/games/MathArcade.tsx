'use client'

import { useMemo, useRef, useState } from 'react'

type GameLike = {
  id: string
  title: string
  description: string
  gameType: string
  gameConfig?: string | Record<string, unknown> | null
}

type Mode = 'multiplication' | 'addition' | 'geometry' | 'bubble' | 'race' | 'wheel' | 'treasure' | 'duel' | 'rescue'

type Question = {
  prompt: string
  answer: string
  choices: string[]
  hint: string
  visual: string
  points: number
}

type RewardResult = {
  saved: boolean
  earnedPoints: number
  earnedGems: number
  message?: string
}

const modeTheme: Record<Mode, { title: string; subtitle: string; accent: string; bg: string }> = {
  multiplication: {
    title: 'Multiplication Galaxy',
    subtitle: 'Build streaks across multiplication constellations.',
    accent: 'text-sky-200',
    bg: 'from-sky-500/20 via-blue-700/20 to-indigo-900/30',
  },
  addition: {
    title: 'Number Rush',
    subtitle: 'Fast mental math with combo boosts.',
    accent: 'text-emerald-200',
    bg: 'from-emerald-400/20 via-teal-700/20 to-slate-900/30',
  },
  geometry: {
    title: 'Geometry Lab',
    subtitle: 'Decode shapes, area, perimeter, and angles.',
    accent: 'text-fuchsia-200',
    bg: 'from-fuchsia-500/20 via-purple-700/20 to-slate-900/30',
  },
  bubble: {
    title: 'Bubble Factor Burst',
    subtitle: 'Pop the right number bubbles before they drift away.',
    accent: 'text-cyan-200',
    bg: 'from-cyan-400/20 via-blue-700/20 to-slate-900/30',
  },
  race: {
    title: 'Math Nitro Race',
    subtitle: 'Solve to charge your engine and overtake rivals.',
    accent: 'text-amber-200',
    bg: 'from-amber-400/20 via-orange-700/20 to-slate-900/30',
  },
  wheel: {
    title: 'Spin Wheel Arena',
    subtitle: 'Spin into mixed operations and unlock bonus rounds.',
    accent: 'text-violet-200',
    bg: 'from-violet-500/20 via-indigo-700/20 to-slate-900/30',
  },
  treasure: {
    title: 'Fraction Treasure Hunt',
    subtitle: 'Break treasure seals with fraction and ratio power.',
    accent: 'text-yellow-200',
    bg: 'from-yellow-400/20 via-amber-700/20 to-slate-900/30',
  },
  duel: {
    title: 'Equation Duel',
    subtitle: 'Use math strikes to win the palace duel.',
    accent: 'text-rose-200',
    bg: 'from-rose-500/20 via-red-800/20 to-slate-900/30',
  },
  rescue: {
    title: 'Logic Rescue Mission',
    subtitle: 'Use coordinates, logic, and arithmetic to complete rescues.',
    accent: 'text-lime-200',
    bg: 'from-lime-400/20 via-emerald-800/20 to-slate-900/30',
  },
}

function parseConfig(game: GameLike) {
  if (!game.gameConfig) return {}
  if (typeof game.gameConfig === 'string') {
    try {
      return JSON.parse(game.gameConfig) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return game.gameConfig
}

function detectMode(game: GameLike): Mode {
  const title = game.title.toLowerCase()
  if (title.includes('泡泡') || title.includes('bubble')) return 'bubble'
  if (title.includes('赛车') || title.includes('race')) return 'race'
  if (title.includes('转盘') || title.includes('spin') || title.includes('wheel')) return 'wheel'
  if (title.includes('宝藏') || title.includes('treasure')) return 'treasure'
  if (title.includes('宫殿') || title.includes('duel') || title.includes('palace')) return 'duel'
  if (title.includes('革命') || title.includes('rescue')) return 'rescue'
  if (game.gameType === 'addition') return 'addition'
  if (game.gameType === 'geometry') return 'geometry'
  return 'multiplication'
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function choiceQuestion(prompt: string, answer: number | string, hint: string, visual: string, points: number, distractors: (number | string)[]): Question {
  const answerText = String(answer)
  return {
    prompt,
    answer: answerText,
    hint,
    visual,
    points,
    choices: shuffle([answerText, ...distractors.map(String)]).slice(0, 4),
  }
}

function uniqueDistractors(answer: number, spread: number) {
  const values = new Set<number>()
  while (values.size < 5) {
    const delta = Math.floor(Math.random() * spread) + 1
    values.add(answer + (Math.random() > 0.5 ? delta : -delta))
  }
  return [...values].filter((value) => value !== answer && value >= 0).slice(0, 3)
}

function makeQuestion(mode: Mode, level: number, index: number): Question {
  const n = Math.max(1, level)
  const base = 8 + n * 3
  const a = Math.floor(Math.random() * base) + 2
  const b = Math.floor(Math.random() * base) + 2

  if (mode === 'addition') {
    const answer = a + b + n * 3
    return choiceQuestion(`${a} + ${b} + ${n * 3} = ?`, answer, 'Break the numbers into friendly tens, then add the rest.', `${a} + ${b}`, 8 + n, uniqueDistractors(answer, 9 + n))
  }

  if (mode === 'multiplication') {
    const x = Math.floor(Math.random() * (8 + n)) + 2
    const y = Math.floor(Math.random() * (8 + n)) + 2
    const answer = x * y
    return choiceQuestion(`${x} × ${y} = ?`, answer, 'Use a known fact, then scale up or split one factor.', `${x} rows × ${y}`, 9 + n, uniqueDistractors(answer, 12 + n))
  }

  if (mode === 'geometry') {
    const width = Math.floor(Math.random() * (8 + n)) + 3
    const height = Math.floor(Math.random() * (8 + n)) + 3
    const askArea = index % 2 === 0
    const answer = askArea ? width * height : 2 * (width + height)
    return choiceQuestion(
      askArea ? `A rectangle is ${width} by ${height}. What is its area?` : `A rectangle is ${width} by ${height}. What is its perimeter?`,
      answer,
      askArea ? 'Area counts square units: width times height.' : 'Perimeter is the distance around: add all four sides.',
      `${width} × ${height}`,
      10 + n,
      uniqueDistractors(answer, 14 + n)
    )
  }

  if (mode === 'bubble') {
    const factor = [2, 3, 4, 5][index % 4]
    const answer = Math.floor(Math.random() * (9 + n)) * factor
    return choiceQuestion(`Pop a number divisible by ${factor}.`, answer, `A number divisible by ${factor} has no remainder when divided by ${factor}.`, `÷ ${factor}`, 8 + n, [answer + 1, answer + factor + 1, Math.max(1, answer - 1)])
  }

  if (mode === 'race') {
    const answer = a * 3 + b * 2
    return choiceQuestion(`Nitro mix: ${a} × 3 + ${b} × 2`, answer, 'Multiply first, then add the two fuel totals.', 'NITRO', 9 + n, uniqueDistractors(answer, 16 + n))
  }

  if (mode === 'wheel') {
    const answer = (a + b) * (n + 1)
    return choiceQuestion(`Wheel combo: (${a} + ${b}) × ${n + 1}`, answer, 'Solve inside the parentheses first, then multiply.', 'SPIN', 10 + n, uniqueDistractors(answer, 18 + n))
  }

  if (mode === 'treasure') {
    const den = [4, 5, 6, 8, 10][index % 5]
    const num = Math.floor(Math.random() * (den - 1)) + 1
    const total = den * (2 + n)
    const answer = num * (total / den)
    return choiceQuestion(`${num}/${den} of ${total} treasure crystals = ?`, answer, 'Divide the total by the denominator, then multiply by the numerator.', `${num}/${den}`, 11 + n, uniqueDistractors(answer, 12 + n))
  }

  if (mode === 'duel') {
    const answer = a + b * n
    return choiceQuestion(`Shield equation: x - ${b * n} = ${a}. Find x.`, answer, 'Use inverse operations: add the same amount to both sides.', 'x?', 10 + n, uniqueDistractors(answer, 12 + n))
  }

  const x = Math.floor(Math.random() * (5 + n)) + 1
  const y = Math.floor(Math.random() * (5 + n)) + 1
  const answer = Math.abs(x - y) + x + y
  return choiceQuestion(`Rescue path from (${x}, ${y}) to (${y}, ${x}). Total grid steps plus ${x + y}?`, answer, 'Find the horizontal and vertical distance, then add the bonus total.', `(${x},${y})`, 12 + n, uniqueDistractors(answer, 10 + n))
}

function makeDeck(mode: Mode, level: number) {
  const length = 8 + Math.min(level, 4) * 2
  return Array.from({ length }, (_, index) => makeQuestion(mode, level, index))
}

function useArcadeAudio() {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = () => {
    if (typeof window === 'undefined') return null
    contextRef.current ??= new AudioContext()
    return contextRef.current
  }

  return {
    playCorrect() {
      const ctx = getContext()
      if (!ctx) return
      ;[523, 659, 784].forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.045)
        gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + index * 0.045 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28 + index * 0.04)
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + index * 0.045)
        osc.stop(ctx.currentTime + 0.35 + index * 0.04)
      })
    },
    playWrong() {
      const ctx = getContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    },
    playWin() {
      const ctx = getContext()
      if (!ctx) return
      ;[392, 494, 587, 784, 988].forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.075)
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + index * 0.075 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.075 + 0.22)
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + index * 0.075)
        osc.stop(ctx.currentTime + index * 0.075 + 0.25)
      })
    },
  }
}

function VisualStage({ mode, progress, streak, level, question }: { mode: Mode; progress: number; streak: number; level: number; question: Question }) {
  const theme = modeTheme[mode]
  const percent = Math.min(100, progress * 100)

  if (mode === 'race') {
    return (
      <div className="relative h-56 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-6">
        <div className="absolute inset-x-8 top-1/2 h-3 rounded-full bg-white/10" />
        <div className="absolute left-8 top-1/2 h-3 rounded-full bg-gradient-to-r from-amber-300 to-orange-500" style={{ width: `calc(${percent}% - 4rem)` }} />
        <div className="absolute top-[calc(50%-28px)] text-5xl transition-all duration-700" style={{ left: `calc(${percent}% - 1.75rem)` }}>🏎</div>
        <div className="absolute right-8 top-[calc(50%-24px)] text-4xl">🏁</div>
        <div className="relative text-sm font-black uppercase tracking-[0.22em] text-amber-200">Level {level} Nitro</div>
      </div>
    )
  }

  if (mode === 'bubble') {
    return (
      <div className={`relative h-56 overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-gradient-to-br ${theme.bg} p-6`}>
        {Array.from({ length: 13 }, (_, index) => (
          <div
            key={index}
            className="absolute flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-cyan-300/15 text-sm font-black text-cyan-50 shadow-2xl shadow-cyan-300/20"
            style={{ left: `${(index * 17) % 92}%`, top: `${12 + ((index * 29) % 68)}%`, transform: `scale(${0.75 + (index % 4) * 0.12})` }}
          >
            {index % 3 === 0 ? question.answer : Number(question.answer) + index}
          </div>
        ))}
        <div className="relative text-sm font-black uppercase tracking-[0.22em] text-cyan-100">Target {question.visual}</div>
      </div>
    )
  }

  if (mode === 'geometry') {
    return (
      <div className={`relative grid h-56 place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${theme.bg}`}>
        <div className="grid h-32 w-44 place-items-center border-4 border-fuchsia-200 bg-fuchsia-300/10 text-3xl font-black text-white shadow-2xl shadow-fuchsia-400/20">
          {question.visual}
        </div>
      </div>
    )
  }

  if (mode === 'treasure') {
    return (
      <div className={`relative h-56 overflow-hidden rounded-[2rem] border border-yellow-200/20 bg-gradient-to-br ${theme.bg} p-6`}>
        <div className="absolute bottom-8 left-1/2 grid h-28 w-36 -translate-x-1/2 place-items-center rounded-3xl border border-yellow-200/30 bg-yellow-300/15 text-5xl shadow-2xl shadow-yellow-300/20">💎</div>
        <div className="absolute left-8 top-8 text-5xl">🗝</div>
        <div className="absolute right-8 top-8 rounded-2xl bg-black/30 px-4 py-2 text-2xl font-black text-yellow-100">{question.visual}</div>
      </div>
    )
  }

  if (mode === 'duel') {
    return (
      <div className={`relative h-56 overflow-hidden rounded-[2rem] border border-rose-200/20 bg-gradient-to-br ${theme.bg} p-6`}>
        <div className="absolute bottom-8 left-10 text-6xl">🛡</div>
        <div className="absolute bottom-8 right-10 text-6xl">⚔</div>
        <div className="absolute left-28 right-28 top-1/2 h-3 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-rose-300 to-red-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="relative text-sm font-black uppercase tracking-[0.22em] text-rose-100">Combo Strike {streak}</div>
      </div>
    )
  }

  if (mode === 'rescue') {
    return (
      <div className={`relative h-56 overflow-hidden rounded-[2rem] border border-lime-200/20 bg-gradient-to-br ${theme.bg} p-6`}>
        <div className="absolute inset-8 grid grid-cols-6 grid-rows-4 gap-2 opacity-70">
          {Array.from({ length: 24 }, (_, index) => <div key={index} className="rounded border border-lime-200/15 bg-white/[0.03]" />)}
        </div>
        <div className="absolute left-12 top-12 text-4xl">🚩</div>
        <div className="absolute bottom-12 right-12 text-4xl">🎒</div>
        <div className="relative text-sm font-black uppercase tracking-[0.22em] text-lime-100">Path Code {question.visual}</div>
      </div>
    )
  }

  return (
    <div className={`relative grid h-56 place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${theme.bg}`}>
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative rounded-[2rem] border border-white/15 bg-black/25 px-10 py-8 text-5xl font-black text-white shadow-2xl">
        {question.visual}
      </div>
    </div>
  )
}

export default function MathArcade({ game }: { game: GameLike }) {
  const config = parseConfig(game)
  const mode = detectMode(game)
  const theme = modeTheme[mode]
  const audio = useArcadeAudio()
  const [level, setLevel] = useState(1)
  const [deckKey, setDeckKey] = useState(0)
  const deck = useMemo(() => makeDeck(mode, level), [mode, level, deckKey])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [message, setMessage] = useState('')
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reward, setReward] = useState<RewardResult | null>(null)

  const question = deck[index]
  const maxScore = deck.reduce((sum, item) => sum + item.points + 6, 0)
  const progress = finished ? 1 : index / deck.length
  const legacyPlayUrl = typeof config.playUrl === 'string' ? config.playUrl : null

  const reset = (nextLevel = level) => {
    setLevel(nextLevel)
    setDeckKey((value) => value + 1)
    setIndex(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setFeedback('idle')
    setMessage('')
    setFinished(false)
    setReward(null)
  }

  const finish = async (finalScore: number, finalStreak: number) => {
    setFinished(true)
    setSaving(true)
    audio.playWin()
    try {
      const response = await fetch(`/api/games/${game.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          maxScore,
          level,
          streak: finalStreak,
          completed: true,
          mode,
        }),
      })
      if (response.ok) {
        setReward(await response.json())
      }
    } finally {
      setSaving(false)
    }
  }

  const choose = (choice: string) => {
    if (feedback !== 'idle' || finished) return
    const correct = choice === question.answer
    if (correct) {
      const nextStreak = streak + 1
      const gained = question.points + Math.min(nextStreak, 8)
      const nextScore = score + gained
      setScore(nextScore)
      setStreak(nextStreak)
      setBestStreak(Math.max(bestStreak, nextStreak))
      setFeedback('correct')
      setMessage(`+${gained} power. Combo x${nextStreak}`)
      audio.playCorrect()
      window.setTimeout(() => {
        setFeedback('idle')
        setMessage('')
        if (index >= deck.length - 1) {
          finish(nextScore, nextStreak)
        } else {
          setIndex((value) => value + 1)
        }
      }, 850)
    } else {
      const nextScore = Math.max(0, score - Math.ceil(question.points / 2))
      setScore(nextScore)
      setStreak(0)
      setFeedback('wrong')
      setMessage(question.hint)
      audio.playWrong()
      window.setTimeout(() => {
        setFeedback('idle')
        setMessage('')
        if (index >= deck.length - 1) {
          finish(nextScore, bestStreak)
        } else {
          setIndex((value) => value + 1)
        }
      }, 1500)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#070707] p-4 shadow-2xl shadow-black/30 sm:p-6">
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`} />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />
      <div className="relative grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
            <p className={`text-xs font-black uppercase tracking-[0.24em] ${theme.accent}`}>Level {level} Arcade</p>
            <h2 className="mt-2 text-3xl font-black text-white">{theme.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">{theme.subtitle}</p>
            {legacyPlayUrl && (
              <a href={legacyPlayUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-white/45 underline-offset-4 hover:text-white hover:underline">
                Open classic version
              </a>
            )}
          </div>
          <VisualStage mode={mode} progress={progress} streak={streak} level={level} question={question} />
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Score', score],
              ['Streak', streak],
              ['Best', bestStreak],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.92] p-5 text-[#111] shadow-2xl sm:p-7">
          {feedback === 'correct' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
              {Array.from({ length: 18 }, (_, item) => (
                <span
                  key={item}
                  className="absolute h-2 w-2 animate-ping rounded-full bg-amber-400"
                  style={{ left: `${8 + Math.random() * 84}%`, top: `${8 + Math.random() * 70}%`, animationDuration: `${0.55 + Math.random() * 0.6}s` }}
                />
              ))}
            </div>
          )}

          {!finished ? (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#111] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {index + 1} / {deck.length}
                </span>
                <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-900">
                  {question.points} pts
                </span>
              </div>
              <h3 className="min-h-24 text-3xl font-black leading-tight sm:text-4xl">{question.prompt}</h3>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {question.choices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => choose(choice)}
                    disabled={feedback !== 'idle'}
                    className="rounded-2xl border-2 border-[#111]/10 bg-white px-5 py-5 text-2xl font-black shadow-[0_8px_0_rgba(17,17,17,.12)] transition hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-50 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              {message && (
                <div className={`mt-6 rounded-2xl border px-5 py-4 text-base font-bold ${feedback === 'correct' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
                  {message}
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[28rem] flex-col justify-center">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-600">Quest Complete</p>
              <h3 className="mt-3 text-5xl font-black">Score {score}</h3>
              <p className="mt-4 text-lg font-bold text-[#555]">
                Best combo: {bestStreak}. Advance to level {level + 1} for larger numbers, tougher models, and better rewards.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-50 p-5 text-center">
                  <div className="text-3xl font-black text-blue-700">{saving ? '...' : reward?.earnedPoints ?? Math.round(score / 2)}</div>
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-400">Points</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-5 text-center">
                  <div className="text-3xl font-black text-amber-700">{saving ? '...' : reward?.earnedGems ?? 0}</div>
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-400">Gems</div>
                </div>
              </div>
              {reward && !reward.saved && (
                <p className="mt-4 rounded-2xl bg-[#111] px-5 py-4 text-sm font-bold text-white">
                  Login to save these rewards to your profile.
                </p>
              )}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button onClick={() => reset(level + 1)} className="rounded-2xl bg-[#111] px-6 py-4 text-lg font-black text-white transition hover:scale-[1.02]">
                  Next Level
                </button>
                <button onClick={() => reset(level)} className="rounded-2xl border-2 border-[#111] px-6 py-4 text-lg font-black transition hover:bg-[#111] hover:text-white">
                  Replay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
