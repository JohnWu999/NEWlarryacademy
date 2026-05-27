'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="relative min-h-dvh w-full max-w-full bg-[#050505] overflow-x-clip">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-24 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-24 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto w-full text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Future of Learning</span>
          </div>
          
          <h1 className="text-[clamp(1.75rem,6vw+0.5rem,5.5rem)] sm:text-5xl md:text-7xl lg:text-8xl font-black mb-5 sm:mb-8 tracking-tighter leading-[1.05] sm:leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 uppercase">
            {t('home.hero.title')} <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              LARRY ACADEMY
            </span>
          </h1>
          
          <p className="text-gray-400 text-base sm:text-lg md:text-2xl max-w-3xl mx-auto font-light leading-relaxed mb-8 sm:mb-12 px-1 sm:px-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-stretch sm:items-center w-full max-w-md sm:max-w-none mx-auto sm:mx-0 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Link
              href="/subjects"
              className="group relative px-6 py-3.5 sm:px-10 sm:py-5 bg-blue-600 text-white rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold text-center shadow-2xl shadow-blue-600/20 overflow-hidden transition-all hover:scale-[1.02] sm:hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {t('home.hero.start')}
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3.5 sm:px-10 sm:py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold text-center backdrop-blur-xl transition-all hover:scale-[1.02] sm:hover:scale-105 active:scale-95"
            >
              {t('home.hero.shop')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-14 sm:py-20 lg:py-28 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">
                📹
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{t('home.features.courses.title')}</h3>
              <p className="text-gray-400 font-light leading-relaxed mb-8">
                {t('home.features.courses.desc')}
              </p>
              <Link href="/subjects" className="text-blue-400 font-bold flex items-center group-hover:underline">
                {t('common.explore')}
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">
                🎲
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{t('home.features.tools.title')}</h3>
              <p className="text-gray-400 font-light leading-relaxed mb-8">
                {t('home.features.tools.desc')}
              </p>
              <Link href="/tools" className="text-purple-400 font-bold flex items-center group-hover:underline">
                {t('common.explore')}
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">
                🎮
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{t('home.features.games.title')}</h3>
              <p className="text-gray-400 font-light leading-relaxed mb-8">
                {t('home.features.games.desc')}
              </p>
              <Link href="/games" className="text-indigo-400 font-bold flex items-center group-hover:underline">
                {t('home.features.games.title')}
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto w-full rounded-2xl sm:rounded-[2rem] lg:rounded-[40px] bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-white/10 p-6 sm:p-10 lg:p-12 text-center backdrop-blur-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">❤️</div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-3 sm:mb-4">{t('home.charity.title')}</h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
              {t('home.charity.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-14 sm:py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 lg:gap-12 text-center">
            <div>
              <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-1 sm:mb-2 tracking-tighter">5000+</div>
              <div className="text-blue-400 font-bold tracking-widest uppercase text-xs">{t('home.stats.users')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-1 sm:mb-2 tracking-tighter">200+</div>
              <div className="text-purple-400 font-bold tracking-widest uppercase text-xs">{t('home.stats.courses')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-1 sm:mb-2 tracking-tighter">50+</div>
              <div className="text-indigo-400 font-bold tracking-widest uppercase text-xs">{t('home.stats.tools')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-1 sm:mb-2 tracking-tighter">30+</div>
              <div className="text-pink-400 font-bold tracking-widest uppercase text-xs">{t('home.stats.games')}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
