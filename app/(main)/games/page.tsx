'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import LearningGameShowcase, { showcaseGames, type TemplateId } from '@/components/games/LearningGameShowcase'

export default function GamesPage() {
  const { t, locale } = useLanguage()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('starship')

  const playTemplate = (id: TemplateId) => {
    setSelectedTemplate(id)
    window.setTimeout(() => {
      document.getElementById('learning-game-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
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

        <div id="learning-game-showcase" className="mb-16 scroll-mt-24 sm:mb-20">
          <LearningGameShowcase selectedId={selectedTemplate} onActiveChange={setSelectedTemplate} />
        </div>

        <div className="mb-8 flex items-end justify-between gap-4 border-t border-white/10 pt-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
              {locale === 'zh' ? '原创互动模板' : 'Original Interactive Templates'}
            </p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {locale === 'zh' ? '12 个 Larry Academy 可复用学习游戏' : '12 Reusable Larry Academy Learning Games'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showcaseGames.map((game) => {
            const selected = game.id === selectedTemplate
            return (
              <button
                key={game.id}
                onClick={() => playTemplate(game.id)}
                className={`group relative overflow-hidden rounded-[28px] border p-0 text-left transition-all duration-500 ${
                  selected ? 'border-white/45 bg-white/[0.08] shadow-2xl shadow-white/10' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/24 hover:bg-white/[0.05]'
                }`}
              >
                <div className={`relative aspect-video bg-gradient-to-br ${game.wash} p-5`}>
                  <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:30px_30px]" />
                  <div className="relative flex h-full items-center justify-center">
                    <div className="relative h-24 w-36">
                      <div className="absolute left-2 top-9 h-8 w-16 rounded-full bg-white shadow-2xl transition group-hover:translate-x-3" />
                      <div className="absolute right-2 top-4 flex size-20 items-center justify-center rounded-full text-2xl font-black text-black shadow-2xl transition group-hover:scale-110" style={{ backgroundColor: game.accent }}>
                        {game.id === 'geometry' ? 'A' : game.id === 'fraction' ? '1/2' : game.id === 'circuit' ? 'V' : game.id === 'molecule' ? 'O' : game.id === 'snake' ? '×' : game.id === 'maze' ? 'F' : game.id === 'tetra' ? '+' : '50'}
                      </div>
                      <div className="absolute bottom-3 left-20 h-2 w-20 rounded-full" style={{ backgroundColor: game.accent }} />
                    </div>
                  </div>
                  <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    {game.subject}
                  </div>
                  {selected && (
                    <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                      {locale === 'zh' ? '当前' : 'Active'}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-black text-white transition group-hover:text-white">
                    {locale === 'zh' ? game.titleZh : game.titleEn}
                  </h3>
                  <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-white/52">
                    {locale === 'zh' ? game.verbZh : game.verbEn}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: game.accent }}>
                      {locale === 'zh' ? '玩中学' : 'Learn by playing'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white">
                      {locale === 'zh' ? '进入游戏' : 'Play'}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
