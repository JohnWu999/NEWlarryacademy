/**
 * 创建或重置验收测试账户（与注册接口相同的 bcrypt 哈希）。
 * 用法：在 larry-academy-v2 目录执行  npx tsx scripts/ensure-wularry-user.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const EMAIL = 'wularry999@gmail.com'
const PLAIN_PASSWORD = '123456'
const DISPLAY_NAME = 'Larry QA'

async function main() {
  const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      password: hashedPassword,
      name: DISPLAY_NAME,
      subscriptionStatus: 'free',
    },
    update: {
      password: hashedPassword,
      name: DISPLAY_NAME,
    },
    select: { id: true, email: true, name: true },
  })

  console.log('用户已就绪:', user)
  console.log('登录邮箱:', EMAIL)
  console.log('登录密码:', PLAIN_PASSWORD)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
