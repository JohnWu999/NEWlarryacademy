import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!course) {
    redirect('/courses')
  }

  // Check if user has access
  let hasAccess = course.isFree
  let progress = null

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        purchasedCourses: {
          where: { courseId: id },
        },
        courseProgress: {
          where: { courseId: id },
        },
      },
    })

    if (user) {
      hasAccess = hasAccess || user.purchasedCourses.length > 0
      progress = user.courseProgress[0] || null
    }
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Video Placeholder */}
              <div className="bg-gradient-to-br from-blue-400 to-purple-600 aspect-video flex items-center justify-center">
                <div className="text-white text-8xl">📹</div>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  {course.featured && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-semibold">
                      精选
                    </span>
                  )}
                  {course.isFree ? (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      免费
                    </span>
                  ) : (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      付费
                    </span>
                  )}
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {course.category}
                  </span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>

                {progress && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">学习进度</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(progress.progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>⏱️</span>
                    <span>{course.duration ? `${course.duration}分钟` : '待定'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>📚</span>
                    <span>{course.lessons.length} 节课</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>🎓</span>
                    <span>
                      {course.difficultyLevel === 'beginner'
                        ? '初级'
                        : course.difficultyLevel === 'intermediate'
                        ? '中级'
                        : '高级'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>💰</span>
                    <span>{course.isFree ? '免费' : `¥${course.price}`}</span>
                  </div>
                </div>

                {hasAccess ? (
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="block text-center bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    {progress ? '继续学习' : '开始学习'}
                  </Link>
                ) : (
                  <button className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-200">
                    购买课程 - ¥{course.price}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                课程内容
              </h2>
              
              {course.lessons.length > 0 ? (
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                          {lesson.duration && (
                            <div className="text-sm text-gray-500 mt-1">
                              ⏱️ {Math.round(lesson.duration / 60)}分钟
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  课程内容即将上线
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
