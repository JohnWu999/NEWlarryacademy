import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import {
  setProductWeeklyLimit,
  XIAOWENHAO_PRODUCT_ID,
  XIAOWENHAO_RAINBOW_PRODUCT_ID,
} from '@/lib/shop'

const inventorySchema = z.object({
  regularWeeklyLimit: z.number().int().min(0).max(10000),
  rainbowWeeklyLimit: z.number().int().min(0).max(10000),
})

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const adminUser = session?.user?.email
    ? await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { email: true, role: true },
    })
    : null

  if (!isAdminUser(adminUser)) {
    return NextResponse.json({ error: '没有后台权限' }, { status: 403 })
  }

  const parsedBody = inventorySchema.safeParse(await request.json())
  if (!parsedBody.success) {
    return NextResponse.json({ error: '库存必须是 0 到 10000 之间的整数' }, { status: 400 })
  }

  const regular = await setProductWeeklyLimit(
    XIAOWENHAO_PRODUCT_ID,
    parsedBody.data.regularWeeklyLimit
  )
  const rainbow = await setProductWeeklyLimit(
    XIAOWENHAO_RAINBOW_PRODUCT_ID,
    parsedBody.data.rainbowWeeklyLimit
  )

  return NextResponse.json({ regular, rainbow })
}
