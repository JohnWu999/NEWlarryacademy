'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function CreateGamePage() {
  const { data: session, status } = useSession()
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [userInput, setUserInput] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [ageGroup, setAgeGroup] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/games/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          difficulty,
          ageGroup: ageGroup || undefined,
          saveToDatabase: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (data.game?.id) {
          router.push(`/games/${data.game.id}`)
        }
      } else {
        setError(data.error || (locale === 'zh' ? '生成游戏失败' : 'Failed to generate game'))
      }
    } catch (error) {
      setError(locale === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later')
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    { zh: '创建一个练习加法的游戏，数字范围在1-50之间，有10道题，时间限制2分钟', en: 'Create an addition game with numbers 1-50, 10 questions, and a 2-minute time limit.' },
    { zh: '我想要一个识别几何图形的游戏，包括三角形、正方形、圆形和五边形', en: 'I want a geometry game to identify triangles, squares, circles, and pentagons.' },
    { zh: '制作一个分数比较游戏，帮助学生理解哪个分数更大', en: 'Make a fraction comparison game to help students understand which fraction is larger.' }
  ]

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 uppercase px-1">
            {t('games.create.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto px-2">
            {t('games.create.subtitle')}
          </p>
        </div>

        {/* Form Container */}
        <div className="relative rounded-2xl sm:rounded-[40px] bg-white/[0.02] border border-white/[0.08] p-5 sm:p-8 lg:p-10 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            {/* User Input */}
            <div>
              <label className="block text-xl font-bold text-white mb-4">
                {t('games.create.label.desc')}
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                required
                rows={5}
                placeholder={t('games.create.placeholder.desc')}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none font-light"
              />
              <p className="mt-3 text-sm text-gray-500 font-light italic">
                {t('games.create.hint.desc')}
              </p>
            </div>

            {/* Difficulty & Age Group Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Difficulty */}
              <div>
                <label className="block text-xl font-bold text-white mb-4">
                  {t('games.create.label.difficulty')}
                </label>
                <div className="flex gap-3">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level as any)}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${
                        difficulty === level
                          ? 'border-purple-600 bg-purple-600/20 text-white shadow-lg shadow-purple-600/20'
                          : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300'
                      }`}
                    >
                      {t(`common.${level}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-xl font-bold text-white mb-4">
                  {t('games.create.label.age')}
                </label>
                <input
                  type="text"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  placeholder={t('games.create.placeholder.age')}
                  className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all font-light"
                />
              </div>
            </div>

            {/* Examples */}
            <div className="p-8 rounded-3xl bg-purple-600/5 border border-purple-500/10">
              <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                {t('games.create.examples')}
              </h3>
              <div className="space-y-3">
                {examples.map((ex, i) => (
                  <div
                    key={i}
                    onClick={() => setUserInput(locale === 'zh' ? ex.zh : ex.en)}
                    className="text-sm text-gray-500 hover:text-purple-300 cursor-pointer transition-colors font-light leading-relaxed border-b border-white/5 pb-2 last:border-0"
                  >
                    • "{locale === 'zh' ? ex.zh : ex.en}"
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !userInput}
              className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-2xl text-xl font-black shadow-2xl shadow-purple-600/20 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? t('games.create.loading') : t('games.create.submit')}
            </button>
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center text-gray-600 font-light italic">
          <p>
            🤖 {locale === 'zh' ? '使用先进的 AI 技术，根据您的描述生成独特的学习游戏' : 'Using advanced AI technology to generate unique learning games based on your description.'}
          </p>
        </div>
      </div>
    </div>
  )
}
