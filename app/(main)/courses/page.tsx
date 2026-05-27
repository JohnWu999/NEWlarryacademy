import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(category ? { category: { equals: category } } : {}),
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {category ? `📚 ${category} 课程` : '📚 所有课程'}
          </h1>
          <p className="text-xl text-gray-600">
            {category 
              ? `探索 ${category} 领域的专业知识，开启您的学习之旅`
              : '系统化的学科学习课程，帮助您深入理解每个知识点'}
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300"
            >
              {/* Thumbnail */}
              <div className="bg-gradient-to-br from-blue-400 to-purple-600 h-48 flex items-center justify-center">
                <div className="text-white text-6xl">📖</div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
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
                    {course.difficultyLevel === 'beginner'
                      ? '初级'
                      : course.difficultyLevel === 'intermediate'
                      ? '中级'
                      : '高级'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-gray-500 text-sm">
                    ⏱️ {course.duration ? `${course.duration}分钟` : '待定'}
                  </div>
                  {!course.isFree && (
                    <div className="text-2xl font-bold text-blue-600">
                      ¥{course.price}
                    </div>
                  )}
                </div>

                <Link
                  href={`/courses/${course.id}`}
                  className="block text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  查看课程
                </Link>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">暂无课程</p>
            <Link href="/subjects" className="text-blue-600 hover:underline mt-4 inline-block">
              返回学科选择
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
