'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function AboutPage() {
  const { t, locale } = useLanguage()
  
  const offers = [
    { icon: '📹', title: t('home.features.courses.title'), desc: t('home.features.courses.desc'), color: 'from-blue-500/20 to-cyan-500/20' },
    { icon: '🎲', title: t('home.features.tools.title'), desc: t('home.features.tools.desc'), color: 'from-purple-500/20 to-pink-500/20' },
    { icon: '🎮', title: t('home.features.games.title'), desc: t('home.features.games.desc'), color: 'from-indigo-500/20 to-blue-500/20' },
    { icon: '✨', title: locale === 'zh' ? 'AI 个性化生成' : 'AI Personalization', desc: locale === 'zh' ? '使用人工智能技术，根据学生的需求生成定制化学习游戏。' : 'Using AI to generate customized learning games based on student needs.', color: 'from-emerald-500/20 to-teal-500/20' },
  ]

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-24">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 px-1">
            {t('about.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed px-2">
            {t('home.hero.subtitle')}
          </p>
        </div>

        {/* Larry Story Section */}
        <div className="relative mb-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-3xl transition-all duration-500 hover:bg-white/[0.04] sm:mb-16 sm:rounded-[40px] sm:p-8 lg:mb-24 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_34%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                {t('about.mission.kicker')}
              </p>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
                {t('about.mission')}
              </h2>
              <div className="mt-6 space-y-4 text-base font-light leading-8 text-gray-300 sm:text-lg">
                <p>{t('about.mission.p1')}</p>
                <p>{t('about.mission.p2')}</p>
                <p>{t('about.mission.p3')}</p>
                <p>{t('about.mission.p4')}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr] lg:grid-cols-1">
              <figure className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                <img
                  src="/about/larry-book.jpg"
                  alt={locale === 'zh' ? 'Larry 手捧《七岁行欧洲》' : 'Larry holding Walking in Ages'}
                  className="aspect-[1.28] w-full object-cover"
                />
                <figcaption className="border-t border-white/10 p-4">
                  <p className="text-lg font-black text-white">{t('about.book.title')}</p>
                  <p className="mt-1 text-sm font-bold text-blue-200">{t('about.book.subtitle')}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-400">{t('about.book.desc')}</p>
                </figcaption>
              </figure>

              <figure className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                <img
                  src="/about/larry-cafe.jpg"
                  alt={locale === 'zh' ? 'Larry 在欧洲旅途中写作' : 'Larry writing during his Europe journey'}
                  className="aspect-[1.28] w-full object-cover object-[50%_68%] sm:aspect-auto sm:h-full lg:aspect-[1.28] lg:h-auto"
                />
              </figure>
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="mb-12 sm:mb-16 lg:mb-24">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 sm:mb-12 text-center">{t('about.offer.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {offers.map((offer, index) => (
              <div key={index} className="p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-white/20 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${offer.color} flex items-center justify-center text-3xl mb-6`}>
                  {offer.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{offer.title}</h3>
                <p className="text-gray-500 font-light leading-relaxed">{offer.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charity Section */}
        <div id="charity" className="relative p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[40px] bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-pink-500/20 backdrop-blur-3xl mb-12 sm:mb-16 lg:mb-24 text-center">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-8">💝</div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-4 sm:mb-6">{t('about.charity.title')}</h2>
          <div className="space-y-4 sm:space-y-6 text-gray-300 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
            <p>{t('home.charity.desc')}</p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[40px] bg-white/[0.02] border border-white/[0.08] text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 sm:mb-12">{t('about.contact.title')}</h2>
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">📧</div>
              <a href="mailto:wularry999@gmail.com" className="text-gray-400 font-light transition-colors hover:text-blue-400">
                wularry999@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
