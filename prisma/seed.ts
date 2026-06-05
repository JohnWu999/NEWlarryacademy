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
      title: 'Larry Math Core (Legacy Hub)',
      description: 'Legacy Larry Math hub kept only for historical data. Current Larry Math lessons are published through Tencent VOD module courses.',
      price: 0,
      isFree: true,
      accessLevel: 'public',
      category: 'math',
      courseTrack: 'larry-math',
      status: 'archived',
      videoProvider: 'tencent-vod',
      videoUrl: null,
      youtubeVideoId: null,
      difficultyLevel: 'beginner',
      duration: 180,
      featured: false,
      published: false,
    },
    create: {
      id: 'course-larry-math-core',
      title: 'Larry Math Core (Legacy Hub)',
      description: 'Legacy Larry Math hub kept only for historical data. Current Larry Math lessons are published through Tencent VOD module courses.',
      price: 0,
      isFree: true,
      accessLevel: 'public',
      category: 'math',
      courseTrack: 'larry-math',
      status: 'archived',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'beginner',
      duration: 180,
      featured: false,
      published: false,
    },
  })

  const ibPypComingSoon = [
    {
      id: 'course-ib-big-math',
      title: 'IB Big Math G6 (PYP)',
      gradeLevel: 'G6',
      thumbnailUrl: '/course-covers/ib-g6-pyp-cover.svg',
      description: 'A confident Grade 6 bridge into IB-style math: fractions, ratios, decimals, geometry, data, and word problems are rebuilt as clear visual models and daily practice, so students do not just follow procedures—they understand why the math works.',
      expectedFeatures: ['Fractions, ratios, decimals, and percent fluency', 'Geometry foundations with visual models', 'Data interpretation and word-problem reasoning', '40 lessons and 800 progressive practice questions'],
    },
    {
      id: 'course-ib-big-math-g7-pyp',
      title: 'IB Big Math G7 (PYP)',
      gradeLevel: 'G7',
      thumbnailUrl: '/course-covers/ib-g7-pyp-cover.svg',
      description: 'A Grade 7 reasoning path for students ready to think more independently: algebraic patterns, proportional relationships, probability, statistics, area, volume, and multi-step problem solving come together in a structured IB math companion.',
      expectedFeatures: ['Algebra patterns and proportional reasoning', 'Probability, statistics, and data stories', 'Area, volume, and spatial thinking', '40 lessons and 800 progressive practice questions'],
    },
    {
      id: 'course-ib-big-math-g8-pyp',
      title: 'IB Big Math G8 (PYP)',
      gradeLevel: 'G8',
      thumbnailUrl: '/course-covers/ib-g8-pyp-cover.svg',
      description: 'A Grade 8 launchpad for advanced IB math: students connect equations, functions, coordinate geometry, transformations, probability, and proof-style reasoning, building the kind of organized foundation that makes higher-level math feel possible.',
      expectedFeatures: ['Equations, functions, and coordinate geometry', 'Transformations and proof-style reasoning', 'Probability, statistics, and integrated challenge problems', '40 lessons and 800 progressive practice questions'],
    },
  ]

  const [ibBigMath, ibBigMathG7, ibBigMathG8] = await Promise.all(ibPypComingSoon.map((course) => prisma.course.upsert({
    where: { id: course.id },
    update: {
      title: course.title,
      description: course.description,
      price: 29,
      isFree: false,
      accessLevel: 'paid',
      category: 'ib-big-math',
      courseTrack: 'ib-big-math',
      status: 'coming-soon',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: 0,
      expectedFeatures: JSON.stringify(course.expectedFeatures),
      thumbnailUrl: course.thumbnailUrl,
      gradeLevel: course.gradeLevel,
      difficulty: 'Medium',
      featured: true,
      published: true,
    },
    create: {
      id: course.id,
      title: course.title,
      description: course.description,
      price: 29,
      isFree: false,
      accessLevel: 'paid',
      category: 'ib-big-math',
      courseTrack: 'ib-big-math',
      status: 'coming-soon',
      videoProvider: 'tencent-vod',
      difficultyLevel: 'intermediate',
      duration: 0,
      expectedFeatures: JSON.stringify(course.expectedFeatures),
      thumbnailUrl: course.thumbnailUrl,
      gradeLevel: course.gradeLevel,
      difficulty: 'Medium',
      featured: true,
      published: true,
    },
  })))

  const ngssCourses = [
    {
      id: 'course-ngss-science',
      title: 'NGSS Science Grade 6',
      description: 'A future-facing Grade 6 NGSS science course built around phenomena, virtual labs, evidence-based explanations, interactive practice, and student curiosity.',
      gradeLevel: 'G6',
      thumbnailUrl: '/course-covers/ngss-g6-cover.svg',
      status: 'active',
      isFree: false,
      accessLevel: 'paid',
      price: 19,
      difficultyLevel: 'intermediate',
      expectedFeatures: ['20 phenomenon lessons', '200 practice questions', 'Open-response science reflection', 'Evidence and model-based reasoning'],
      duration: 300,
    },
    {
      id: 'course-ngss-science-g7',
      title: 'NGSS Science Grade 7',
      description: 'A Grade 7 NGSS path for deeper systems thinking: ecosystems, cells, matter cycles, energy transfer, Earth systems, data, and engineering design come together through phenomena and practice.',
      gradeLevel: 'G7',
      thumbnailUrl: '/course-covers/ngss-g7-cover.svg',
      status: 'coming-soon',
      isFree: false,
      accessLevel: 'paid',
      price: 19,
      difficultyLevel: 'intermediate',
      expectedFeatures: ['Ecosystems, cells, and matter cycles', 'Energy transfer and Earth systems', 'Data-rich explanation practice', '20 lessons and 200 planned questions'],
      duration: 0,
    },
    {
      id: 'course-ngss-science-g8',
      title: 'NGSS Science Grade 8',
      description: 'A Grade 8 NGSS launchpad for high-school readiness: forces, waves, genetics, natural selection, space systems, climate evidence, and engineering constraints are organized into clear inquiry missions.',
      gradeLevel: 'G8',
      thumbnailUrl: '/course-covers/ngss-g8-cover.svg',
      status: 'coming-soon',
      isFree: false,
      accessLevel: 'paid',
      price: 19,
      difficultyLevel: 'advanced',
      expectedFeatures: ['Forces, waves, genetics, and space systems', 'Climate evidence and natural selection', 'Engineering design constraints', '20 lessons and 200 planned questions'],
      duration: 0,
    },
  ]

  const [ngssScience, ngssScienceG7, ngssScienceG8] = await Promise.all(ngssCourses.map((course) => prisma.course.upsert({
    where: { id: course.id },
    update: {
      title: course.title,
      description: course.description,
      price: course.price,
      isFree: course.isFree,
      accessLevel: course.accessLevel,
      category: 'ngss-science',
      courseTrack: 'ngss-science',
      status: course.status,
      videoProvider: 'tencent-vod',
      difficultyLevel: course.difficultyLevel,
      duration: course.duration,
      expectedFeatures: JSON.stringify(course.expectedFeatures),
      thumbnailUrl: course.thumbnailUrl,
      gradeLevel: course.gradeLevel,
      difficulty: course.difficultyLevel === 'advanced' ? 'Hard' : 'Medium',
      featured: true,
      published: true,
    },
    create: {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      isFree: course.isFree,
      accessLevel: course.accessLevel,
      category: 'ngss-science',
      courseTrack: 'ngss-science',
      status: course.status,
      videoProvider: 'tencent-vod',
      difficultyLevel: course.difficultyLevel,
      duration: course.duration,
      expectedFeatures: JSON.stringify(course.expectedFeatures),
      thumbnailUrl: course.thumbnailUrl,
      gradeLevel: course.gradeLevel,
      difficulty: course.difficultyLevel === 'advanced' ? 'Hard' : 'Medium',
      featured: true,
      published: true,
    },
  })))

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
      status: 'archived',
      videoProvider: 'tencent-vod',
      published: false,
      featured: false,
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
      videoProvider: 'tencent-vod',
      videoUrl: null,
      youtubeVideoId: null,
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
      videoProvider: 'tencent-vod',
      videoUrl: null,
      youtubeVideoId: null,
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
      videoProvider: 'tencent-vod',
      videoUrl: null,
      youtubeVideoId: null,
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
    ['game-bubble-factor-burst', '偶数泡泡派对', '弹出正确倍数泡泡，在连击中练习因数、倍数和整除判断。', 'bubble', true],
    ['game-math-nitro-race', '数学赛车', '用加减乘混合运算给赛车充能，连续答对才能超车冲线。', 'race', true],
    ['game-spin-wheel-arena', '乘法转盘大挑战', '转盘随机触发混合运算题，连续答对后进入更难的奖励回合。', 'wheel', false],
    ['game-fraction-treasure', '宝藏猎人', '用分数、比例和数量关系破解宝藏封印，收集更高阶的数学能量。', 'treasure', false],
    ['game-equation-duel', '宫殿对决', '用方程、逆运算和快速判断发动攻击，在回合制数学对决中获胜。', 'duel', false],
    ['game-logic-rescue', '革命救援', '通过坐标、路径和逻辑推理完成救援任务，训练多步骤数学思考。', 'rescue', false],
  ] as const

  for (const [id, title, description, gameType, featured] of games) {
    const difficulty = gameType === 'addition' ? 'easy' : ['duel', 'rescue', 'treasure'].includes(gameType) ? 'hard' : 'medium'
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
          difficulty,
          timeLimit: gameType === 'geometry' ? undefined : 60,
          questionCount: gameType === 'geometry' ? 10 : 12,
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
          difficulty,
          timeLimit: gameType === 'geometry' ? undefined : 60,
          questionCount: gameType === 'geometry' ? 10 : 12,
        }),
      },
    })
  }

  const larryOriginalGames = [
    {
      id: 'larry-original-even-bubble-blast',
      title: 'Larry 原创：偶数泡泡派对',
      titleEn: 'Larry Original: Even Bubble Blast',
      description: 'Larry 早期亲手做的泡泡反应游戏：找到所有偶数泡泡，在越来越快的节奏里守住生命值。',
      descriptionEn: 'One of Larry’s early handmade games: pop the even-number bubbles, protect your lives, and keep up as the pace gets faster.',
      gameType: 'larry-original',
      playUrl: '/legacy-games/even-bubble-blast.html',
      difficulty: 'easy',
    },
    {
      id: 'larry-original-math-race',
      title: 'Larry 原创：数学赛车',
      titleEn: 'Larry Original: Math Race',
      description: '驾驶赛车收集星星，用加减乘除给燃料补能；速度、燃料和心算同时在线。',
      descriptionEn: 'Drive, collect stars, and refuel with arithmetic. Speed, strategy, and mental math all work together.',
      gameType: 'larry-original',
      playUrl: '/legacy-games/math-race.html',
      difficulty: 'easy',
    },
    {
      id: 'larry-original-spin-wheel',
      title: 'Larry 原创：乘法转盘大挑战',
      titleEn: 'Larry Original: Spin Wheel Multiplication',
      description: '转动乘法转盘，挑战更大的数字；连续答对还能解锁空战小游戏。',
      descriptionEn: 'Spin the multiplication wheel, face bigger numbers, and unlock an arcade air-battle bonus game with streaks.',
      gameType: 'larry-original',
      playUrl: '/legacy-games/math-spin-wheel.html',
      difficulty: 'medium',
    },
    {
      id: 'larry-original-treasure-hunter',
      title: 'Larry 原创：宝藏猎人',
      titleEn: 'Larry Original: Treasure Hunter',
      description: '在神秘地图里寻找宝藏，用分数与比例解开封印，收集武器完成冒险。',
      descriptionEn: 'Explore a mysterious map, solve fraction and ratio puzzles, unlock treasures, and collect legendary weapons.',
      gameType: 'larry-original',
      playUrl: '/legacy-games/treasure-hunter.html',
      difficulty: 'hard',
    },
    {
      id: 'larry-original-palace-duel',
      title: 'Larry 原创：宫殿对决',
      titleEn: 'Larry Original: Palace Duel',
      description: '横版动作对战原型，包含角色动画、攻击、防御和 AI 对手，是 Larry 游戏创作的动作实验。',
      descriptionEn: 'A side-scrolling action prototype with character animation, attack, defense, and an AI opponent.',
      gameType: 'larry-original',
      playUrl: '/legacy-games/palace-duel.html',
      difficulty: 'medium',
    },
    {
      id: 'larry-original-revolution-rescue',
      title: 'Larry 原创：革命救援',
      titleEn: 'Larry Original: Revolution Rescue',
      description: '在地图中完成救援任务，用数学挑战推动剧情前进，训练计算、路径和判断力。',
      descriptionEn: 'Move through a rescue map where math challenges drive the mission, blending calculation, pathing, and judgment.',
      gameType: 'larry-original',
      playUrl: '/legacy-games/revolution-rescue.html',
      difficulty: 'hard',
    },
  ] as const

  for (const game of larryOriginalGames) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: {
        title: game.title,
        description: game.description,
        gameType: game.gameType,
        featured: false,
        published: true,
        gameConfig: JSON.stringify({
          collection: 'larry-originals',
          type: game.gameType,
          difficulty: game.difficulty,
          playUrl: game.playUrl,
          titleZh: game.title,
          titleEn: game.titleEn,
          descriptionZh: game.description,
          descriptionEn: game.descriptionEn,
        }),
      },
      create: {
        id: game.id,
        title: game.title,
        description: game.description,
        gameType: game.gameType,
        featured: false,
        published: true,
        gameConfig: JSON.stringify({
          collection: 'larry-originals',
          type: game.gameType,
          difficulty: game.difficulty,
          playUrl: game.playUrl,
          titleZh: game.title,
          titleEn: game.titleEn,
          descriptionZh: game.description,
          descriptionEn: game.descriptionEn,
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

  console.log('Courses:', larryMath.title, ibBigMath.title, ibBigMathG7.title, ibBigMathG8.title, ngssScience.title, ngssScienceG7.title, ngssScienceG8.title)
  console.log('Seeding completed!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (error) => {
    console.error('Error seeding:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
