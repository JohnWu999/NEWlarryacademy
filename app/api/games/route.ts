import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const games = await prisma.game.findMany({
      where: { published: true },
      orderBy: [
        { featured: 'desc' },
        { playCount: 'desc' },
      ],
    })

    const dedupedGames = Array.from(
      games
        .reduce((map, game) => {
          const key = game.title.trim().toLowerCase()
          const existing = map.get(key)
          if (!existing || game.id.startsWith('game-')) {
            map.set(key, game)
          }
          return map
        }, new Map<string, (typeof games)[number]>())
        .values()
    )

    return NextResponse.json(dedupedGames)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
