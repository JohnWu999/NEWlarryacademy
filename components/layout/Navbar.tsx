'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import type { Locale } from '@/lib/i18n'

const dailyGameplayStorageKey = 'larryAcademy_dailyGameplayLimit'

function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function addLocalGameTimeBonus(seconds: number) {
  if (typeof window === 'undefined') return

  const date = todayKey()
  const addedSeconds = Math.max(0, Math.floor(seconds))
  if (!addedSeconds) return

  try {
    const parsed = JSON.parse(window.localStorage.getItem(dailyGameplayStorageKey) || 'null') as {
      date?: string
      usedSeconds?: number
      bonusSeconds?: number
    } | null
    const current = parsed?.date === date ? parsed : null
    window.localStorage.setItem(dailyGameplayStorageKey, JSON.stringify({
      date,
      usedSeconds: Math.max(0, Math.floor(Number(current?.usedSeconds) || 0)),
      bonusSeconds: Math.max(0, Math.floor(Number(current?.bonusSeconds) || 0)) + addedSeconds,
    }))
  } catch {
    window.localStorage.setItem(dailyGameplayStorageKey, JSON.stringify({
      date,
      usedSeconds: 0,
      bonusSeconds: addedSeconds,
    }))
  }
}

export default function Navbar() {
  const { data: session } = useSession()
  const { locale, setLocale, t } = useLanguage()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [rewards, setRewards] = useState({ points: 0, gems: 0 })
  const [rewardBurst, setRewardBurst] = useState<{ points: number; gems: number; key: number } | null>(null)
  const [exchangeState, setExchangeState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [gemExchangeState, setGemExchangeState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const pathname = usePathname()

  const handleLocaleChange = (nextLocale: Locale) => {
    setLocale(nextLocale)
    router.refresh()
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!session) {
      const resetTimer = window.setTimeout(() => {
        setRewards({ points: 0, gems: 0 })
      }, 0)
      return () => window.clearTimeout(resetTimer)
    }

    let active = true
    fetch('/api/user/stats')
      .then((response) => response.ok ? response.json() : null)
      .then((stats) => {
        if (active && stats) {
          setRewards({ points: Number(stats.sparks ?? stats.points ?? 0), gems: Number(stats.gems || 0) })
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [session])

  useEffect(() => {
    const playRewardTone = (points: number, gems: number) => {
      try {
        const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()
        const variant = (points + gems + Date.now()) % 3
        const sequence = gems > 0
          ? variant === 0
            ? [659, 880, 1175, 1568, 1760]
            : variant === 1
              ? [784, 988, 1319, 1661]
              : [587, 740, 988, 1480, 1976]
          : variant === 0
            ? [523, 659, 784, 1046]
            : variant === 1
              ? [440, 660, 880, 1320]
              : [587, 740, 932, 1175]

        if (gems > 0) {
          const bass = ctx.createOscillator()
          const bassGain = ctx.createGain()
          bass.type = 'triangle'
          bass.frequency.setValueAtTime(110, ctx.currentTime)
          bass.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.22)
          bassGain.gain.setValueAtTime(0.0001, ctx.currentTime)
          bassGain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.035)
          bassGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42)
          bass.connect(bassGain)
          bassGain.connect(ctx.destination)
          bass.start()
          bass.stop(ctx.currentTime + 0.45)
        }

        sequence.forEach((frequency, index) => {
          const oscillator = ctx.createOscillator()
          const gain = ctx.createGain()
          const start = ctx.currentTime + index * (gems > 0 ? 0.062 : 0.072)
          oscillator.type = (gems > 0 ? (index % 2 ? 'triangle' : 'sine') : (index % 2 ? 'sine' : 'triangle')) as OscillatorType
          oscillator.frequency.setValueAtTime(frequency + Math.min(points, 80), start)
          oscillator.frequency.exponentialRampToValueAtTime((frequency + Math.min(points, 80)) * 1.018, start + 0.08)
          gain.gain.setValueAtTime(0.0001, start)
          gain.gain.exponentialRampToValueAtTime(gems > 0 ? 0.12 : 0.075, start + 0.018)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.19)
          oscillator.connect(gain)
          gain.connect(ctx.destination)
          oscillator.start(start)
          oscillator.stop(start + 0.21)
        })
        window.setTimeout(() => void ctx.close().catch(() => {}), 900)
      } catch {}
    }

    const handleReward = (event: Event) => {
      const detail = (event as CustomEvent<{ points?: number; gems?: number }>).detail || {}
      const points = Number(detail.points || 0)
      const gems = Number(detail.gems || 0)
      if (!points && !gems) return

      setRewards((current) => ({
        points: Math.max(0, current.points + points),
        gems: Math.max(0, current.gems + gems),
      }))
      if (points > 0 || gems > 0) {
        setRewardBurst({ points: Math.max(0, points), gems: Math.max(0, gems), key: Date.now() })
        playRewardTone(points, gems)
        window.setTimeout(() => setRewardBurst(null), 1400)
      }
    }

    window.addEventListener('larry:reward-earned', handleReward)
    return () => window.removeEventListener('larry:reward-earned', handleReward)
  }, [])

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.courses'), href: '/subjects' },
    { name: t('nav.tools'), href: '/tools' },
    { name: t('nav.games'), href: '/games' },
    { name: t('nav.about'), href: '/about' },
  ]

  const exchangeGemForGameTime = async () => {
    if (exchangeState === 'saving' || rewards.gems < 1) return

    setExchangeState('saving')
    try {
      const response = await fetch('/api/rewards/exchange-game-time', {
        method: 'POST',
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result) {
        setExchangeState('error')
        window.setTimeout(() => setExchangeState('idle'), 1800)
        return
      }

      const nextGems = Number(result.gems ?? Math.max(0, rewards.gems - 1))
      const addedSeconds = Number(result.addedSeconds || 60)
      setRewards((current) => ({ ...current, gems: Math.max(0, nextGems) }))
      addLocalGameTimeBonus(addedSeconds)
      window.dispatchEvent(new CustomEvent('larry:game-time-added', {
        detail: { seconds: addedSeconds, persisted: true },
      }))
      setExchangeState('success')
      window.setTimeout(() => setExchangeState('idle'), 1800)
    } catch {
      setExchangeState('error')
      window.setTimeout(() => setExchangeState('idle'), 1800)
    }
  }

  const exchangeSparksForGem = async () => {
    if (gemExchangeState === 'saving' || rewards.points < 50) return

    setGemExchangeState('saving')
    try {
      const response = await fetch('/api/rewards/exchange-gem', {
        method: 'POST',
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result) {
        setGemExchangeState('error')
        window.setTimeout(() => setGemExchangeState('idle'), 1800)
        return
      }

      setRewards({
        points: Math.max(0, Number(result.points || 0)),
        gems: Math.max(0, Number(result.gems || 0)),
      })
      setRewardBurst({ points: 0, gems: 1, key: Date.now() })
      window.setTimeout(() => setRewardBurst(null), 1400)
      setGemExchangeState('success')
      window.setTimeout(() => setGemExchangeState('idle'), 1800)
    } catch {
      setGemExchangeState('error')
      window.setTimeout(() => setGemExchangeState('idle'), 1800)
    }
  }

  const exchangeLabel = exchangeState === 'saving'
    ? (locale === 'zh' ? '兑换中' : 'Adding')
    : exchangeState === 'success'
      ? '+1 min'
      : exchangeState === 'error'
        ? (locale === 'zh' ? '失败' : 'Retry')
        : '+1 min'
  const exchangeTitle = locale === 'zh' ? '用 1 个 Gem 兑换 1 分钟游戏时间' : 'Trade 1 Gem for 1 minute of game time'
  const gemExchangeLabel = gemExchangeState === 'saving'
    ? (locale === 'zh' ? '兑换中' : 'Trading')
    : gemExchangeState === 'success'
      ? '+1 Gem'
      : gemExchangeState === 'error'
        ? (locale === 'zh' ? '失败' : 'Retry')
        : '50→Gem'
  const gemExchangeTitle = locale === 'zh' ? '用 50 个 Spark 兑换 1 个 Gem' : 'Trade 50 Sparks for 1 Gem'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#050505]/80 backdrop-blur-lg border-b border-white/10 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Left: Language Switcher & Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 min-w-0 shrink">
            {/* Language Switcher */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => handleLocaleChange('zh')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  locale === 'zh' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                中
              </button>
              <button
                onClick={() => handleLocaleChange('en')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  locale === 'en' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                EN
              </button>
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                🎓
              </div>
              <span className="text-xl font-black tracking-tighter text-white hidden sm:block">LARRY ACADEMY</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === link.href 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <div id="larry-reward-hud" className="relative flex items-center gap-2">
                  {rewardBurst && (
                    <div key={rewardBurst.key} className="pointer-events-none fixed right-28 top-[68vh] z-[70] flex flex-col items-end gap-2">
                      <div className="reward-burst-aura" />
                      {Array.from({ length: 12 }).map((_, index) => (
                        <span
                          key={index}
                          className="reward-shard"
                          style={{
                            left: `${18 + ((index * 17) % 62)}%`,
                            top: `${18 + ((index * 23) % 58)}%`,
                            animationDelay: `${index * 0.025}s`,
                          }}
                        />
                      ))}
                      {rewardBurst.gems > 0 && (
                        <div className="reward-fly-chip reward-fly-gem">
                          <img src="/reward-icons/gem.png" alt="" className="reward-icon reward-icon-fly" />
                          <span>+{rewardBurst.gems}</span>
                        </div>
                      )}
                      {rewardBurst.points > 0 && (
                        <div className="reward-fly-chip reward-fly-points">
                          <img src="/reward-icons/spark.png" alt="" className="reward-icon reward-icon-fly" />
                          <span>+{rewardBurst.points}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <Link href="/profile" className="reward-pill reward-pill-gem inline-flex h-10 min-w-[5.9rem] items-center justify-center gap-2.5 rounded-full px-3" aria-label={`${rewards.gems} gems`}>
                    <img src="/reward-icons/gem.png" alt="" className="reward-icon block size-7 shrink-0 object-contain" />
                    <span className="reward-count">{rewards.gems}</span>
                  </Link>
                  <Link href="/profile" className="reward-pill reward-pill-points inline-flex h-10 min-w-[5.9rem] items-center justify-center gap-2.5 rounded-full px-3" aria-label={`${rewards.points} sparks`}>
                    <img src="/reward-icons/spark.png" alt="" className="reward-icon block size-7 shrink-0 object-contain" />
                    <span className="reward-count">{rewards.points}</span>
                  </Link>
                  <div className="exchange-panel" aria-label={locale === 'zh' ? '奖励兑换说明' : 'Reward exchange options'}>
                    <div className="exchange-row">
                      <span className="exchange-copy">{locale === 'zh' ? '加 1 分钟会抵掉 1 个 Gem' : '+1 minute costs 1 Gem'}</span>
                      <button
                        type="button"
                        onClick={exchangeGemForGameTime}
                        disabled={exchangeState === 'saving' || rewards.gems < 1}
                        title={exchangeTitle}
                        aria-label={exchangeTitle}
                        className={`exchange-button exchange-time-button ${exchangeState === 'success' ? 'exchange-success' : ''} ${exchangeState === 'error' ? 'exchange-error' : ''}`}
                      >
                        {exchangeLabel}
                      </button>
                    </div>
                    <div className="exchange-row">
                      <span className="exchange-copy">{locale === 'zh' ? '50 个 Spark 可以换 1 个 Gem' : '50 Sparks can trade for 1 Gem'}</span>
                      <button
                        type="button"
                        onClick={exchangeSparksForGem}
                        disabled={gemExchangeState === 'saving' || rewards.points < 50}
                        title={gemExchangeTitle}
                        aria-label={gemExchangeTitle}
                        className={`exchange-button exchange-gem-button ${gemExchangeState === 'success' ? 'exchange-success' : ''} ${gemExchangeState === 'error' ? 'exchange-error' : ''}`}
                      >
                        {gemExchangeLabel}
                      </button>
                    </div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-full text-sm font-bold border border-red-500/20 transition-all"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-white border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#050505] border-b border-white/10 animate-in slide-in-from-top duration-300">
          <div className="px-4 py-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-xl text-base font-medium ${
                  pathname === link.href ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-white/10 flex flex-col space-y-3">
              {session ? (
                <>
                  <div className="mx-4 grid grid-cols-2 gap-2">
                    <div className="reward-pill reward-pill-gem inline-flex h-10 items-center justify-center gap-2.5 rounded-full px-3">
                      <img src="/reward-icons/gem.png" alt="" className="reward-icon block size-7 shrink-0 object-contain" />
                      <span className="reward-count">{rewards.gems}</span>
                    </div>
                    <div className="reward-pill reward-pill-points inline-flex h-10 items-center justify-center gap-2.5 rounded-full px-3">
                      <img src="/reward-icons/spark.png" alt="" className="reward-icon block size-7 shrink-0 object-contain" />
                      <span className="reward-count">{rewards.points}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={exchangeGemForGameTime}
                    disabled={exchangeState === 'saving' || rewards.gems < 1}
                    className={`mx-4 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-45 ${exchangeState === 'success' ? 'border-emerald-300/35 bg-emerald-400/15 text-emerald-100' : ''} ${exchangeState === 'error' ? 'border-rose-300/35 bg-rose-400/15 text-rose-100' : ''}`}
                  >
                    {exchangeLabel} · {locale === 'zh' ? '加 1 分钟会抵掉 1 个 Gem' : '+1 minute costs 1 Gem'}
                  </button>
                  <button
                    type="button"
                    onClick={exchangeSparksForGem}
                    disabled={gemExchangeState === 'saving' || rewards.points < 50}
                    className={`mx-4 rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-45 ${gemExchangeState === 'success' ? 'border-emerald-300/35 bg-emerald-400/15 text-emerald-100' : ''} ${gemExchangeState === 'error' ? 'border-rose-300/35 bg-rose-400/15 text-rose-100' : ''}`}
                  >
                    {gemExchangeLabel} · {locale === 'zh' ? '50 个 Spark 可以换 1 个 Gem' : '50 Sparks can trade for 1 Gem'}
                  </button>
                  <Link href="/profile" className="px-4 py-3 text-gray-400" onClick={() => setMobileMenuOpen(false)}>{t('nav.profile')}</Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left px-4 py-3 text-red-500 font-bold">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-3 text-gray-400" onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
                  <Link href="/register" className="mx-4 py-3 bg-blue-600 text-white rounded-xl text-center font-bold" onClick={() => setMobileMenuOpen(false)}>{t('nav.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .reward-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.62rem;
          height: 2.5rem;
          min-width: 5.2rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 0.34rem 0.82rem 0.34rem 0.42rem;
          color: white;
          font-size: 0.9rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 34px rgba(0,0,0,0.22);
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }
        .reward-pill:hover {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.28);
        }
        .reward-pill-gem {
          background: linear-gradient(135deg, rgba(11, 42, 60, 0.88), rgba(8, 23, 45, 0.72));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), 0 0 28px rgba(45, 212, 191, 0.14);
        }
        .reward-pill-points {
          background: linear-gradient(135deg, rgba(63, 35, 6, 0.9), rgba(48, 17, 12, 0.72));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), 0 0 28px rgba(245, 158, 11, 0.16);
        }
        .reward-icon {
          display: block;
          width: 1.75rem;
          height: 1.75rem;
          flex: 0 0 auto;
          object-fit: contain;
          line-height: 1;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.16));
        }
        .reward-icon-fly {
          width: 2rem;
          height: 2rem;
        }
        .reward-count {
          min-width: 1.65rem;
          text-align: left;
          display: inline-block;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 1px 10px rgba(0,0,0,0.35);
        }
        .exchange-panel {
          position: absolute;
          right: 0;
          top: calc(100% + 0.62rem);
          z-index: 4;
          display: grid;
          width: min(23rem, calc(100vw - 2rem));
          gap: 0.35rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(5, 9, 18, 0.82);
          padding: 0.42rem;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(14px);
        }
        .exchange-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.5rem;
          min-height: 1.9rem;
        }
        .exchange-copy {
          min-width: 0;
          color: rgba(255, 255, 255, 0.76);
          font-size: 0.68rem;
          font-weight: 850;
          line-height: 1.18;
          letter-spacing: 0;
          text-align: right;
        }
        .exchange-button {
          min-width: 3.55rem;
          height: 1.55rem;
          border-radius: 999px;
          border: 1px solid rgba(103, 232, 249, 0.38);
          background: rgba(8, 47, 73, 0.94);
          color: #cffafe;
          font-size: 0.62rem;
          font-weight: 950;
          line-height: 1;
          letter-spacing: 0;
          box-shadow: 0 10px 26px rgba(8, 47, 73, 0.36), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 160ms ease, opacity 160ms ease, border-color 160ms ease, background 160ms ease;
        }
        .exchange-button:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.04);
          border-color: rgba(165, 243, 252, 0.72);
          background: rgba(14, 116, 144, 0.96);
        }
        .exchange-button:disabled {
          cursor: not-allowed;
          opacity: 0.52;
        }
        .exchange-gem-button {
          min-width: 4.15rem;
          border-color: rgba(252, 211, 77, 0.42);
          background: rgba(92, 52, 10, 0.96);
          color: #fef3c7;
          box-shadow: 0 10px 26px rgba(92, 52, 10, 0.36), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .exchange-gem-button:hover:not(:disabled) {
          border-color: rgba(253, 230, 138, 0.74);
          background: rgba(180, 83, 9, 0.96);
        }
        .exchange-success {
          border-color: rgba(110, 231, 183, 0.62);
          background: rgba(6, 95, 70, 0.96);
          color: #d1fae5;
        }
        .exchange-error {
          border-color: rgba(253, 164, 175, 0.62);
          background: rgba(136, 19, 55, 0.96);
          color: #ffe4e6;
        }
        .reward-fly-chip {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.62rem;
          border-radius: 999px;
          padding: 0.46rem 0.9rem 0.46rem 0.5rem;
          color: white;
          font-weight: 950;
          font-size: 1.05rem;
          border: 1px solid rgba(255,255,255,0.24);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35);
          animation: reward-fly 1.25s cubic-bezier(.16, .88, .22, 1) forwards;
        }
        .reward-fly-chip::after {
          content: '';
          position: absolute;
          inset: -10px;
          z-index: -1;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(255,255,255,0.42), transparent 68%);
          opacity: 0;
          animation: reward-flash 520ms ease-out forwards;
        }
        .reward-fly-gem {
          background: rgba(10, 136, 132, 0.92);
        }
        .reward-fly-points {
          background: rgba(180, 83, 9, 0.92);
          animation-delay: 90ms;
        }
        .reward-burst-aura {
          position: absolute;
          right: -1.2rem;
          top: -1.2rem;
          width: 9.5rem;
          height: 9.5rem;
          border-radius: 999px;
          border: 1px solid rgba(251, 191, 36, 0.25);
          background:
            radial-gradient(circle, rgba(251, 191, 36, 0.3), transparent 56%),
            radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.28), transparent 44%);
          filter: blur(0.2px);
          animation: reward-aura 920ms ease-out forwards;
        }
        .reward-shard {
          position: absolute;
          width: 0.46rem;
          height: 0.46rem;
          border-radius: 999px;
          background: #fef3c7;
          box-shadow:
            0 0 14px rgba(251, 191, 36, 0.9),
            10px 6px 0 rgba(34, 211, 238, 0.72),
            -8px -4px 0 rgba(167, 139, 250, 0.72);
          opacity: 0;
          animation: reward-shard-pop 760ms ease-out forwards;
        }
        @keyframes reward-flash {
          0% { opacity: 0; transform: scale(.72); }
          25% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.34); }
        }
        @keyframes reward-aura {
          0% { opacity: 0; transform: scale(.45); }
          28% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.65); }
        }
        @keyframes reward-shard-pop {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(.35); }
          22% { opacity: 1; transform: translate3d(-10px, -14px, 0) scale(1); }
          100% { opacity: 0; transform: translate3d(-42px, -108px, 0) scale(.16); }
        }
        @keyframes reward-fly {
          0% {
            opacity: 0;
            transform: translate3d(0, 38px, 0) scale(0.72);
          }
          16% {
            opacity: 1;
            transform: translate3d(-16px, 0, 0) scale(1.08);
          }
          72% {
            opacity: 1;
            transform: translate3d(-56px, -58vh, 0) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translate3d(-72px, -64vh, 0) scale(0.42);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reward-fly-chip,
          .reward-pill {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </nav>
  )
}
