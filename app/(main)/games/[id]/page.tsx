'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { t, locale } = useLanguage()
  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/games/${resolvedParams.id}`)
        if (res.ok) {
          const data = await res.json()
          setGame(data)
        } else {
          setError(locale === 'zh' ? '游戏不存在或加载失败' : 'Game not found or failed to load')
        }
      } catch (error) {
        console.error('Failed to fetch game:', error)
        setError(locale === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later')
      } finally {
        setLoading(false)
      }
    }
    fetchGame()
  }, [resolvedParams.id, locale])

  if (loading) {
    return (
      <div className="min-h-dvh w-full bg-[#050505] flex items-center justify-center">
        <div className="text-blue-400 animate-pulse text-xl font-light tracking-widest uppercase">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-dvh w-full bg-[#050505] flex flex-col items-center justify-center text-white p-4 sm:p-6">
        <div className="text-6xl mb-6 opacity-20">🔍</div>
        <h2 className="text-2xl font-bold mb-4">{error || (locale === 'zh' ? '游戏不存在' : 'Game not found')}</h2>
        <Link
          href="/games"
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
        >
          {t('common.back_to_games')}
        </Link>
      </div>
    )
  }

  const gameConfig = typeof game.gameConfig === 'string' ? JSON.parse(game.gameConfig) : game.gameConfig as any

  // 映射数据库中的原始标题到翻译词条
  const getGameTranslation = (game: any) => {
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

  const translation = getGameTranslation(game)

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
        {/* Back Button */}
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-12 transition-all group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back_to_games')}
        </Link>

        {/* Game Header Card */}
        <div className="relative rounded-[40px] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl overflow-hidden mb-12">
          <div
            className={`h-64 flex items-center justify-center relative ${
              game.gameType === 'multiplication'
                ? 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20'
                : game.gameType === 'addition'
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20'
                : game.gameType === 'geometry'
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-600/20'
                : 'bg-gradient-to-br from-orange-500/20 to-red-600/20'
            }`}
          >
            <div className="text-white text-9xl drop-shadow-2xl">
              {game.gameType === 'multiplication' ? '✖️' : game.gameType === 'addition' ? '➕' : game.gameType === 'geometry' ? '📐' : '🎯'}
            </div>
          </div>

          <div className="p-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {game.featured && (
                <span className="px-4 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest">
                  {t('games.featured')}
                </span>
              )}
              {game.isAiGenerated && (
                <span className="px-4 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest">
                  {t('games.ai_generated')}
                </span>
              )}
              {gameConfig.difficulty && (
                <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  {t(`common.${gameConfig.difficulty}`)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 tracking-tight text-white break-words">
              {translation.title}
            </h1>

            <p className="text-xl text-gray-400 font-light leading-relaxed mb-10">
              {translation.desc}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">{t('games.plays')}</div>
                <div className="text-xl font-black text-white">{game.playCount}</div>
              </div>
              {gameConfig.questionCount && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">{t('common.questions')}</div>
                  <div className="text-xl font-black text-white">{gameConfig.questionCount}</div>
                </div>
              )}
              {gameConfig.timeLimit && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">{t('common.seconds')}</div>
                  <div className="text-xl font-black text-white">{gameConfig.timeLimit}s</div>
                </div>
              )}
              {game.creator && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">{t('common.creator')}</div>
                  <div className="text-xl font-black text-white truncate px-2">{game.creator.name}</div>
                </div>
              )}
            </div>

            {gameConfig.playUrl ? (
              <a
                href={gameConfig.playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-2xl text-xl font-black shadow-2xl shadow-purple-600/20 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {t('common.start_game')} 🎮 ({t('common.new_window')})
              </a>
            ) : (
              <button className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-2xl text-xl font-black shadow-2xl shadow-purple-600/20 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {t('common.start_game')} 🎮
              </button>
            )}
          </div>
        </div>

        {/* Instructions Card */}
        <div className="rounded-[40px] bg-white/[0.02] border border-white/[0.08] p-10 mb-12 backdrop-blur-3xl">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-purple-500 rounded-full"></span>
            {t('common.instructions')}
          </h2>
          <div className="space-y-4 text-gray-400 text-lg font-light leading-relaxed">
            {gameConfig.playUrl ? (
              <>
                <p>• {locale === 'zh' ? '点击上方「开始游戏」在新窗口中打开原版游戏' : 'Click "Start Game" above to open the original game in a new window.'}</p>
                <p>• {locale === 'zh' ? '游戏结束后可关闭窗口返回本站' : 'After finishing, close the window to return to the academy.'}</p>
              </>
            ) : (
              <>
                <p>• {locale === 'zh' ? `本游戏包含 ${gameConfig.questionCount || 10} 道题目` : `This game contains ${gameConfig.questionCount || 10} questions.`}</p>
                {gameConfig.timeLimit && (
                  <p>• {locale === 'zh' ? `每道题有 ${gameConfig.timeLimit} 秒的时间限制` : `Each question has a ${gameConfig.timeLimit} second time limit.`}</p>
                )}
                <p>• {locale === 'zh' ? '选择正确答案即可得分' : 'Select the correct answer to earn points.'}</p>
                <p>• {locale === 'zh' ? '完成所有题目后可查看成绩和排名' : 'Complete all questions to see your score and ranking.'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
