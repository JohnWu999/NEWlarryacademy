'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function Navbar() {
  const { data: session } = useSession()
  const { locale, setLocale, t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [rewards, setRewards] = useState({ points: 0, gems: 0 })
  const [rewardBurst, setRewardBurst] = useState<{ points: number; gems: number; key: number } | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!session) {
      setRewards({ points: 0, gems: 0 })
      return
    }

    let active = true
    fetch('/api/user/stats')
      .then((response) => response.ok ? response.json() : null)
      .then((stats) => {
        if (active && stats) {
          setRewards({ points: Number(stats.points || 0), gems: Number(stats.gems || 0) })
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
        const sequence = gems > 0 ? [659, 880, 1175, 1568] : [523, 784, 1046]
        sequence.forEach((frequency, index) => {
          const oscillator = ctx.createOscillator()
          const gain = ctx.createGain()
          const start = ctx.currentTime + index * 0.07
          oscillator.type = gems > 0 ? 'triangle' : 'sine'
          oscillator.frequency.setValueAtTime(frequency + Math.min(points, 80), start)
          gain.gain.setValueAtTime(0.0001, start)
          gain.gain.exponentialRampToValueAtTime(gems > 0 ? 0.11 : 0.08, start + 0.025)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
          oscillator.connect(gain)
          gain.connect(ctx.destination)
          oscillator.start(start)
          oscillator.stop(start + 0.2)
        })
      } catch {}
    }

    const handleReward = (event: Event) => {
      const detail = (event as CustomEvent<{ points?: number; gems?: number }>).detail || {}
      const points = Math.max(0, Number(detail.points || 0))
      const gems = Math.max(0, Number(detail.gems || 0))
      if (!points && !gems) return

      setRewards((current) => ({
        points: current.points + points,
        gems: current.gems + gems,
      }))
      setRewardBurst({ points, gems, key: Date.now() })
      playRewardTone(points, gems)
      window.setTimeout(() => setRewardBurst(null), 1400)
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
                onClick={() => setLocale('zh')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  locale === 'zh' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                中
              </button>
              <button
                onClick={() => setLocale('en')}
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
                  <Link href="/profile" className="reward-pill reward-pill-gem" aria-label={`${rewards.gems} gems`}>
                    <img src="/reward-icons/gem.png" alt="" className="reward-icon" />
                    <span className="reward-count">{rewards.gems}</span>
                  </Link>
                  <Link href="/profile" className="reward-pill reward-pill-points" aria-label={`${rewards.points} points`}>
                    <img src="/reward-icons/spark.png" alt="" className="reward-icon" />
                    <span className="reward-count">{rewards.points}</span>
                  </Link>
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
                    <div className="reward-pill reward-pill-gem justify-center">
                      <img src="/reward-icons/gem.png" alt="" className="reward-icon" />
                      <span className="reward-count">{rewards.gems}</span>
                    </div>
                    <div className="reward-pill reward-pill-points justify-center">
                      <img src="/reward-icons/spark.png" alt="" className="reward-icon" />
                      <span className="reward-count">{rewards.points}</span>
                    </div>
                  </div>
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
          gap: 0.62rem;
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
          width: 1.72rem;
          height: 1.72rem;
          flex: 0 0 auto;
          object-fit: contain;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.16));
        }
        .reward-icon-fly {
          width: 2rem;
          height: 2rem;
        }
        .reward-count {
          min-width: 1.65rem;
          text-align: left;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 1px 10px rgba(0,0,0,0.35);
        }
        .reward-fly-chip {
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
        .reward-fly-gem {
          background: rgba(10, 136, 132, 0.92);
        }
        .reward-fly-points {
          background: rgba(180, 83, 9, 0.92);
          animation-delay: 90ms;
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
