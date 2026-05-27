'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

const grades = [
  { id: 'G1', title: 'Grade 1', chineseTitle: '一年级', icon: '🌱', color: 'from-green-400 to-emerald-500' },
  { id: 'G2', title: 'Grade 2', chineseTitle: '二年级', icon: '🌿', color: 'from-emerald-400 to-teal-500' },
  { id: 'G3', title: 'Grade 3', chineseTitle: '三年级', icon: '🌳', color: 'from-teal-400 to-cyan-500' },
  { id: 'G4', title: 'Grade 4', chineseTitle: '四年级', icon: '🌲', color: 'from-cyan-400 to-blue-500' },
  { id: 'G5', title: 'Grade 5', chineseTitle: '五年级', icon: '🏔️', color: 'from-blue-400 to-indigo-500' },
]

export default function MathGradesPage() {
  const { locale, t } = useLanguage()
  const searchParams = useSearchParams()
  const grade = searchParams.get('grade')
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/subjects/math${grade ? `?grade=${grade}` : ''}`)
        if (res.ok) {
          const data = await res.json()
          setLessons(data)
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
  }, [grade])

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Math Theme Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Breadcrumb */}
        <nav className="mb-6 sm:mb-8 flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500">
          <Link href="/subjects" className="hover:text-blue-400 transition-colors">Subjects</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Math</span>
        </nav>

        {/* Header */}
        <div className="mb-10 sm:mb-16">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            {t('math.title')}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed">
            {t('math.subtitle')}
          </p>
        </div>

        {/* Grade Navigation - 第一层入口 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          <Link
            href="/subjects/math"
            className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all duration-500 group ${
              !grade 
                ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-600/40 scale-105 z-10' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📚</span>
            <span className="font-bold tracking-tight">{t('math.all_grades')}</span>
          </Link>
          {grades.map((g) => (
            <Link
              key={g.id}
              href={`/subjects/math?grade=${g.id}`}
              className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all duration-500 group ${
                grade === g.id
                  ? `bg-gradient-to-br ${g.color} border-transparent text-white shadow-2xl shadow-blue-600/40 scale-105 z-10`
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{g.icon}</span>
              <span className="font-bold tracking-tight">{locale === 'zh' ? g.chineseTitle : g.title}</span>
            </Link>
          ))}
        </div>

        {/* Content Section */}
        <div className="space-y-16">
          {loading ? (
            <div className="text-center py-20">
              <div className="text-blue-400 animate-pulse text-xl">{t('common.loading')}</div>
            </div>
          ) : lessons.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                {grade ? `${grade} ${t('math.lessons')}` : t('math.all_grades')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/courses/${lesson.courseId}/learn?lessonId=${lesson.id}`}
                    className="group p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl group-hover:bg-blue-500/20 transition-colors">
                        🎬
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase">
                            {lesson.gradeLevel}
                          </span>
                          {lesson.difficulty && (
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => {
                                const starValue = lesson.difficulty === 'Easy' ? 1 : lesson.difficulty === 'Medium' ? 3 : 5;
                                return (
                                  <span key={i} className={`text-[10px] ${i < starValue ? 'text-yellow-400' : 'text-gray-600'}`}>
                                    ★
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <span className="text-[10px] text-gray-500 truncate">
                            {t('math.from')}: {lesson.course.title}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <span>⏱️ {lesson.duration ? Math.round(lesson.duration / 60) : '10'} mins</span>
                          <span className="mx-1">•</span>
                          <span className="text-blue-400 group-hover:underline">{t('math.watch')}</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-300">{t('common.no_content')}</h3>
              <p className="text-gray-500 mt-2">We are currently developing the curriculum for this grade.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
