'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import LearningGameShowcase from '@/components/games/LearningGameShowcase'

export default function GamesPage() {
  const { t, locale } = useLanguage()
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/games')
        if (res.ok) {
          const data = await res.json()
          setGames(data)
        }
      } catch (error) {
        console.error('Failed to fetch games:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGames()
  }, [])

  const parseGameConfig = (game: any) => {
    try {
      return typeof game.gameConfig === 'string' ? JSON.parse(game.gameConfig) : game.gameConfig || {}
    } catch {
      return {}
    }
  }

  // 映射数据库中的原始标题到翻译词条
  const getGameTranslation = (game: any) => {
    const config = parseGameConfig(game)
    if (config.collection === 'larry-originals') {
      return {
        title: locale === 'zh' ? config.titleZh || game.title : config.titleEn || game.title,
        desc: locale === 'zh' ? config.descriptionZh || game.description : config.descriptionEn || game.description,
      }
    }

    const title = game.title;
    if (title.includes('乘法表')) return { title: t('game.multiplication.title'), desc: t('game.multiplication.desc') };
    if (title.includes('加法速算')) return { title: t('game.addition.title'), desc: t('game.addition.desc') };
    if (title.includes('几何图形')) return { title: t('game.geometry.title'), desc: t('game.geometry.desc') };
    if (title.includes('泡泡')) return { title: t('game.even_bubble.title'), desc: t('game.even_bubble.desc') };
    if (title.includes('赛车')) return { title: t('game.math_race.title'), desc: t('game.math_race.desc') };
    if (title.includes('转盘')) return { title: t('game.spin_wheel.title'), desc: t('game.spin_wheel.desc') };
    if (title.includes('宝藏')) return { title: t('game.treasure.title'), desc: t('game.treasure.desc') };
    if (title.includes('宫殿')) return { title: t('game.palace.title'), desc: t('game.palace.desc') };
    if (title.includes('革命')) return { title: t('game.rescue.title'), desc: t('game.rescue.desc') };
    return { title: game.title, desc: game.description };
  }

  const getGameVisual = (game: any) => {
    const title = game.title || ''
    const config = parseGameConfig(game)
    if (config.collection === 'larry-originals') {
      if (game.id.includes('bubble')) return { icon: '🫧', bg: 'from-sky-400/35 via-cyan-500/20 to-slate-950/50', ring: 'shadow-cyan-400/30' }
      if (game.id.includes('race')) return { icon: '🏁', bg: 'from-orange-300/35 via-red-500/20 to-slate-950/50', ring: 'shadow-orange-400/30' }
      if (game.id.includes('spin')) return { icon: '🎡', bg: 'from-fuchsia-300/35 via-violet-600/20 to-slate-950/50', ring: 'shadow-fuchsia-400/30' }
      if (game.id.includes('treasure')) return { icon: '🗺️', bg: 'from-yellow-300/35 via-amber-600/20 to-slate-950/50', ring: 'shadow-amber-400/30' }
      if (game.id.includes('duel')) return { icon: '⚔️', bg: 'from-red-300/35 via-rose-700/20 to-slate-950/50', ring: 'shadow-red-400/30' }
      if (game.id.includes('rescue')) return { icon: '🧭', bg: 'from-emerald-300/35 via-lime-700/20 to-slate-950/50', ring: 'shadow-emerald-400/30' }
    }

    if (title.includes('泡泡')) return { icon: '🫧', bg: 'from-cyan-400/25 via-blue-500/15 to-slate-900/40', ring: 'shadow-cyan-500/20' }
    if (title.includes('赛车')) return { icon: '🏎', bg: 'from-amber-400/25 via-orange-600/15 to-slate-900/40', ring: 'shadow-amber-500/20' }
    if (title.includes('转盘')) return { icon: '🎡', bg: 'from-violet-400/25 via-indigo-600/15 to-slate-900/40', ring: 'shadow-violet-500/20' }
    if (title.includes('宝藏')) return { icon: '💎', bg: 'from-yellow-300/25 via-amber-600/15 to-slate-900/40', ring: 'shadow-yellow-500/20' }
    if (title.includes('宫殿')) return { icon: '⚔️', bg: 'from-rose-400/25 via-red-700/15 to-slate-900/40', ring: 'shadow-rose-500/20' }
    if (title.includes('革命')) return { icon: '🧭', bg: 'from-lime-400/25 via-emerald-700/15 to-slate-900/40', ring: 'shadow-lime-500/20' }
    if (game.gameType === 'multiplication') return { icon: '✖️', bg: 'from-blue-500/25 via-indigo-600/15 to-slate-900/40', ring: 'shadow-blue-500/20' }
    if (game.gameType === 'addition') return { icon: '➕', bg: 'from-emerald-500/25 via-teal-600/15 to-slate-900/40', ring: 'shadow-emerald-500/20' }
    if (game.gameType === 'geometry') return { icon: '📐', bg: 'from-purple-500/25 via-pink-600/15 to-slate-900/40', ring: 'shadow-purple-500/20' }
    return { icon: '🎯', bg: 'from-orange-500/25 via-red-600/15 to-slate-900/40', ring: 'shadow-orange-500/20' }
  }

  return (
    <div className="relative min-h-dvh w-full max-w-full bg-[#050505] text-white overflow-x-clip">
      {/* Background Ambient Wash */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(120deg,rgba(14,165,233,.14),rgba(168,85,247,.08),rgba(20,184,166,.12))]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 uppercase px-1">
            {t('games.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
            {t('games.subtitle')}
          </p>

          {/* AI Game Generator CTA */}
          <Link
            href="/games/create"
            className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-6 py-3.5 sm:px-10 sm:py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-2xl shadow-purple-600/20 overflow-hidden transition-all hover:scale-[1.02] sm:hover:scale-105 active:scale-95 w-full max-w-sm sm:w-auto sm:max-w-none mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="text-2xl">✨</span>
            {t('games.create')}
          </Link>
        </div>

        <div className="mb-16 sm:mb-20">
          <LearningGameShowcase />
        </div>

        <div className="mb-8 flex items-end justify-between gap-4 border-t border-white/10 pt-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
              {locale === 'zh' ? '现有游戏' : 'Current Games'}
            </p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {locale === 'zh' ? 'Larry Academy 游戏库' : 'Larry Academy Game Library'}
            </h2>
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-blue-400 animate-pulse text-xl">{t('common.loading')}</div>
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => {
              const translation = getGameTranslation(game);
              const visual = getGameVisual(game);
              return (
                <div
                  key={game.id}
                  className="group relative rounded-[32px] bg-white/[0.02] border border-white/[0.08] overflow-hidden hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500"
                >
                  {/* Game Icon / Thumbnail */}
                  <div
                    className={`aspect-video flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${visual.bg}`}
                  >
                    <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
                    <div className={`relative rounded-[2rem] bg-white/10 p-7 text-white text-5xl shadow-2xl ${visual.ring} sm:text-7xl md:text-8xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700`}>
                      {visual.icon}
                    </div>
                    
                    {parseGameConfig(game).collection === 'larry-originals' && (
                      <div className="absolute top-6 right-6 px-4 py-1 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest">
                        {locale === 'zh' ? 'Larry 原创' : 'Larry Original'}
                      </div>
                    )}
                    {game.featured && (
                      <div className="absolute top-6 left-6 px-4 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest">
                        {t('games.featured')}
                      </div>
                    )}
                    {game.isAiGenerated && (
                      <div className="absolute top-6 right-6 px-4 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest">
                        {t('games.ai_generated')}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                      {translation.title}
                    </h3>
                    <p className="text-gray-500 font-light leading-relaxed mb-8 line-clamp-2">
                      {translation.desc}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 text-xs font-medium text-gray-600 uppercase tracking-widest">
                        <span>{game.playCount} {t('games.plays')}</span>
                        <span>{game.viewCount || 0} {locale === 'zh' ? '访问' : 'views'}</span>
                      </div>
                      <Link
                        href={`/games/${game.id}`}
                        className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all active:scale-95"
                      >
                        {t('games.play')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-24 lg:py-32 px-4 bg-white/[0.02] rounded-2xl sm:rounded-[40px] border border-dashed border-white/10">
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 opacity-20">🎮</div>
            <h3 className="text-2xl font-bold text-gray-400">{t('common.no_content')}</h3>
            <p className="text-gray-600 mt-2">New challenges are being developed.</p>
          </div>
        )}
      </div>
    </div>
  )
}
