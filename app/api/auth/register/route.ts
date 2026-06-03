import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt, { compare } from 'bcryptjs'
import { z } from 'zod'
import { registerSchema } from '@/lib/auth-validation'

const PURPOSE = 'register'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)
    const email = validatedData.email.trim().toLowerCase()
    const { password, name } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        purpose: PURPOSE,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      return NextResponse.json(
        { error: '验证码不存在或已过期，请重新获取' },
        { status: 400 }
      )
    }

    const validCode = await compare(validatedData.verificationCode, verification.codeHash)

    if (!validCode) {
      return NextResponse.json(
        { error: '验证码错误，请检查后再试' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: new Date(),
          marketingConsent: validatedData.marketingConsent ?? false,
          subscriptionStatus: 'free',
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })

      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { consumedAt: new Date() },
      })

      return createdUser
    })

    return NextResponse.json(
      { 
        message: '注册成功！',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
