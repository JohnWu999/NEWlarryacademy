'use client'

import { useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type TemplateId = 'starship' | 'geometry' | 'coaster' | 'circuit' | 'fraction' | 'molecule'

type Question = {
  prompt: string
  answer: string
  choices: string[]
  hint: string
  tag: string
}

type GameTemplate = {
  id: TemplateId
  titleZh: string
  titleEn: string
  subtitleZh: string
  subtitleEn: string
  subject: string
  accent: string
  wash: string
}

const templates: GameTemplate[] = [
  {
    id: 'starship',
    titleZh: '星际算力战舰',
    titleEn: 'Starship Compute',
    subtitleZh: '答题充能，激光清除航线障碍。',
    subtitleEn: 'Answer to charge lasers and clear the route.',
    subject: 'Arithmetic',
    accent: '#38bdf8',
    wash: 'from-sky-500/25 via-indigo-500/15 to-[#07111f]',
  },
  {
    id: 'geometry',
    titleZh: '几何建城',
    titleEn: 'Geometry City',
    subtitleZh: '用面积、周长和角度建造发光城市。',
    subtitleEn: 'Build a luminous city with area and perimeter.',
    subject: 'Geometry',
    accent: '#f59e0b',
    wash: 'from-amber-400/25 via-teal-500/10 to-[#10120a]',
  },
  {
    id: 'coaster',
    titleZh: '函数过山车',
    titleEn: 'Function Coaster',
    subtitleZh: '调整函数能量，让轨道穿过目标点。',
    subtitleEn: 'Tune function energy and hit target points.',
    subject: 'Functions',
    accent: '#fb7185',
    wash: 'from-rose-500/25 via-violet-500/15 to-[#160914]',
  },
  {
    id: 'circuit',
    titleZh: '电路黑客',
    titleEn: 'Circuit Hacker',
    subtitleZh: '计算电流、电阻和逻辑门，点亮系统。',
    subtitleEn: 'Solve circuits and logic gates to light the grid.',
    subject: 'Science',
    accent: '#22c55e',
    wash: 'from-emerald-400/25 via-cyan-500/10 to-[#06130f]',
  },
  {
    id: 'fraction',
    titleZh: '分数切割场',
    titleEn: 'Fraction Slicer',
    subtitleZh: '切开能量盘，击中等值分数和百分比。',
    subtitleEn: 'Slice energy discs into equivalent fractions.',
    subject: 'Fractions',
    accent: '#a78bfa',
    wash: 'from-violet-500/25 via-fuchsia-500/10 to-[#10091b]',
  },
  {
    id: 'molecule',
    titleZh: '3D 分子实验室',
    titleEn: '3D Molecule Lab',
    subtitleZh: '旋转分子模型，用科学题触发反应。',
    subtitleEn: 'Rotate molecular models and trigger reactions.',
    subject: 'Chemistry',
    accent: '#2dd4bf',
    wash: 'from-teal-400/25 via-blue-500/10 to-[#061217]',
  },
]

function shuffle(items: string[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function distractors(answer: number, spread = 10) {
  const values = new Set<number>()
  while (values.size < 3) {
    const delta = Math.floor(Math.random() * spread) + 1
    const next = answer + (Math.random() > 0.5 ? delta : -delta)
    if (next >= 0 && next !== answer) values.add(next)
  }
  return [...values].map(String)
}

function makeQuestion(id: TemplateId, level: number, round: number): Question {
  const a = Math.floor(Math.random() * (7 + level * 2)) + 2
  const b = Math.floor(Math.random() * (7 + level * 2)) + 2

  if (id === 'starship') {
    const answer = a * b + level
    return {
      prompt: `${a} x ${b} + ${level} = ?`,
      answer: String(answer),
      choices: shuffle([String(answer), ...distractors(answer, 14)]),
      hint: 'Multiply first, then add the reactor boost.',
      tag: 'LASER',
    }
  }

  if (id === 'geometry') {
    const width = a + 2
    const height = b + 1
    const isArea = round % 2 === 0
    const answer = isArea ? width * height : 2 * (width + height)
    return {
      prompt: isArea ? `Area of ${width} by ${height}?` : `Perimeter of ${width} by ${height}?`,
      answer: String(answer),
      choices: shuffle([String(answer), ...distractors(answer, 16)]),
      hint: isArea ? 'Area is width times height.' : 'Perimeter is the distance around all sides.',
      tag: isArea ? 'AREA' : 'EDGE',
    }
  }

  if (id === 'coaster') {
    const slope = level + 1
    const x = round + 2
    const intercept = a
    const answer = slope * x + intercept
    return {
      prompt: `For y = ${slope}x + ${intercept}, find y when x = ${x}.`,
      answer: String(answer),
      choices: shuffle([String(answer), ...distractors(answer, 18)]),
      hint: 'Substitute x, multiply, then add the intercept.',
      tag: 'Y',
    }
  }

  if (id === 'circuit') {
    const current = level + 2
    const resistance = a
    const answer = current * resistance
    return {
      prompt: `Voltage = ${current}A x ${resistance}ohm. What is V?`,
      answer: String(answer),
      choices: shuffle([String(answer), ...distractors(answer, 12)]),
      hint: 'Use V = I x R.',
      tag: 'VOLT',
    }
  }

  if (id === 'fraction') {
    const den = [4, 5, 8, 10][round % 4]
    const num = Math.max(1, Math.floor(den / 2))
    const total = den * (level + 3)
    const answer = (total / den) * num
    return {
      prompt: `${num}/${den} of ${total} = ?`,
      answer: String(answer),
      choices: shuffle([String(answer), ...distractors(answer, 10)]),
      hint: 'Divide by the denominator, then multiply by the numerator.',
      tag: `${num}/${den}`,
    }
  }

  const atoms = a + b
  const bonds = Math.max(2, Math.floor(atoms / 2) + level)
  const answer = atoms + bonds
  return {
    prompt: `${atoms} atoms + ${bonds} bonds = ? model units`,
    answer: String(answer),
    choices: shuffle([String(answer), ...distractors(answer, 12)]),
    hint: 'Combine atoms and bonds to get total model units.',
    tag: '3D',
  }
}

function useGameAudio() {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = () => {
    if (typeof window === 'undefined') return null
    contextRef.current ??= new AudioContext()
    if (contextRef.current.state === 'suspended') {
      void contextRef.current.resume()
    }
    return contextRef.current
  }

  const tone = (frequencies: number[], type: OscillatorType, gainValue = 0.1) => {
    const ctx = getContext()
    if (!ctx) return
    frequencies.forEach((frequency, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.06)
      gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + index * 0.06 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.06 + 0.24)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + index * 0.06)
      osc.stop(ctx.currentTime + index * 0.06 + 0.28)
    })
  }

  return {
    correct: () => tone([523, 659, 784, 1046], 'triangle', 0.13),
    wrong: () => tone([220, 146], 'sawtooth', 0.07),
    switch: () => tone([330, 440], 'sine', 0.06),
  }
}

