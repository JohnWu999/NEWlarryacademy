'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const dailyLimitSeconds = 10 * 60
const storageKey = 'larryAcademy_dailyGameplayLimit'

type StoredUsage = {
  date: string
  usedSeconds: number
}

function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function readUsage(): StoredUsage {
  if (typeof window === 'undefined') {
    return { date: todayKey(), usedSeconds: 0 }
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null') as StoredUsage | null
    const date = todayKey()
    if (!parsed || parsed.date !== date) {
      return { date, usedSeconds: 0 }
    }

    return {
      date,
      usedSeconds: Math.min(dailyLimitSeconds, Math.max(0, Math.floor(Number(parsed.usedSeconds) || 0))),
    }
  } catch {
    return { date: todayKey(), usedSeconds: 0 }
  }
}

function saveUsage(usage: StoredUsage) {
  localStorage.setItem(storageKey, JSON.stringify(usage))
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export default function DailyGameplayLimit({ active = true, children }: { active?: boolean; children: ReactNode }) {
  const { locale } = useLanguage()
  const [loaded, setLoaded] = useState(false)
  const [usedSeconds, setUsedSeconds] = useState(0)

  useEffect(() => {
    const usage = readUsage()
    saveUsage(usage)
    const hydrateTimer = window.setTimeout(() => {
      setUsedSeconds(usage.usedSeconds)
      setLoaded(true)
    }, 0)

    return () => window.clearTimeout(hydrateTimer)
  }, [])

  useEffect(() => {
    if (!active || !loaded || usedSeconds >= dailyLimitSeconds) return

    const timer = window.setInterval(() => {
      const usage = readUsage()
      const nextUsage = {
        date: usage.date,
        usedSeconds: Math.min(dailyLimitSeconds, usage.usedSeconds + 1),
      }
      saveUsage(nextUsage)
      setUsedSeconds(nextUsage.usedSeconds)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [active, loaded, usedSeconds])

  const remainingSeconds = Math.max(0, dailyLimitSeconds - usedSeconds)
  const isLocked = loaded && remainingSeconds <= 0
  const timerTone = remainingSeconds <= 60 ? 'border-rose-300/40 bg-rose-500/20 text-rose-50' : 'border-white/15 bg-black/55 text-white'

  const lockCopy = useMemo(() => ({
    title: locale === 'zh' ? '今天的游戏时间已用完' : 'Gameplay time is finished for today',
    body: locale === 'zh'
      ? '每天最多可以玩 10 分钟游戏。明天再回来继续挑战。'
      : 'You can play games for up to 10 minutes each day. Come back tomorrow to keep playing.',
    timerLabel: locale === 'zh' ? '今日剩余' : 'Today left',
  }), [locale])

  return (
    <div className="relative">
      <div className={`absolute left-3 top-3 z-30 rounded-2xl border px-4 py-2 text-left shadow-2xl backdrop-blur-md ${timerTone}`}>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-65">{lockCopy.timerLabel}</div>
        <div className="text-xl font-black tabular-nums">{loaded ? formatTime(remainingSeconds) : '10:00'}</div>
      </div>

      {isLocked ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-black/85 p-8 text-center text-white shadow-2xl shadow-black/30">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl">⏱</div>
          <h2 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">{lockCopy.title}</h2>
          <p className="mt-4 max-w-lg text-base font-bold leading-7 text-white/58">{lockCopy.body}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
