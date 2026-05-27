'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

interface UserStats {
  coursesEnrolled: number
  coursesCompleted: number
  gamesPlayed: number
  totalLearningTime: number
  points: number
  gems: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    gamesPlayed: 0,
    totalLearningTime: 0,
    points: 0,
    gems: 0,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    if (session) {
      fetchStats()
    }
  }, [session])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-dvh w-full bg-[#050505] flex items-center justify-center">
        <div className="text-blue-400 animate-pulse text-xl font-light tracking-widest uppercase">{t('common.loading')}</div>
      </div>
    )
  }

  if (!session) return null

  const quickLinks = [
    { title: t('nav.courses'), desc: t('locale') === 'zh' ? '查看和继续学习您的课程' : 'View and continue your courses', href: '/subjects/math', icon: '📚', color: 'from-blue-500/20 to-cyan-500/20' },
    { title: t('nav.games'), desc: t('locale') === 'zh' ? '查看您的游戏历史和成绩' : 'View your game history and scores', href: '/games', icon: '🎮', color: 'from-purple-500/20 to-pink-500/20' },
    { title: t('nav.shop'), desc: t('locale') === 'zh' ? '购买 3D 工具和学习材料' : 'Buy 3D tools and learning materials', href: '/shop', icon: '🛍️', color: 'from-indigo-500/20 to-blue-500/20' },
    { title: t('locale') === 'zh' ? '订单历史' : 'Order History', desc: t('locale') === 'zh' ? '查看您的购买记录' : 'View your purchase history', href: '/profile/orders', icon: '📦', color: 'from-emerald-500/20 to-teal-500/20' },
  ]

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
        {/* Profile Header */}
        <div className="relative p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[40px] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl mb-8 sm:mb-12 overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl font-black shadow-2xl shadow-blue-500/40 border-4 border-white/10 group-hover:scale-105 transition-transform duration-500">
              {session.user.name?.[0] || 'U'}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight break-words">
                {session.user.name || (t('locale') === 'zh' ? '用户' : 'User')}
              </h1>
              <p className="text-gray-500 font-light mb-6">{session.user.email}</p>
              <button
                onClick={handleSignOut}
                className="px-8 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold border border-red-500/20 transition-all active:scale-95"
              >
                {t('profile.logout')}
              </button>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="text-9xl font-black uppercase tracking-tighter">{t('profile.title')}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {[
            { label: t('profile.stats.enrolled'), value: stats.coursesEnrolled, color: 'text-blue-400' },
            { label: t('profile.stats.completed'), value: stats.coursesCompleted, color: 'text-emerald-400' },
            { label: t('profile.stats.games'), value: stats.gamesPlayed, color: 'text-purple-400' },
            { label: t('profile.stats.time'), value: stats.totalLearningTime, color: 'text-orange-400' },
            { label: t('locale') === 'zh' ? '积分' : 'Points', value: stats.points, color: 'text-cyan-400' },
            { label: t('locale') === 'zh' ? '宝石' : 'Gems', value: stats.gems, color: 'text-pink-400' },
          ].map((item, i) => (
            <div key={i} className="p-3 sm:p-5 lg:p-6 rounded-xl sm:rounded-[32px] bg-white/[0.02] border border-white/[0.05] text-center min-w-0">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-600 mb-1 sm:mb-2 truncate">{item.label}</div>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-indigo-500 rounded-full"></span>
            {t('profile.quick')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="group p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500"
              >
                <div className="flex items-start gap-3 sm:gap-6 min-w-0">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500`}>
                    {link.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{link.title}</h3>
                    <p className="text-gray-500 font-light text-sm leading-relaxed">{link.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