function Stage({
  template,
  charge,
  streak,
  round,
}: {
  template: GameTemplate
  charge: number
  streak: number
  round: number
}) {
  const percent = Math.min(100, charge)

  if (template.id === 'starship') {
    return (
      <div className={`relative h-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${template.wash}`}>
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20px_20px,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute left-[12%] top-1/2 h-1 w-[72%] -translate-y-1/2 bg-sky-200/15">
          <div className="h-full bg-sky-300 shadow-[0_0_24px_rgba(56,189,248,.9)]" style={{ width: `${percent}%` }} />
        </div>
        <div className="absolute left-[16%] top-[44%] h-16 w-24 -translate-y-1/2 rounded-r-full rounded-l-[2rem] border border-sky-200/40 bg-sky-100/10 shadow-[0_0_36px_rgba(56,189,248,.45)]">
          <div className="absolute -right-5 top-1/2 h-5 w-14 -translate-y-1/2 rounded-full bg-sky-300 blur-sm" />
        </div>
        <div className="absolute right-[12%] top-[35%] h-20 w-20 rounded-xl border border-rose-200/30 bg-rose-500/15 rotate-45 shadow-[0_0_38px_rgba(244,63,94,.35)]" />
        <div className="absolute bottom-6 left-6 text-xs font-black uppercase tracking-[0.22em] text-sky-100">Charge {Math.round(percent)}%</div>
      </div>
    )
  }

  if (template.id === 'geometry') {
    return (
      <div className={`relative h-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${template.wash}`}>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-black/25" />
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="absolute bottom-16 w-12 rounded-t-lg border border-amber-100/25 bg-amber-200/10 shadow-[0_0_26px_rgba(245,158,11,.25)]"
            style={{ left: `${8 + index * 11}%`, height: `${54 + ((index + round) % 4) * 28}px` }}
          >
            <div className="m-2 grid grid-cols-2 gap-1">
              {Array.from({ length: 6 }, (_, item) => <span key={item} className="h-2 rounded-sm bg-amber-100/40" />)}
            </div>
          </div>
        ))}
        <div className="absolute left-8 top-7 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-100">Build x{streak + 1}</div>
      </div>
    )
  }

  if (template.id === 'coaster') {
    return (
      <div className={`relative h-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${template.wash}`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 360" role="img" aria-label="Function coaster track">
          <path d="M30 270 C140 100 210 110 300 220 S470 330 660 70" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="16" strokeLinecap="round" />
          <path d="M30 270 C140 100 210 110 300 220 S470 330 660 70" fill="none" stroke="#fb7185" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${5 + percent * 4} 520`} />
          <circle cx={80 + percent * 5.3} cy={250 - Math.sin(percent / 11) * 90} r="18" fill="#fff" />
          <circle cx="520" cy="150" r="26" fill="rgba(251,113,133,.18)" stroke="#fb7185" strokeWidth="3" />
        </svg>
        <div className="absolute bottom-6 left-6 text-xs font-black uppercase tracking-[0.22em] text-rose-100">Target curve</div>
      </div>
    )
  }

  if (template.id === 'circuit') {
    return (
      <div className={`relative h-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${template.wash}`}>
        <div className="absolute inset-8 grid grid-cols-5 grid-rows-4 gap-5">
          {Array.from({ length: 20 }, (_, index) => (
            <div key={index} className="relative rounded-lg border border-emerald-200/15 bg-white/[0.03]">
              {(index + round) % 3 === 0 && <span className="absolute inset-3 rounded-full bg-emerald-300/70 shadow-[0_0_26px_rgba(34,197,94,.75)]" />}
            </div>
          ))}
        </div>
        <div className="absolute left-8 top-8 h-20 w-20 rounded-2xl border border-emerald-200/30 bg-black/30 text-center text-4xl leading-[5rem] text-emerald-100">V</div>
        <div className="absolute bottom-6 right-6 text-xs font-black uppercase tracking-[0.22em] text-emerald-100">Grid online</div>
      </div>
    )
  }

  if (template.id === 'fraction') {
    return (
      <div className={`relative grid h-[22rem] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${template.wash}`}>
        <div className="relative h-52 w-52 rounded-full border-[18px] border-violet-200/20 bg-violet-300/10 shadow-[0_0_48px_rgba(167,139,250,.35)]">
          <div className="absolute inset-0 rounded-full border-r-[104px] border-t-[104px] border-r-violet-300/75 border-t-transparent" />
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/25" />
          <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-white/25" />
          <div className="absolute inset-0 grid place-items-center text-3xl font-black text-white">{Math.max(1, streak)}/4</div>
        </div>
        <div className="absolute bottom-6 left-6 text-xs font-black uppercase tracking-[0.22em] text-violet-100">Slice meter</div>
      </div>
    )
  }

  return (
    <div className={`relative h-[22rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${template.wash} [perspective:900px]`}>
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-56 w-56 animate-[spin_12s_linear_infinite] [transform-style:preserve-3d]">
          {Array.from({ length: 6 }, (_, index) => {
            const angle = index * 60
            return (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-100/40 bg-teal-200/30 shadow-[0_0_34px_rgba(45,212,191,.45)]"
                style={{ transform: `rotateY(${angle}deg) translateZ(92px)` }}
              />
            )
          })}
          <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-white/20 shadow-[0_0_46px_rgba(255,255,255,.35)]" />
        </div>
      </div>
      <div className="absolute bottom-6 left-6 text-xs font-black uppercase tracking-[0.22em] text-teal-100">Reaction {Math.round(percent)}%</div>
    </div>
  )
}

export default function LearningGameShowcase() {
  const { locale } = useLanguage()
  const audio = useGameAudio()
  const [activeId, setActiveId] = useState<TemplateId>('starship')
  const [level, setLevel] = useState(1)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [message, setMessage] = useState('')

  const activeTemplate = templates.find((template) => template.id === activeId) ?? templates[0]
  const question = useMemo(() => makeQuestion(activeId, level, round), [activeId, level, round])
  const charge = Math.min(100, 20 + round * 10 + streak * 8)

  const selectTemplate = (id: TemplateId) => {
    setActiveId(id)
    setRound(0)
    setScore(0)
    setStreak(0)
    setFeedback('idle')
    setMessage('')
    audio.switch()
  }

  const answer = (choice: string) => {
    if (feedback !== 'idle') return
    const isCorrect = choice === question.answer
    if (isCorrect) {
      const nextStreak = streak + 1
      setScore((value) => value + 100 + nextStreak * 15)
      setStreak(nextStreak)
      setFeedback('correct')
      setMessage(locale === 'zh' ? `命中。连击 x${nextStreak}` : `Hit. Combo x${nextStreak}`)
      audio.correct()
    } else {
      setStreak(0)
      setFeedback('wrong')
      setMessage(locale === 'zh' ? question.hint : question.hint)
      audio.wrong()
    }

    window.setTimeout(() => {
      setFeedback('idle')
      setMessage('')
      setRound((value) => {
        const next = value + 1
        if (next > 0 && next % 5 === 0) setLevel((current) => Math.min(current + 1, 9))
        return next
      })
    }, isCorrect ? 760 : 1450)
  }

  return (
    <section className="relative">
      <div className="mb-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="border-b border-white/10 pb-5">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-white/45">Larry Academy Lab</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {locale === 'zh' ? '数学与科学游戏样板库' : 'Math and Science Game Templates'}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
              {locale === 'zh'
                ? '首批 6 个可复用小游戏模板，已经接入即时答题、动效、计分、连击和 Web Audio 音效。'
                : 'Six reusable game templates with instant questions, effects, scoring, streaks, and Web Audio feedback.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templates.map((template) => {
              const selected = template.id === activeId
              return (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template.id)}
                  className={`group min-h-32 rounded-2xl border p-4 text-left transition ${
                    selected ? 'border-white/45 bg-white text-black shadow-2xl shadow-white/10' : 'border-white/10 bg-white/[0.035] text-white hover:border-white/25 hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: selected ? '#111' : template.accent }}>
                    {template.subject}
                  </span>
                  <span className="mt-3 block text-base font-black leading-tight">
                    {locale === 'zh' ? template.titleZh : template.titleEn}
                  </span>
                  <span className={`mt-2 block text-xs leading-5 ${selected ? 'text-black/58' : 'text-white/45'}`}>
                    {locale === 'zh' ? template.subtitleZh : template.subtitleEn}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Stage template={activeTemplate} charge={charge} streak={streak} round={round} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.94] p-5 text-[#101010] shadow-2xl shadow-black/25 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              {locale === 'zh' ? `第 ${round + 1} 题` : `Round ${round + 1}`}
            </span>
            <span className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white" style={{ backgroundColor: activeTemplate.accent }}>
              Level {level}
            </span>
          </div>
          <h3 className="min-h-24 text-3xl font-black leading-tight sm:text-4xl">{question.prompt}</h3>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice) => (
              <button
                key={choice}
                onClick={() => answer(choice)}
                disabled={feedback !== 'idle'}
                className="rounded-2xl border-2 border-black/10 bg-white px-5 py-5 text-2xl font-black shadow-[0_8px_0_rgba(17,17,17,.13)] transition hover:-translate-y-1 hover:border-black hover:bg-slate-50 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
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
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            [locale === 'zh' ? '分数' : 'Score', score],
            [locale === 'zh' ? '连击' : 'Streak', streak],
            [locale === 'zh' ? '充能' : 'Charge', `${Math.round(charge)}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-4xl font-black text-white">{value}</div>
              <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white/42">{label}</div>
            </div>
          ))}
          <button
            onClick={() => {
              setRound(0)
              setScore(0)
              setStreak(0)
              setLevel(1)
              audio.switch()
            }}
            className="rounded-2xl border border-white/10 bg-white text-black px-6 py-5 text-base font-black transition hover:scale-[1.01] active:scale-[0.99]"
          >
            {locale === 'zh' ? '重置试玩' : 'Reset Demo'}
          </button>
        </div>
      </div>
    </section>
  )
}
