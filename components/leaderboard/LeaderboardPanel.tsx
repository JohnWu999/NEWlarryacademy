'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type Locale = 'zh' | 'en'

type RewardLevel = {
  id: string
  min: number
  rank: number
  copy: Record<Locale, string>
  shortCopy: Record<Locale, string>
}

type LeaderboardEntry = {
  id: string
  rank: number
  displayName: string
  initials: string
  image: string | null
  sparks: number
  gems: number
  accuracy: number
  completedCourses: number
  completedLessons: number
  questionsAnswered: number
  heroLevel: RewardLevel
  identityLevel: RewardLevel
  isCurrentUser: boolean
}

type LeaderboardResponse = {
  scope: 'global' | 'course'
  entries: LeaderboardEntry[]
  updatedAt: string
}

const copy = {
  zh: {
    kicker: 'Hero Leaderboard',
    homeTitle: '谁正在点亮学习宇宙',
    courseTitle: '本课程 Hero 排名',
    homeSubtitle: '排行榜按 Spark Hero 排名；Gem 决定身份级别。完成课程、练习题数量和准确率都会推动成长。',
    courseSubtitle: '本课程内的完成度、练习量和准确率，会转化为 Spark 与 Gem。',
    emptyTitle: '第一个 Hero 正在路上',
    emptyBody: '完成视频后的练习，Spark 和 Gem 就会开始进入排行榜。',
    sparks: 'Spark',
    gems: 'Gem',
    accuracy: '准确率',
    questions: '练习题',
    lessons: '课节',
    courses: '课程',
    identity: '宝石身份',
    heroLevel: 'Hero 级别',
    rank: '排名',
    current: '你',
    rule: '排名规则',
    ruleText: 'Hero 排名由 Spark 决定；Gem 决定身份级别。',
    gemsRule: 'Gem 决定身份',
    sparksRule: 'Spark 决定排名',
  },
  en: {
    kicker: 'Hero Leaderboard',
    homeTitle: 'Learning heroes in motion',
    courseTitle: 'Course Hero ranking',
    homeSubtitle: 'Hero rank is powered by Sparks. Gems set identity level. Completed courses, practice volume, and accuracy all matter.',
    courseSubtitle: 'Course completion, practice volume, and accuracy turn into Sparks and Gems.',
    emptyTitle: 'The first Hero is on the way',
    emptyBody: 'Finish the practice after a lesson and Sparks plus Gems will start appearing here.',
    sparks: 'Sparks',
    gems: 'Gems',
    accuracy: 'Accuracy',
    questions: 'Practice',
    lessons: 'Lessons',
    courses: 'Courses',
    identity: 'Gem Identity',
    heroLevel: 'Hero Level',
    rank: 'Rank',
    current: 'You',
    rule: 'Ranking rule',
    ruleText: 'Hero ranking is decided by Sparks; Gems decide identity level.',
    gemsRule: 'Gems set identity',
    sparksRule: 'Sparks set rank',
  },
} satisfies Record<Locale, Record<string, string>>

