'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getVideoEmbedUrl, getVideoSourceLabel } from '@/lib/video'

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  videoProvider?: string | null
  youtubeVideoId?: string | null
  tencentVodFileId?: string | null
  order: number
  duration: number | null
  isPreview?: boolean
  hasPractice?: boolean
  hasGame?: boolean
  rewardsPoints?: number
  rewardsGems?: number
  viewCount?: number
  gradeLevel?: string | null
  difficulty?: string | null
  activities?: Array<{
    id: string
    type: string
    title: string
    description: string | null
    rewardsPoints: number
    rewardsGems: number
  }>
}

interface Course {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  hasAccess: boolean
  accessReason?: string
  progress: {
    progressPercentage: number
    lastWatchedPosition: number
  } | null
}

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonIdFromQuery = searchParams.get('lessonId')

  const [course, setCourse] = useState<Course | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const progressUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      if (lessonIdFromQuery) {
        fetchLessonDirectly(lessonIdFromQuery)
      } else {
        fetchCourse(resolvedParams.id)
      }
    }
  }, [status, resolvedParams.id, lessonIdFromQuery])

  const fetchLessonDirectly = async (lid: string) => {
    try {
      const response = await fetch(`/api/lessons/${lid}`)
      if (response.ok) {
        const data = await response.json()
        const courseData = data.course
        setCourse({
          ...courseData,
          hasAccess: data.hasAccess,
          progress: data.progress
        })

        // 找到当前课节在课程中的索引
        const index = courseData.lessons.findIndex((l: Lesson) => l.id === lid)
        if (index !== -1) {
          setCurrentLessonIndex(index)
        }

        if (data.progress && data.progress.progressPercentage > 0) {
          setVideoProgress(data.progress.lastWatchedPosition)
        }
      } else {
        router.push('/subjects/math')
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourse = async (cid: string) => {
    try {
      const response = await fetch(`/api/courses/${cid}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)

        if (!data.hasAccess) {
          router.push(`/courses/${cid}`)
          return
        }

        if (data.progress && data.progress.progressPercentage > 0) {
          setVideoProgress(data.progress.lastWatchedPosition)
        }
      } else {
        router.push('/courses')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (position: number, percentage: number) => {
    if (!course) return
    try {
      await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastWatchedPosition: position,
          progressPercentage: percentage,
        }),
      })
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-blue-400 animate-pulse text-xl">Loading futuristic classroom...</div>
      </div>
    )
  }

  if (!course || !course.lessons.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Content not found</div>
      </div>
    )
  }

  const currentLessonData = course.lessons[currentLessonIndex]

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Video Player Section */}
      <div className="w-full bg-black aspect-video lg:max-h-[70vh] relative shadow-2xl shadow-blue-500/10">
        {(() => {
          const embedUrl = getVideoEmbedUrl(currentLessonData)
          if (embedUrl) {
            return (
              <iframe
                className="w-full h-full"
                src={`${embedUrl}&autoplay=1`}
                title={currentLessonData.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          }

          if (currentLessonData?.videoUrl) {
            return (
              <div className="w-full h-full flex items-center justify-center">
                <a href={currentLessonData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Open Video in New Window</a>
              </div>
            )
          }

          return (
            <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">🎬</div>
              <p className="text-gray-500">{getVideoSourceLabel(currentLessonData)}</p>
            </div>
          </div>
          )
        })()}
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase">
                  {currentLessonData?.gradeLevel || 'Lesson'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {getVideoSourceLabel(currentLessonData)}
                </span>
                {currentLessonData?.difficulty && (
                  <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {[...Array(5)].map((_, i) => {
                      const starValue = currentLessonData.difficulty === 'Easy' ? 1 : currentLessonData.difficulty === 'Medium' ? 3 : 5;
                      return (
                        <span key={i} className={`text-xs ${i < starValue ? 'text-yellow-400' : 'text-gray-700'}`}>
                          ★
                        </span>
                      );
                    })}
                    <span className="text-[10px] ml-1 text-gray-400 font-bold uppercase tracking-tighter">
                      {currentLessonData.difficulty}
                    </span>
                  </div>
                )}
                <span className="text-gray-500 text-sm">Part of {course.title}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {currentLessonData?.title}
              </h1>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 leading-relaxed text-lg font-light">
                  {currentLessonData?.description || "本节课会围绕视频讲解、互动练习和游戏化挑战逐步展开。"}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['访问', currentLessonData?.viewCount || 0],
                  ['Practice', currentLessonData?.hasPractice ? '有' : '待开放'],
                  ['小游戏', currentLessonData?.hasGame ? '有' : '待开放'],
                  ['奖励', `${currentLessonData?.rewardsPoints || 0} pts / ${currentLessonData?.rewardsGems || 0} gems`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-600">{label}</div>
                    <div className="mt-2 text-sm font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>

              {currentLessonData?.activities && currentLessonData.activities.length > 0 && (
                <div className="mt-8 grid gap-3">
                  {currentLessonData.activities.map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest text-blue-300">{activity.type}</div>
                          <h3 className="mt-1 font-bold text-white">{activity.title}</h3>
                          {activity.description && <p className="mt-1 text-sm text-gray-500">{activity.description}</p>}
                        </div>
                        <div className="shrink-0 text-right text-xs font-bold text-gray-400">
                          +{activity.rewardsPoints} pts<br />
                          +{activity.rewardsGems} gems
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/10">
                <button
                  onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
                  disabled={currentLessonIndex === 0}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-20 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>
                
                <div className="text-gray-500 text-sm font-medium">
                  {currentLessonIndex + 1} / {course.lessons.length}
                </div>

                <button
                  onClick={() => setCurrentLessonIndex(Math.min(course.lessons.length - 1, currentLessonIndex + 1))}
                  disabled={currentLessonIndex === course.lessons.length - 1}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-20 flex items-center gap-2"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Related Lessons */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Curriculum
              </h2>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {course.lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${
                      currentLessonIndex === index
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        currentLessonIndex === index ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-sm font-medium truncate">{lesson.title}</div>
                        <div className="text-[10px] opacity-50 mt-1">
                          {lesson.duration ? `${Math.round(lesson.duration / 60)} mins` : '10 mins'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
