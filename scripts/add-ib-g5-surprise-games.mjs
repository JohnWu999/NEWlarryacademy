import fs from 'node:fs'
import path from 'node:path'

const coursePath = path.join(process.cwd(), 'data/ib-pyp-g5-course.json')

const templateCopy = {
  starship: {
    zh: '驾驶飞船收集正确结果，把运算速度变成反应力。',
    en: 'Pilot the starship and collect correct values to turn computation into quick reaction.',
  },
  geometry: {
    zh: '拖动形状和尺寸，用视觉模型锁定几何关系。',
    en: 'Drag shapes and dimensions to lock the geometry relationship into a visual model.',
  },
  coaster: {
    zh: '调出正确轨迹，让图像、规律和目标值对齐。',
    en: 'Tune the curve so graphs, patterns, and target values line up.',
  },
  fraction: {
    zh: '切出目标分数，把分数、比例和百分数变成可操作的图形。',
    en: 'Slice the target fraction and make fractions, ratios, and percents feel tangible.',
  },
  blaster: {
    zh: '瞄准正确答案，快速清除干扰项。',
    en: 'Aim at the correct value and clear distractors fast.',
  },
  snake: {
    zh: '沿着倍数和因数前进，避开错误路线。',
    en: 'Move through multiples and factors while avoiding wrong paths.',
  },
  tetra: {
    zh: '把下落数字放到合适位置，凑出目标关系。',
    en: 'Place falling numbers into the right lanes to build the target relationship.',
  },
  creature: {
    zh: '收集能量，完成预算、变化和多步建模挑战。',
    en: 'Gather energy to solve budget, change, and multi-step modelling challenges.',
  },
  maze: {
    zh: '在迷宫里找到可整除、可匹配的数学路径。',
    en: 'Find the divisible, matching math path through the maze.',
  },
  pinball: {
    zh: '用弹球击中数据目标，感受统计和概率的波动。',
    en: 'Hit data targets with pinball motion and feel variation in statistics and probability.',
  },
}

function hashString(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function pickTemplate(title) {
  const text = title.toLowerCase()
  if (/\b(fraction|fractions|decimal|decimals|percent|percents|ratio|ratios|rate|rates|rational)\b/.test(text)) return 'fraction'
  if (/area|volume|composite|scale|coordinate|transform|angle|triangle|quadrilateral|circle|symmetry|pi|net|surface|measurement/.test(text)) return 'geometry'
  if (/factor|multiple|prime|gcf|lcm/.test(text)) return 'snake'
  if (/data|graph|mean|median|mode|range|probability|statistical|distribution|investigation/.test(text)) return 'pinball'
  if (/pattern|sequence|variable|expression|equation|linear|inequal|formula/.test(text)) return 'coaster'
  if (/financial|budget|profit|price|tax|tip|growth|change|modelling|modeling|design|capstone/.test(text)) return 'creature'
  if (/integer|number line|negative/.test(text)) return 'maze'
  if (/operation|order|division|multiply|subtract|add/.test(text)) return 'blaster'
  return 'starship'
}

function shortTopic(title) {
  return title
    .replace(/^IB G5 Level\s+\d+\s+\|\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'))

course.lessons = course.lessons.map((lesson) => {
  const templateId = pickTemplate(lesson.title)
  const topic = shortTopic(lesson.title)
  const copy = templateCopy[templateId]
  const questionCount = Array.isArray(lesson.practice?.questions) ? lesson.practice.questions.length : 15
  const maxInsertAfter = Math.max(8, Math.min(14, questionCount - 1))
  const insertAfter = 8 + (hashString(lesson.id) % (maxInsertAfter - 8 + 1))

  return {
    ...lesson,
    hasGame: true,
    practice: {
      ...lesson.practice,
      surpriseGame: {
        id: `surprise-game-${lesson.id}`,
        templateId,
        insertAfter,
        requiredRounds: 1,
        titleZh: `${topic} 小挑战`,
        titleEn: `${topic} Challenge`,
        descriptionZh: copy.zh,
        descriptionEn: copy.en,
      },
    },
  }
})

fs.writeFileSync(coursePath, `${JSON.stringify(course, null, 2)}\n`)

const summary = course.lessons.map((lesson) => ({
  lesson: lesson.order,
  templateId: lesson.practice.surpriseGame.templateId,
  insertAfter: lesson.practice.surpriseGame.insertAfter,
}))

console.log(JSON.stringify({ updated: course.lessons.length, summary }, null, 2))