function GemGlyph({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 3 56 19 32 61 8 19 32 3Z" fill="url(#gem-g)" />
      <path d="M8 19h48M20 19l12 42 12-42M20 19 32 3l12 16" fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="2.2" strokeLinejoin="round" />
      <defs>
        <linearGradient id="gem-g" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset=".45" stopColor="#22d3ee" />
          <stop offset=".74" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function SparkGlyph({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M33 3 41 24 62 32 41 40 33 61 25 40 4 32 25 24 33 3Z" fill="url(#spark-g)" />
      <path d="M33 14 38 27 51 32 38 37 33 50 28 37 15 32 28 27 33 14Z" fill="#fff7ed" fillOpacity=".86" />
      <defs>
        <linearGradient id="spark-g" x1="8" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset=".42" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function IdentityGlyph({ level }: { level: number }) {
  const sides = Math.min(8, 4 + level)
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = (Math.PI * 2 * index) / sides - Math.PI / 2
    const radius = index % 2 === 0 ? 27 : 19
    return `${32 + Math.cos(angle) * radius},${32 + Math.sin(angle) * radius}`
  }).join(' ')

  return (
    <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
      <polygon points={points} fill="rgba(103,232,249,.16)" stroke="#67e8f9" strokeWidth="2.4" />
      <circle cx="32" cy="32" r={9 + level * 2} fill="rgba(139,92,246,.24)" stroke="#a78bfa" strokeWidth="2" />
      <path d="M32 17v30M17 32h30" stroke="#ecfeff" strokeWidth="2" strokeLinecap="round" opacity=".65" />
    </svg>
  )
}

function HeroGlyph({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
      <circle cx="32" cy="32" r="25" fill="rgba(245,158,11,.13)" stroke="#fbbf24" strokeWidth="2.2" />
      <path
        d="M32 8c4 12 10 18 22 24-12 4-18 10-22 24-4-14-10-20-22-24 12-6 18-12 22-24Z"
        fill="url(#hero-flare)"
      />
      <path d={`M32 ${31 - level * 2}v${level * 4 + 7}M${25 - level} 32h${level * 2 + 14}`} stroke="#fff7ed" strokeWidth="2.2" strokeLinecap="round" opacity=".82" />
      <defs>
        <linearGradient id="hero-flare" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" />
          <stop offset=".5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function AccuracyRing({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)))
  const circumference = 2 * Math.PI * 18

  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="url(#accuracy-g)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safeValue / 100)}
        />
        <defs>
          <linearGradient id="accuracy-g" x1="0" x2="44" y1="0" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] font-black text-white">{safeValue}%</div>
    </div>
  )
}

function Avatar({ entry }: { entry: LeaderboardEntry }) {
  if (entry.image) {
    return <img src={entry.image} alt="" className="h-full w-full rounded-2xl object-cover" />
  }

  return (
    <div className="grid h-full w-full place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-lg font-black text-white shadow-inner">
      {entry.initials}
    </div>
  )
}

function formatNumber(value: number) {
  if (value >= 10000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
}

export default function LeaderboardPanel({
  courseId,
  variant = 'home',
}: {
  courseId?: string
  variant?: 'home' | 'course'
}) {
  const { locale } = useLanguage()
  const activeLocale: Locale = locale === 'zh' ? 'zh' : 'en'
  const text = copy[activeLocale]
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ limit: variant === 'home' ? '8' : '6' })
    if (courseId) params.set('courseId', courseId)

    setLoading(true)
    fetch(`/api/leaderboard?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload) setData(payload)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [courseId, variant])

  const entries = data?.entries || []
  const topEntries = useMemo(() => entries.slice(0, 3), [entries])
  const restEntries = useMemo(() => entries.slice(3), [entries])
  const compact = variant === 'course'

  return (
    <section className={`leaderboard-shell relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07090d] text-white shadow-2xl shadow-black/30 ${compact ? 'mt-8 p-4 sm:p-5' : 'p-5 sm:p-7 lg:p-8'}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,.2),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(251,191,36,.2),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.055),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <SparkGlyph className="h-4 w-4" />
              {text.kicker}
            </div>
            <h2 className={`mt-4 font-black tracking-normal ${compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>
              {compact ? text.courseTitle : text.homeTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              {compact ? text.courseSubtitle : text.homeSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-[23rem]">
            <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
                <GemGlyph className="h-5 w-5" />
                {text.identity}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{text.gemsRule}</p>
            </div>
            <div className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.055] p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
                <SparkGlyph className="h-5 w-5" />
                {text.heroLevel}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{text.sparksRule}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-[1.7rem] border border-white/10 bg-white/[0.045]" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-7 rounded-[1.7rem] border border-dashed border-white/15 bg-white/[0.035] p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.06]">
              <SparkGlyph className="h-9 w-9" />
            </div>
            <h3 className="mt-5 text-2xl font-black">{text.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-400">{text.emptyBody}</p>
          </div>
        ) : (
          <>
            <div className={`mt-7 grid gap-4 ${compact ? 'lg:grid-cols-3' : 'lg:grid-cols-[0.9fr_1.12fr_0.9fr]'}`}>
              {[topEntries[1], topEntries[0], topEntries[2]].filter(Boolean).map((entry) => {
                const first = entry.rank === 1
                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-podium group relative overflow-hidden rounded-[1.7rem] border p-4 transition duration-300 hover:-translate-y-1 ${
                      first
                        ? 'border-amber-200/40 bg-gradient-to-br from-amber-300/18 via-white/[0.05] to-cyan-300/10 lg:-mt-4'
                        : 'border-white/10 bg-white/[0.045]'
                    }`}
                  >
                    <div className="absolute right-4 top-4 text-6xl font-black text-white/[0.035]">#{entry.rank}</div>
                    <div className="relative flex items-start gap-4">
                      <div className={`${first ? 'h-16 w-16' : 'h-14 w-14'} shrink-0 rounded-2xl ring-1 ring-white/15`}>
                        <Avatar entry={entry} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-black">{entry.displayName}</h3>
                          {entry.isCurrentUser && <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-black">{text.current}</span>}
                        </div>
                        <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
                          {entry.heroLevel.copy[activeLocale]}
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-5 grid grid-cols-[1fr_auto] items-end gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-3xl font-black">
                          <SparkGlyph className="h-8 w-8" />
                          {formatNumber(entry.sparks)}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-500">{text.sparks}</div>
                      </div>
                      <AccuracyRing value={entry.accuracy} />
                    </div>

                    <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-black/22 p-2">
                        <div className="text-sm font-black">{entry.gems}</div>
                        <div className="mt-1 text-[10px] font-bold text-slate-500">{text.gems}</div>
                      </div>
                      <div className="rounded-2xl bg-black/22 p-2">
                        <div className="text-sm font-black">{entry.questionsAnswered}</div>
                        <div className="mt-1 text-[10px] font-bold text-slate-500">{text.questions}</div>
                      </div>
                      <div className="rounded-2xl bg-black/22 p-2">
                        <div className="text-sm font-black">{courseId ? entry.completedLessons : entry.completedCourses}</div>
                        <div className="mt-1 text-[10px] font-bold text-slate-500">{courseId ? text.lessons : text.courses}</div>
                      </div>
                    </div>

                    <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                      <IdentityGlyph level={entry.identityLevel.rank} />
                      <div className="min-w-0">
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{text.identity}</div>
                        <div className="truncate text-sm font-black">{entry.identityLevel.copy[activeLocale]}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {restEntries.length > 0 && (
              <div className="mt-4 grid gap-3">
                {restEntries.map((entry) => (
                  <div key={entry.id} className="group grid gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-200/30 hover:bg-white/[0.055] sm:grid-cols-[4rem_1fr_auto] sm:items-center">
                    <div className="flex items-center gap-3 sm:block">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.055] text-sm font-black text-slate-300">#{entry.rank}</div>
                      <div className="h-10 w-10 rounded-2xl sm:hidden">
                        <Avatar entry={entry} />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_8rem] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="hidden h-11 w-11 shrink-0 rounded-2xl sm:block">
                          <Avatar entry={entry} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-black">{entry.displayName}</div>
                            {entry.isCurrentUser && <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-black">{text.current}</span>}
                          </div>
                          <div className="mt-1 truncate text-xs font-bold text-slate-500">{entry.heroLevel.shortCopy[activeLocale]} · {entry.identityLevel.shortCopy[activeLocale]}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-black text-amber-100">
                        <SparkGlyph className="h-5 w-5" />
                        {formatNumber(entry.sparks)}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-black text-cyan-100">
                        <GemGlyph className="h-5 w-5" />
                        {entry.gems}
                      </div>
                      <div className="text-sm font-black text-slate-300">{entry.accuracy}% {text.accuracy}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-black uppercase tracking-[0.18em] text-slate-300">{text.rule}</div>
          <div className="max-w-3xl leading-6">{text.ruleText}</div>
        </div>
      </div>

      <style jsx>{`
        .leaderboard-shell {
          isolation: isolate;
        }

        .leaderboard-podium::after {
          content: '';
          position: absolute;
          inset: auto 14% -42% 14%;
          height: 60%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.18), transparent 70%);
          opacity: 0;
          transition: opacity 260ms ease;
        }

        .leaderboard-podium:hover::after {
          opacity: 1;
        }

        @media (prefers-reduced-motion: no-preference) {
          .leaderboard-podium {
            animation: leaderboard-rise 680ms cubic-bezier(.18, .95, .24, 1) both;
          }
        }

        @keyframes leaderboard-rise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  )
}
