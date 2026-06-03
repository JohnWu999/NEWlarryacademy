import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertLessonActivity(data: {
  id: string
  courseId: string
  lessonId?: string
  type: string
  title: string
  description?: string
  provider?: string
  order: number
  rewardsPoints: number
  rewardsGems: number
}) {
  await prisma.lessonActivity.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  })
}

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('demo123456', 10)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@larryacademy.com' },
    update: {},
    create: {
      email: 'demo@larryacademy.com',
      name: 'Demo User',
      password: hashedPassword,
      subscriptionStatus: 'free',
      points: 120,
      gems: 8,
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
      points: 560,
      gems: 42,
    },
  })

  console.log('Users:', demoUser.email, premiumUser.email)

  const larryMath = await prisma.course.upsert({
    where: { id: 'course-larry-math-core' },
    update: {
      title: 'Larry Math Core',
      description: 'Larry 亲自讲解的数学主课程：视频讲课、小游戏和 Practice 练习组合推进，帮助孩子把计算、逻辑和题感真正练起来。',
      price: 0,
      isFree: true,
      accessLevel: 'public',
      category: 'math',
      courseTrack: 'larry-math',
      status: 'active',
      videoProvider: 'youtube',
      difficultyLevel: 'beginner',
      duration: 180,
      featured: true,
      published: true,
    },
    create: {
      id: 'course-larry-math-core',
      title: 'Larry Math Core',
      description: 'Larry 亲自讲解的数学主课程：视频讲课、小游戏和 Practice 练习组合推进，帮助孩子把计算、逻辑和题感真正练起来。',
      price: 0,
      isFree: true,
      accessLevel: 'public',
      category: 'math',
      courseTrack: 'larry-math',
      status: 'active',
      videoProvider: 'youtube',
      difficultyLevel: 'beginner',
      duration: 180,
      featured: true,
      published: true,
    },
  })

  const ibBigMath = await prisma.course.upsert({
    where: { id: 'course-ib-big-math' },
    update: {
      title: 'IB Big Math G6 (MYP)',
      description: '面向 IB 数学思维的新课程。每节课将包含视频讲解、互动答题、Practice 和小游戏，强调概念理解、表达和跨主题连接。',
      price: 399,
      isFree: false,
      accessLevel: 'paid',
      category: 'ib-big-math',
      courseTrack: 'ib-big-math',
      status: 'coming-soon',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: 0,
      expectedFeatures: JSON.stringify(['腾讯 VOD 视频课程', '互动答题检查理解', '每节课 Practice', '每节课小游戏']),
      featured: true,
      published: true,
    },
    create: {
      id: 'course-ib-big-math',
      title: 'IB Big Math G6 (MYP)',
      description: '面向 IB 数学思维的新课程。每节课将包含视频讲解、互动答题、Practice 和小游戏，强调概念理解、表达和跨主题连接。',
      price: 399,
      isFree: false,
      accessLevel: 'paid',
      category: 'ib-big-math',
      courseTrack: 'ib-big-math',
      status: 'coming-soon',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: 0,
      expectedFeatures: JSON.stringify(['腾讯 VOD 视频课程', '互动答题检查理解', '每节课 Practice', '每节课小游戏']),
      featured: true,
      published: true,
    },
  })

  const ngssScience = await prisma.course.upsert({
    where: { id: 'course-ngss-science' },
    update: {
      title: 'NGSS Science',
      description: '围绕 NGSS 标准设计的科学课程。课程将以问题驱动、实验观察、互动练习和模拟小游戏帮助孩子建立科学解释能力。',
      price: 399,
      isFree: false,
      accessLevel: 'paid',
      category: 'ngss-science',
      courseTrack: 'ngss-science',
      status: 'coming-soon',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: 0,
      expectedFeatures: JSON.stringify(['科学探究视频', '互动答题', '实验/模拟小游戏', '积分与宝石奖励']),
      featured: true,
      published: true,
    },
    create: {
      id: 'course-ngss-science',
      title: 'NGSS Science',
      description: '围绕 NGSS 标准设计的科学课程。课程将以问题驱动、实验观察、互动练习和模拟小游戏帮助孩子建立科学解释能力。',
      price: 399,
      isFree: false,
      accessLevel: 'paid',
      category: 'ngss-science',
      courseTrack: 'ngss-science',
      status: 'coming-soon',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: 0,
      expectedFeatures: JSON.stringify(['科学探究视频', '互动答题', '实验/模拟小游戏', '积分与宝石奖励']),
      featured: true,
      published: true,
    },
  })

  const futureCourses = [
    ['course-ai-coding-coming-soon', 'AI Coding Lab', 'AI 编程方向预留：项目式编程、提示词、自动化和逻辑训练。', 'AI'],
    ['course-stem-coming-soon', 'STEM Project Studio', 'STEM 综合项目方向预留：把数学、科学、工程和表达放进一个完整作品。', 'STEM'],
    ['course-history-coming-soon', 'History Explorer', '历史方向预留：以故事、地图和时间线理解文明关键节点。', 'History'],
  ] as const

  for (const [id, title, description, category] of futureCourses) {
    await prisma.course.upsert({
      where: { id },
      update: {
        title,
        description,
        price: 0,
        isFree: false,
        accessLevel: 'registered',
        category,
        courseTrack: 'other',
        status: 'coming-soon',
        difficultyLevel: 'beginner',
        expectedFeatures: JSON.stringify(['课程介绍', '内容规划中', '上线后开放学习']),
        featured: false,
        published: true,
      },
      create: {
        id,
        title,
        description,
        price: 0,
        isFree: false,
        accessLevel: 'registered',
        category,
        courseTrack: 'other',
        status: 'coming-soon',
        difficultyLevel: 'beginner',
        expectedFeatures: JSON.stringify(['课程介绍', '内容规划中', '上线后开放学习']),
        featured: false,
        published: true,
      },
    })
  }

  await prisma.course.updateMany({
    where: {
      category: 'math',
      courseTrack: 'other',
    },
    data: {
      courseTrack: 'larry-math',
      status: 'active',
      videoProvider: 'youtube',
    },
  })

  const lessons = [
    {
      id: 'lesson-larry-numbers',
      courseId: larryMath.id,
      title: '认识数字与数量感',
      description: '从数字、数量、顺序和比较开始，建立稳定的数学语言。',
      order: 1,
      duration: 600,
      isPreview: true,
      hasPractice: true,
      hasGame: true,
      rewardsPoints: 20,
      rewardsGems: 1,
      videoProvider: 'youtube',
    },
    {
      id: 'lesson-larry-addition',
      courseId: larryMath.id,
      title: '加法基础与心算策略',
      description: '用拆分、凑十和可视化方法理解两位数加法。',
      order: 2,
      duration: 900,
      isPreview: false,
      hasPractice: true,
      hasGame: true,
      rewardsPoints: 25,
      rewardsGems: 1,
      videoProvider: 'youtube',
    },
    {
      id: 'lesson-larry-subtraction',
      courseId: larryMath.id,
      title: '减法基础与逆向思考',
      description: '把减法看成距离、变化和加法的逆过程。',
      order: 3,
      duration: 900,
      isPreview: false,
      hasPractice: true,
      hasGame: true,
      rewardsPoints: 25,
      rewardsGems: 1,
      videoProvider: 'youtube',
    },
  ]

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: lesson,
      create: lesson,
    })
  }

  await upsertLessonActivity({
    id: 'activity-larry-numbers-practice',
    courseId: larryMath.id,
    lessonId: 'lesson-larry-numbers',
    type: 'practice',
    title: '数量感 Practice',
    description: '完成一组数字比较和排序练习。',
    provider: 'internal-quiz',
    order: 1,
    rewardsPoints: 10,
    rewardsGems: 0,
  })
  await upsertLessonActivity({
    id: 'activity-larry-numbers-game',
    courseId: larryMath.id,
    lessonId: 'lesson-larry-numbers',
    type: 'game',
    title: '数字捕手小游戏',
    description: '用小游戏巩固数字识别和数量对应。',
    provider: 'internal-game',
    order: 2,
    rewardsPoints: 15,
    rewardsGems: 1,
  })

  const games = [
    ['game-multiplication-challenge', '乘法表挑战', '通过游戏练习乘法表，提高计算速度', 'multiplication', true],
    ['game-addition-speed', '加法速算', '快速心算加法题，锻炼数学思维', 'addition', true],
    ['game-geometry-shapes', '几何图形识别', '识别各种几何图形，学习图形特征', 'geometry', false],
  ] as const

  for (const [id, title, description, gameType, featured] of games) {
    await prisma.game.upsert({
      where: { id },
      update: {
        title,
        description,
        gameType,
        featured,
        published: true,
        gameConfig: JSON.stringify({
          type: gameType,
          difficulty: gameType === 'addition' ? 'easy' : 'medium',
          timeLimit: gameType === 'geometry' ? undefined : 60,
          questionCount: gameType === 'geometry' ? undefined : 10,
        }),
      },
      create: {
        id,
        title,
        description,
        gameType,
        featured,
        published: true,
        gameConfig: JSON.stringify({
          type: gameType,
          difficulty: gameType === 'addition' ? 'easy' : 'medium',
          timeLimit: gameType === 'geometry' ? undefined : 60,
          questionCount: gameType === 'geometry' ? undefined : 10,
        }),
      },
    })
  }

  const products = [
    ['product-geometry-kit', '几何基础套装', '包含立方体、圆柱体、球体等基础几何模型，适合初学者', 198],
    ['product-algebra-kit', '代数可视化套装', '用 3D 模型演示方程式和函数关系，帮助理解抽象概念', 268],
    ['product-advanced-kit', '高级数学套装', '适合高年级学生的高级数学概念模型', 358],
  ] as const

  for (const [id, name, description, price] of products) {
    await prisma.product.upsert({
      where: { id },
      update: { name, description, price, category: '3d-tools', stock: 30, featured: true, published: true },
      create: { id, name, description, price, category: '3d-tools', stock: 30, featured: true, published: true },
    })
  }

  console.log('Courses:', larryMath.title, ibBigMath.title, ngssScience.title)
  console.log('Seeding completed!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (error) => {
    console.error('Error seeding:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
