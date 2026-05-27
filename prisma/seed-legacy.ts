/**
 * 迁移原站 (旧 Larry Academy 静态站) 的课程和游戏到新站数据库
 * 运行: npx tsx prisma/seed-legacy.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 原站数学竞赛课程 - 每课对应一个 YouTube 视频 (title, videoId)
const LEGACY_LESSONS: { title: string; videoId: string }[] = [
  { title: 'AMC 8 课程', videoId: 'Zf_24GIXOIc' },
  { title: 'Larry Math Class 162 | Triangle Area Ratio Puzzle', videoId: 'aS5wdaND2cs' },
  { title: 'larry math class 163 | Average Speed Word Problems', videoId: 'Ha9MrUI8qng' },
  { title: 'Larry Math Class 106 | Triangle Folding Angle Sum Puzzle', videoId: 'Kow655q0qOY' },
  { title: 'Larry Math Class 107 | Combinatorics Distribution Problem', videoId: '-OL2YB_NXJg' },
  { title: 'Larry Math Class 108 | Trapezoid and Circle Geometry Problem', videoId: 'c5nij6LOwYg' },
  { title: 'Larry Math Class 103 | Speed Distance Time Word Problem', videoId: 'gGKxCRfXoy4' },
  { title: 'Larry Math Class 104 | Counting Four Digit Distinct Integers', videoId: '4FXv_dEGe9k' },
  { title: 'Larry Math Class 105 | Successive Discount Percentage Logic', videoId: 'eAhBzIvNKNs' },
  { title: 'Larry Math Class 109 | Rectangle Perimeter Six Dimensions', videoId: 'K4Xdfef6cHY' },
  { title: 'Larry Math Class 110 | AMC 8 Tree Interval Problem', videoId: 'cVO5qVtwZ_A' },
  { title: 'Larry Math Class 111 | Fractions Percentages and Decimals Problem', videoId: 'Cu39-feeuqk' },
  { title: 'Larry Math Class 114 | Fibonacci Sequence Remainder Patterns', videoId: 'sZWq4nj5Dxs' },
  { title: 'Larry Math Class 115 | Nested Circles Shaded Area Problem', videoId: 'nK-GW3NvPIw' },
  { title: 'Larry Math Class 116 | Modular Arithmetic Grid Swap Puzzle', videoId: 'ZrCCVZ6uAU8' },
  { title: 'Larry Math Class 119 | Large Number Primality Test', videoId: 'kiAgRavTJjk' },
  { title: 'Larry Math Class 12 | Quadratic Expressions and Word Problems', videoId: '6A3pSyB2Vo0' },
  { title: 'Larry Math Class 120 | Divisibility Rules 3 and 9 Proof', videoId: 'CGFfPRpbj8k' },
  { title: 'Larry Math Class 121 | Digits 0-6 Subtraction Puzzle', videoId: 'cutJCgbMepQ' },
  { title: 'Larry Math Class 122 | Algebra Fraction Word Problem', videoId: 'nQozHZ-YoGI' },
  { title: 'Larry Math Class 123 | Prime Factorization Age Word Problem', videoId: 'oH0dJse1NM0' },
  { title: 'Larry Math Class 124 | Equal Product Grouping Challenge', videoId: '8y8_1cAJO9M' },
  { title: 'Larry Math Class 125 | Trailing Zeros in Factorials', videoId: '9MJpgyGmsJ0' },
  { title: 'Larry Math Class 33 | Circular Gems Logic Puzzle', videoId: 'itIaq-z_hD0' },
  { title: 'Larry Math Class 1 | Parentheses and Sign Change Rules', videoId: 'h8wuDU7DmZU' },
  { title: 'Larry Math Class 126 | Comparing Large Fractions Shortcut', videoId: 'WyX_yFX8XYY' },
  { title: 'Larry Math Class 127 | 3D Cube Surface Area Challenge', videoId: 'a8mia-zVZeU' },
  { title: 'Larry Math Class 128 | Shadow Height Ratio Problem', videoId: 'w546jZv693Y' },
  { title: 'Larry Math Class 129 | Pythagorean Theorem Equal Area Puzzle', videoId: 'GjHCbpY14Wc' },
  { title: 'Larry Math Class 14 | Line-up Logic Word Problem', videoId: 'c8NyoXSUUzc' },
  { title: 'Larry Math Class 126 | Comparing Exponents and Roots', videoId: 'N2C0gen16G4' },
  { title: 'Larry Math Class 15 | Yellow Circle Perimeter Geometry Challenge', videoId: 'ArDo06kXl5k' },
  { title: 'Larry Math Class 29 | Number Pattern Identification Challenge', videoId: 'cPd2j0aJ7u0' },
  { title: 'Larry Math Class 3 | Multiplication Table of 5 Challenge', videoId: 'N0hgiijK0-Y' },
  { title: 'Larry Math Class 30 | Algebraic Shape Logic Puzzle', videoId: 'sHi44m01KxU' },
  { title: 'Larry Math Class 34 | Working Backward Word Problem', videoId: 't2fyaGziR6U' },
  { title: 'Larry Math Class 35 | 3D Cube Surface Area Puzzle', videoId: 'O3DmrNxeJq4' },
  { title: 'Larry Math Class 36 | Geometric Grid Pattern Challenge', videoId: 'RKGKyjKpJ-I' },
  { title: 'Larry Math Class 37 | Finding the Median in Statistics', videoId: 'fu3J79tqg50' },
  { title: 'Larry Math Class 38 | Proving the Value of Pi', videoId: 'EUwg86AAPWo' },
  { title: 'Larry Math Class 40 | Rolling Die Path Logic Puzzle', videoId: 'Qlob2r_vNkI' },
  { title: 'Larry Math Class 41 | Square Pool and Lawn Area Puzzle', videoId: 'YbyQ0nbdrsE' },
  { title: 'Larry Math Class 42 | Hologram Coding Coefficient of Memory', videoId: 'HdBguVMX_CI' },
  { title: 'Larry Math Class 45 | Classic Age Difference Riddle', videoId: 'WIWuNjmUUh8' },
  { title: 'Larry Math Class 46 | Common Factor Arithmetic Shortcuts', videoId: 'm-JcOgVkTQ4' },
  { title: 'Larry Math Class 52 | Triangle and Polygon Interior Angles', videoId: 'L4P5lgTE5RM' },
  { title: 'Larry Math Class 53 | Repeating Digit Multiplication Patterns', videoId: 'tGXadomRa2k' },
  { title: 'Larry Math Class 54 | Multiplication and Addition Counting Rules', videoId: 'RK1HXWlDDPI' },
  { title: 'Larry Math Class 6 | Snack Distribution Logic Puzzle', videoId: 'KZoLcfd8INw' },
  { title: 'Larry Math Class 8 | Cube Net Geometry and Patterns', videoId: 'ehkGdSd9WUY' },
  { title: 'Larry Math Class 9 | Sum and Difference Word Problem', videoId: 'uOQ9mUapW4o' },
  { title: 'Larry Math Class 10 | Grid Logic Puzzle Challenge', videoId: 'Nr7BQLXccks' },
  { title: 'Larry Math Class 32 | Logic Grid and Ranking Puzzle', videoId: '-C4E3g2JI_U' },
  { title: 'Larry Math Class 49 | Parallelogram Side Length Puzzle', videoId: 'sfiSVlkgM4Q' },
  { title: 'Larry Math Class 50 | Square and Trapezoid Area Puzzle', videoId: '1T6Z74AYMV0' },
  { title: 'Larry Math Class 51 | Multiplying and Dividing Decimals', videoId: 'vGdERqvxvc0' },
  { title: 'Larry Math Class 7 | Solving the Interval Problem', videoId: 'sFgq7npS6L4' },
  { title: 'Larry Math Class 18 | Mental Math Addition Grouping Strategy', videoId: '6GTdiKjCYSI' },
  { title: 'Larry Math Class 31 | Logic Grid Method Puzzle', videoId: 'rVylOrKxKuo' },
  { title: 'Larry Math Class 113 | Maximize Black Surface Area Puzzle', videoId: 'RcJkCNO4HFw' },
  { title: 'Larry Math Class (更多课程)', videoId: 'UtLurxVsxkw' },
  { title: 'Larry Math Class (更多课程)', videoId: '2eHyl2tqk4Q' },
  { title: 'Larry Math Class (更多课程)', videoId: '-AfGyIfpQeY' },
  { title: 'Larry Math Class (更多课程)', videoId: 'XNcrez2EoxE' },
  { title: 'Larry Math Class (更多课程)', videoId: 'bCMOOqq9RC0' },
  { title: 'Larry Math Class (更多课程)', videoId: 'xkrXTh_jzLQ' },
  { title: 'Larry Math Class (更多课程)', videoId: '5piaJIPRZbg' },
  { title: 'Larry Math Class (更多课程)', videoId: '4ymlymWhXaI' },
]

// 原站 6 个可玩的游戏 (HTML 已复制到 public/legacy-games/)
const LEGACY_GAMES: { title: string; description: string; gameType: string; playUrl: string }[] = [
  { title: '偶数泡泡派对', description: '滑动弹出所有能被2整除的炫彩泡泡，守护你的五颗爱心！', gameType: 'custom', playUrl: '/legacy-games/even-bubble-blast.html' },
  { title: '数学赛车', description: '驾驶赛车收集星星，用加减法答题获得燃料', gameType: 'custom', playUrl: '/legacy-games/math-race.html' },
  { title: '乘法转盘大挑战', description: '转动转盘答乘法题，连续答对3题解锁打地鼠小游戏！', gameType: 'multiplication', playUrl: '/legacy-games/math-spin-wheel.html' },
  { title: '宝藏猎人', description: '探索神秘土地，用分数运算解开封印，收集五件神圣武器反抗暴君！', gameType: 'custom', playUrl: '/legacy-games/treasure-hunter.html' },
  { title: '宫殿对决', description: '横版格斗游戏！控制哈利与皇家武士战斗，使用攻击和格挡技巧击败对手！', gameType: 'custom', playUrl: '/legacy-games/palace-duel.html' },
  { title: '革命救援', description: '在游戏中运用数学与逻辑完成救援任务', gameType: 'custom', playUrl: '/legacy-games/revolution-rescue.html' },
]

async function main() {
  console.log('开始迁移原站课程和游戏...')

  // 1. 创建「数学竞赛」课程并添加所有课时
  let course = await prisma.course.findFirst({
    where: { title: '数学竞赛 - Larry Math Class (AMC 8)' },
  })
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: '数学竞赛 - Larry Math Class (AMC 8)',
        description: '美国数学竞赛 AMC 8 与 Larry Math Class 精选课程，涵盖几何、代数、组合、数论等。',
        price: 0,
        isFree: true,
        category: 'competition',
        difficultyLevel: 'intermediate',
        duration: LEGACY_LESSONS.length * 15,
        featured: true,
        published: true,
      },
    })
  }
  await prisma.lesson.deleteMany({ where: { courseId: course.id } })
  for (let i = 0; i < LEGACY_LESSONS.length; i++) {
    const lesson = LEGACY_LESSONS[i]
    await prisma.lesson.create({
      data: {
        courseId: course.id,
        title: lesson.title,
        videoUrl: `https://www.youtube.com/watch?v=${lesson.videoId}`,
        order: i + 1,
        duration: 600,
      },
    })
  }
  console.log(`已创建课程「${course.title}」，共 ${LEGACY_LESSONS.length} 节课。`)

  // 2. 添加原站 6 个游戏（带 playUrl，在新站中点击「开始游戏」会打开原游戏页）
  const existingLegacy = await prisma.game.findMany({ where: { gameType: 'custom', title: { in: LEGACY_GAMES.map(x => x.title) } } })
  if (existingLegacy.length >= LEGACY_GAMES.length) {
    console.log('原站游戏已存在，跳过创建。')
  } else {
    for (const g of LEGACY_GAMES) {
      await prisma.game.create({
        data: {
          title: g.title,
          description: g.description,
          gameType: g.gameType,
          isAiGenerated: false,
          gameConfig: JSON.stringify({ playUrl: g.playUrl }),
          published: true,
          featured: true,
        },
      })
    }
    console.log(`已添加 ${LEGACY_GAMES.length} 个原站游戏。`)
  }

  console.log('迁移完成！')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
