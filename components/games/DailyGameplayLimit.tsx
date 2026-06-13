'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const dailyLimitSeconds = 10 * 60
const storageKey = 'larryAcademy_dailyGameplayLimit'
const timerCornerStorageKey = 'larryAcademy_gameplayTimerCorner'

type TimerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type StoredUsage = {
  date: string
  usedSeconds: number
  bonusSeconds?: number
  visited?: boolean
}

type GameTimeAddedDetail = {
  seconds?: number
  persisted?: boolean
}

function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function dateNumber(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day) / 86400000
}

function isYesterday(storedDate: string, date: string) {
  const storedDay = dateNumber(storedDate)
  const currentDay = dateNumber(date)
  return storedDay !== null && currentDay !== null && currentDay - storedDay === 1
}

function carriedSecondsFrom(usage: StoredUsage, date: string) {
  if (!usage.visited || !isYesterday(usage.date, date)) return 0

  const bonusSeconds = Math.max(0, Math.floor(Number(usage.bonusSeconds) || 0))
  const allowanceSeconds = dailyLimitSeconds + bonusSeconds
  const usedSeconds = Math.min(allowanceSeconds, Math.max(0, Math.floor(Number(usage.usedSeconds) || 0)))
  return Math.max(0, allowanceSeconds - usedSeconds)
}

function readUsage(): StoredUsage {
  if (typeof window === 'undefined') {
    return { date: todayKey(), usedSeconds: 0, bonusSeconds: 0, visited: false }
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null') as StoredUsage | null
    const date = todayKey()
    if (!parsed || parsed.date !== date) {
      return { date, usedSeconds: 0, bonusSeconds: parsed ? carriedSecondsFrom(parsed, date) : 0, visited: false }
    }

    const bonusSeconds = Math.max(0, Math.floor(Number(parsed.bonusSeconds) || 0))
    const allowanceSeconds = dailyLimitSeconds + bonusSeconds
    return {
      date,
      usedSeconds: Math.min(allowanceSeconds, Math.max(0, Math.floor(Number(parsed.usedSeconds) || 0))),
      bonusSeconds,
      visited: Boolean(parsed.visited),
    }
  } catch {
    return { date: todayKey(), usedSeconds: 0, bonusSeconds: 0, visited: false }
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

function getNearestTimerCorner(clientX: number, clientY: number): TimerCorner {
  return `${clientY < window.innerHeight / 2 ? 'top' : 'bottom'}-${clientX < window.innerWidth / 2 ? 'left' : 'right'}` as TimerCorner
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
  const [isDraggingTimer, setIsDraggingTimer] = useState(false)
  const isDraggingTimerRef = useRef(false)
  const lastTimerPointRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    consumeResetRequest()
    const usage = { ...readUsage(), visited: true }
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
        visited: true,
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
        visited: true,
      }
      saveUsage(nextUsage)
      setUsedSeconds(nextUsage.usedSeconds)
      setBonusSeconds(nextUsage.bonusSeconds)
      setLoaded(true)
    }

    window.addEventListener('larry:game-time-added', handleGameTimeAdded)
    return () => window.removeEventListener('larry:game-time-added', handleGameTimeAdded)
  }, [])

  useEffect(() => {
    const finishTimerDrag = (event: PointerEvent) => {
      if (!isDraggingTimerRef.current) return

      const pointer = event.type === 'pointercancel' && lastTimerPointRef.current
        ? lastTimerPointRef.current
        : { x: event.clientX, y: event.clientY }
      const nextCorner = getNearestTimerCorner(pointer.x, pointer.y)
      setTimerCorner(nextCorner)
      saveTimerCorner(nextCorner)
      isDraggingTimerRef.current = false
      lastTimerPointRef.current = null
      setIsDraggingTimer(false)
      setDragPoint(null)
    }

    const moveTimer = (event: PointerEvent) => {
      if (!isDraggingTimerRef.current) return
      const nextCorner = getNearestTimerCorner(event.clientX, event.clientY)
      lastTimerPointRef.current = { x: event.clientX, y: event.clientY }
      setDragPoint({ x: event.clientX, y: event.clientY })
      setTimerCorner(nextCorner)
      saveTimerCorner(nextCorner)
    }

    window.addEventListener('pointermove', moveTimer)
    window.addEventListener('pointerup', finishTimerDrag)
    window.addEventListener('pointercancel', finishTimerDrag)

    return () => {
      window.removeEventListener('pointermove', moveTimer)
      window.removeEventListener('pointerup', finishTimerDrag)
      window.removeEventListener('pointercancel', finishTimerDrag)
    }
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

  const handleTimerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    isDraggingTimerRef.current = true
    lastTimerPointRef.current = { x: event.clientX, y: event.clientY }
    setIsDraggingTimer(true)
    setDragPoint({ x: event.clientX, y: event.clientY })
  }

  const lockCopy = useMemo(() => ({
    title: locale === 'zh' ? '今天的游戏时间已用完' : 'Gameplay time is finished for today',
    body: locale === 'zh'
      ? '每天有 10 分钟基础游戏时间；如果昨天进入过游戏，没用完的时间会结转到今天。明天再回来继续挑战。'
      : 'You get 10 base minutes each day; if you entered games yesterday, unused time carries into today. Come back tomorrow to keep playing.',
    timerLabel: locale === 'zh' ? '今日剩余' : 'Today left',
  }), [locale])

  return (
    <div className="relative">
      <div
        onPointerDown={handleTimerPointerDown}
        className={`fixed z-[80] touch-none select-none rounded-2xl border px-4 py-2 text-right shadow-2xl backdrop-blur-md transition-[box-shadow,background-color,border-color] ${timerTone} ${isDraggingTimer ? 'cursor-grabbing' : `cursor-grab ${timerCornerClass}`}`}
        style={dragPoint ? { left: dragPoint.x, top: dragPoint.y, transform: 'translate(-50%, -50%)' } : undefined}
      >
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
