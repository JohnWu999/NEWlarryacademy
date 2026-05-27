import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const grade = searchParams.get('grade')

  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        ...(grade ? { gradeLevel: grade } : {}),
        course: {
          published: true,
          OR: [
            { courseTrack: 'larry-math' },
            { category: 'math' },
            { category: 'Math' },
            { category: 'competition' },
          ],
        },
      },
      include: {
        course: true
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching math lessons:', error)
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}
