import { randomInt } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { emailVerificationRequestSchema } from '@/lib/auth-validation'

const PURPOSE = 'register'
const CODE_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60

export async function POST(request: NextRequest) {
  try {
    const body = emailVerificationRequestSchema.parse(await request.json())
    const email = body.email.trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 })
    }

    const recentCode = await prisma.emailVerification.findFirst({
      where: {
        email,
        purpose: PURPOSE,
        consumedAt: null,
        createdAt: {
          gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentCode) {
      return NextResponse.json({ error: '请等待60秒后再获取验证码' }, { status: 429 })
    }

    const code = String(randomInt(100000, 1000000))
    const codeHash = await hash(code, 12)

    await prisma.emailVerification.create({
      data: {
        email,
        codeHash,
        purpose: PURPOSE,
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
      },
    })

    const result = await sendVerificationEmail({ email, code })

    return NextResponse.json({
      message: result.delivered ? '验证码已发送，请查收邮箱。' : '验证码已生成。当前环境未配置SMTP，请查看服务器日志。',
      delivered: result.delivered,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Register code error:', error)
    return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 500 })
  }
}
