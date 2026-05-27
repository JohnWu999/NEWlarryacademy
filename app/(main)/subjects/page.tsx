'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

const subjects = [
  {
    id: 'math',
    title: 'Larry Math',
    chineseTitle: 'Larry 数学',
    description: {
      en: 'Larry video lessons with mini games and practice for confident math thinking.',
      zh: 'Larry 讲课、小游戏和 Practice 练习组成的数学主课程。'
    },
    icon: '📐',
    color: 'from-blue-500 to-cyan-400',
    path: '/courses?category=math'
  },
  {
    id: 'ib-big-math',
    title: 'IB Big Math',
    chineseTitle: 'IB 大数学',
    description: {
      en: 'A coming course track with video, interactive questions, and lesson games.',
      zh: '即将发布的视频课程，每节课配互动答题和小游戏。'
    },
    icon: '🌐',
    color: 'from-purple-500 to-pink-400',
    path: '/courses?category=ib-big-math'
  },
  {
    id: 'ngss-science',
    title: 'NGSS Science',
    chineseTitle: 'NGSS 科学',
    description: {
      en: 'NGSS-aligned science lessons with inquiry, practice, and simulations.',
      zh: '围绕 NGSS 标准设计的科学探究、互动练习和模拟小游戏。'
    },
    icon: '🧪',
    color: 'from-emerald-500 to-teal-400',
    path: '/courses?category=ngss-science'
  },
  {
    id: 'ai-coding',
    title: 'AI Coding',
    chineseTitle: 'AI 编程',
    description: {
      en: 'Master the future of technology with AI-assisted programming and logic.',
      zh: '预留课程方向：AI 辅助编程、逻辑和项目实践。'
    },
    icon: '🤖',
    color: 'from-indigo-600 to-blue-500',
    path: '/courses?category=AI'
  },
  {
    id: 'stem',
    title: 'STEM',
    chineseTitle: 'STEM',
    description: {
      en: 'Integrated learning in Science, Technology, Engineering, and Mathematics.',
      zh: '预留课程方向：科学、技术、工程和数学的综合项目。'
    },
    icon: '🚀',
    color: 'from-emerald-500 to-teal-400',
    path: '/courses?category=STEM'
  }
]

export default function SubjectsPage() {
  const { locale, t } = useLanguage()

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-clip bg-[#0a0a0c] text-white selection:bg-blue-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="mb-12 sm:mb-16 lg:mb-20 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tighter uppercase px-1">
            {t('subjects.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed px-2">
            {t('subjects.subtitle')}
          </p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={subject.path}
              className="group relative"
            >
              {/* Card Container */}
              <div className="relative h-full p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-white/20 sm:group-hover:-translate-y-2">
                {/* Subject Icon */}
                <div className={`w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-3xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  {subject.icon}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                      {locale === 'zh' ? subject.chineseTitle : subject.title}
                    </h2>
                    <span className="text-sm font-medium text-gray-500">
                      {locale === 'zh' ? subject.title : subject.chineseTitle}
                    </span>
                  </div>
                  <p className="text-gray-400 font-light leading-relaxed">
                    {subject.description[locale]}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-8 flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {t('common.explore')}
                  <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${subject.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
