'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const dailyLimitSeconds = 10 * 60
const storageKey = 'larryAcademy_dailyGameplayLimit'
const timerCornerStorageKey = 'larryAcademy_gameplayTimerCorner'

type TimerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type StoredUsage = {
  date: string
  usedSeconds: number
  bonusSeconds?: number
}

type GameTimeAddedDetail = {
  seconds?: number
  persisted?: boolean
}

function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function readUsage(): StoredUsage {
  if (typeof window === 'undefined') {
    return { date: todayKey(), usedSeconds: 0, bonusSeconds: 0 }
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null') as StoredUsage | null
    const date = todayKey()
    if (!parsed || parsed.date !== date) {
      return { date, usedSeconds: 0, bonusSeconds: 0 }
    }

    const bonusSeconds = Math.max(0, Math.floor(Number(parsed.bonusSeconds) || 0))
    const allowanceSeconds = dailyLimitSeconds + bonusSeconds
    return {
      date,
      usedSeconds: Math.min(allowanceSeconds, Math.max(0, Math.floor(Number(parsed.usedSeconds) || 0))),
      bonusSeconds,
    }
  } catch {
    return { date: todayKey(), usedSeconds: 0, bonusSeconds: 0 }
  }
}

function saveUsage(usage: StoredUsage) {
  localStorage.setItem(storageKey, JSON.stringify(usage))
}

function readTimerCorner(): TimerCorner {
  if (typeof window === 'undefined') return 'top-left'

  const value = localStorage.getItem(timerCornerStorageKey)
  if (value === 'top-left' || value === 'top-right' || value === 'bottom-left' || value === 'bottom-right') {
    return value
  }

  return 'top-left'
}

function saveTimerCorner(corner: TimerCorner) {
  localStorage.setItem(timerCornerStorageKey, corner)
}

function consumeResetRequest() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  if (url.searchParams.get('resetGameplayTime') !== '1') return

  localStorage.removeItem(storageKey)
  url.searchParams.delete('resetGameplayTime')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
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
  const [bonusSeconds, setBonusSeconds] = useState(0)
  const [timerCorner, setTimerCorner] = useState<TimerCorner>('top-left')
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    consumeResetRequest()
    const usage = readUsage()
    saveUsage(usage)
    const hydrateTimer = window.setTimeout(() => {
      setUsedSeconds(usage.usedSeconds)
      setBonusSeconds(Math.max(0, Number(usage.bonusSeconds || 0)))
      setTimerCorner(readTimerCorner())
      setLoaded(true)
    }, 0)

    return () => window.clearTimeout(hydrateTimer)
  }, [])

  useEffect(() => {
    const allowanceSeconds = dailyLimitSeconds + bonusSeconds
    if (!active || !loaded || usedSeconds >= allowanceSeconds) return

    const timer = window.setInterval(() => {
      const usage = readUsage()
      const allowanceSeconds = dailyLimitSeconds + Number(usage.bonusSeconds || 0)
      const nextUsage = {
        date: usage.date,
        usedSeconds: Math.min(allowanceSeconds, usage.usedSeconds + 1),
        bonusSeconds: Math.max(0, Number(usage.bonusSeconds || 0)),
      }
      saveUsage(nextUsage)
      setUsedSeconds(nextUsage.usedSeconds)
      setBonusSeconds(nextUsage.bonusSeconds)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [active, loaded, usedSeconds, bonusSeconds])

  useEffect(() => {
    const handleGameTimeAdded = (event: Event) => {
      const detail = (event as CustomEvent<GameTimeAddedDetail>).detail || {}
      if (detail.persisted) {
        const usage = readUsage()
        setUsedSeconds(usage.usedSeconds)
        setBonusSeconds(Math.max(0, Number(usage.bonusSeconds || 0)))
        setLoaded(true)
        return
      }

      const addedSeconds = Math.max(0, Math.floor(Number(detail.seconds || 0)))
      if (!addedSeconds) return

      const usage = readUsage()
      const nextUsage = {
        date: usage.date,
        usedSeconds: usage.usedSeconds,
        bonusSeconds: Math.max(0, Number(usage.bonusSeconds || 0)) + addedSeconds,
      }
      saveUsage(nextUsage)
      setUsedSeconds(nextUsage.usedSeconds)
      setBonusSeconds(nextUsage.bonusSeconds)
      setLoaded(true)
    }

    window.addEventListener('larry:game-time-added', handleGameTimeAdded)
    return () => window.removeEventListener('larry:game-time-added', handleGameTimeAdded)
  }, [])

  const allowanceSeconds = dailyLimitSeconds + bonusSeconds
  const remainingSeconds = Math.max(0, allowanceSeconds - usedSeconds)
  const isLocked = loaded && remainingSeconds <= 0
  const timerTone = remainingSeconds <= 60 ? 'border-rose-300/40 bg-rose-500/20 text-rose-50' : 'border-white/15 bg-black/55 text-white'
  const timerCornerClass = {
    'top-left': 'left-3 top-3',
    'top-right': 'right-3 top-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }[timerCorner]

  const handleTimerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragPoint({ x: event.clientX, y: event.clientY })
  }

  const handleTimerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragPoint) return
    setDragPoint({ x: event.clientX, y: event.clientY })
  }

  const handleTimerPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragPoint) return

    const nextCorner: TimerCorner = `${event.clientY < window.innerHeight / 2 ? 'top' : 'bottom'}-${event.clientX < window.innerWidth / 2 ? 'left' : 'right'}` as TimerCorner
    setTimerCorner(nextCorner)
    saveTimerCorner(nextCorner)
    setDragPoint(null)
  }

  const lockCopy = useMemo(() => ({
    title: locale === 'zh' ? '今天的游戏时间已用完' : 'Gameplay time is finished for today',
    body: locale === 'zh'
      ? '每天最多可以玩 10 分钟游戏。明天再回来继续挑战。'
      : 'You can play games for up to 10 minutes each day. Come back tomorrow to keep playing.',
    timerLabel: locale === 'zh' ? '今日剩余' : 'Today left',
  }), [locale])

  return (
    <div className="relative">
      <div
        onPointerDown={handleTimerPointerDown}
        onPointerMove={handleTimerPointerMove}
        onPointerUp={handleTimerPointerUp}
        onPointerCancel={() => setDragPoint(null)}
        className={`group fixed z-[80] touch-none select-none rounded-2xl border px-4 py-2 text-right shadow-2xl backdrop-blur-md transition-[box-shadow,background-color,border-color] ${timerTone} ${dragPoint ? 'cursor-grabbing' : `cursor-grab ${timerCornerClass}`}`}
        style={dragPoint ? { left: dragPoint.x, top: dragPoint.y, transform: 'translate(-50%, -50%)' } : undefined}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-65">{lockCopy.timerLabel}</div>
        <div className="text-xl font-black tabular-nums">{loaded ? formatTime(remainingSeconds) : '10:00'}</div>
        <div className="pointer-events-none absolute left-0 top-[calc(100%+0.45rem)] w-44 rounded-xl border border-white/12 bg-black/80 px-3 py-2 text-left text-[11px] font-black leading-4 text-white/72 opacity-0 shadow-2xl backdrop-blur-md transition duration-150 group-hover:opacity-100">
          {locale === 'zh' ? '拖动计时器可以移动位置。' : 'Drag the timer to move it.'}
        </div>
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
