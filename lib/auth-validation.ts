import { z } from 'zod'

export const emailVerificationRequestSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
})

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符').max(128, '密码不能超过128个字符'),
  name: z.string().trim().min(1, '请输入您的姓名').max(80, '姓名不能超过80个字符'),
  verificationCode: z.string().regex(/^\d{6}$/, '请输入6位邮箱验证码'),
  marketingConsent: z.boolean().optional(),
})
