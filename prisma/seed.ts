import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('demo123456', 10)

  // Create demo users
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@larryacademy.com' },
    update: {},
    create: {
      email: 'demo@larryacademy.com',
      name: 'Demo User',
      password: hashedPassword,
      subscriptionStatus: 'free',
    },
  })

  const premiumUser = await prisma.user.upsert({
    where: { email: 'premium@larryacademy.com' },
    update: {},
    create: {
      email: 'premium@larryacademy.com',
      name: 'Premium User',
      password: hashedPassword,
      subscriptionStatus: 'premium',
    },
  })

  console.log('Created users:', demoUser.email, premiumUser.email)

  // Create sample courses
  const course1 = await prisma.course.create({
    data: {
      title: '基础数学入门',
      description: '适合小学生的数学基础课程，包含加减乘除、分数、小数等内容',
      price: 0,
      isFree: true,
      category: 'math',
      difficultyLevel: 'beginner',
      duration: 120,
      featured: true,
      published: true,
    },
  })

  const course2 = await prisma.course.create({
    data: {
      title: '初中代数精讲',
      description: '深入讲解初中代数知识，包括方程、不等式、函数等',
      price: 199,
      isFree: false,
      category: 'math',
      difficultyLevel: 'intermediate',
      duration: 240,
      featured: true,
      published: true,
    },
  })

  const course3 = await prisma.course.create({
    data: {
      title: '几何图形探索',
      description: '通过3D可视化学习几何图形的性质和变换',
      price: 299,
      isFree: false,
      category: 'math',
      difficultyLevel: 'intermediate',
      duration: 180,
      featured: false,
      published: true,
    },
  })

  console.log('Created courses:', course1.id, course2.id, course3.id)

  // Create some lessons for the free course
  await prisma.lesson.createMany({
    data: [
      { courseId: course1.id, title: '认识数字', description: '从1到100', order: 1, duration: 600 },
      { courseId: course1.id, title: '加法基础', description: '两位数加法', order: 2, duration: 900 },
      { courseId: course1.id, title: '减法基础', description: '两位数减法', order: 3, duration: 900 },
    ],
  })

  console.log('Created lessons for course:', course1.title)

  // Create sample games (gameConfig as JSON string)
  await prisma.game.create({
    data: {
      title: '乘法表挑战',
      description: '通过游戏练习乘法表，提高计算速度',
      gameType: 'multiplication',
      isAiGenerated: false,
      gameConfig: JSON.stringify({
        type: 'multiplication',
        difficulty: 'medium',
        timeLimit: 60,
        questionCount: 10,
        range: { min: 1, max: 12 },
      }),
      published: true,
      featured: true,
    },
  })

  await prisma.game.create({
    data: {
      title: '加法速算',
      description: '快速心算加法题，锻炼数学思维',
      gameType: 'addition',
      isAiGenerated: false,
      gameConfig: JSON.stringify({
        type: 'addition',
        difficulty: 'easy',
        timeLimit: 90,
        questionCount: 15,
        range: { min: 1, max: 100 },
      }),
      published: true,
      featured: true,
    },
  })

  await prisma.game.create({
    data: {
      title: '几何图形识别',
      description: '识别各种几何图形，学习图形特征',
      gameType: 'geometry',
      isAiGenerated: false,
      gameConfig: JSON.stringify({
        type: 'geometry',
        difficulty: 'medium',
        shapes: ['circle', 'square', 'triangle', 'rectangle', 'pentagon'],
      }),
      published: true,
      featured: false,
    },
  })

  console.log('Created sample games')

  // Create sample products
  await prisma.product.create({
    data: {
      name: '几何基础套装',
      description: '包含立方体、圆柱体、球体等基础几何模型，适合初学者',
      price: 198,
      category: '3d-tools',
      stock: 50,
      featured: true,
      published: true,
    },
  })

  await prisma.product.create({
    data: {
      name: '代数可视化套装',
      description: '用3D模型演示方程式和函数关系，帮助理解抽象概念',
      price: 268,
      category: '3d-tools',
      stock: 30,
      featured: true,
      published: true,
    },
  })

  await prisma.product.create({
    data: {
      name: '高级数学套装',
      description: '适合高中及以上学生的高级数学概念模型',
      price: 358,
      category: '3d-tools',
      stock: 20,
      featured: true,
      published: true,
    },
  })

  console.log('Created sample products')
  console.log('Seeding completed!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error('Error seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
