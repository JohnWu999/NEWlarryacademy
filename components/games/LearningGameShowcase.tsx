'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export type TemplateId =
  | 'starship'
  | 'geometry'
  | 'coaster'
  | 'circuit'
  | 'fraction'
  | 'molecule'
  | 'blaster'
  | 'snake'
  | 'tetra'
  | 'creature'
  | 'maze'
  | 'pinball'
type DragKind = 'none' | 'ship' | 'geometry' | 'coaster' | 'chip' | 'blade' | 'atom' | 'aim' | 'paddle'

type Template = {
  id: TemplateId
  titleZh: string
  titleEn: string
  subject: string
  verbZh: string
  verbEn: string
  accent: string
  wash: string
}

export type ShowcaseGameCard = {
  id: TemplateId
  titleZh: string
  titleEn: string
  subject: string
  verbZh: string
  verbEn: string
  accent: string
  wash: string
}

type Objective = {
  promptZh: string
  promptEn: string
  target: number
  expression?: string
  a?: number
  b?: number
  c?: number
  den?: number
  num?: number
  current?: number
}

type Pod = {
  x: number
  y: number
  vx: number
  vy: number
  value: number
  good: boolean
  radius: number
  color?: string
  label?: string
}

type Chip = {
  id: number
  r: number
  x: number
  y: number
  homeX: number
  homeY: number
}

type Atom = {
  id: number
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  text?: string
  size?: number
}

type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

type Cell = {
  x: number
  y: number
}

type FallingBlock = {
  x: number
  y: number
  value: number
  color: string
}

type MazeItem = {
  x: number
  y: number
  value: number
  good: boolean
  color: string
}

type Brick = {
  x: number
  y: number
  value: number
  good: boolean
  alive: boolean
  color: string
}

type Arcade = {
  aimX: number
  aimY: number
  playerX: number
  playerY: number
  cooldown: number
  shots: Shot[]
  targets: Pod[]
  snake: Cell[]
  snakeDir: Cell
  nextDir: Cell
  food: Pod[]
  snakeTimer: number
  falling: FallingBlock | null
  lanes: number[]
  dropTimer: number
  creatureX: number
  creatureY: number
  enemyHp: number
  energy: number
  mazePlayer: Cell
  mazeItems: MazeItem[]
  mazePulse: number
  ballX: number
  ballY: number
  ballVx: number
  ballVy: number
  paddleX: number
  bricks: Brick[]
}

type Sim = {
  id: TemplateId
  round: number
  level: number
  score: number
  streak: number
  startedAt: number
  pendingRecord: PendingRecord | null
  pendingPenalty: PendingPenalty | null
  objective: Objective
  messageZh: string
  messageEn: string
  messageTimer: number
  drag: DragKind
  dragId: number
  mouse: { x: number; y: number; down: boolean }
  keys: Set<string>
  particles: Particle[]
  pods: Pod[]
  spawnTimer: number
  ship: { x: number; y: number; tx: number; ty: number; boost: number }
  geometry: { w: number; h: number; built: number; settled: boolean }
  coaster: { handleX: number; handleY: number; cartT: number; flash: number }
  circuit: { chips: Chip[]; socketR: number | null; pulse: number }
  fraction: { angle: number; sliced: number; spin: number }
  molecule: { atoms: Atom[]; requiredBonds: number; stableTimer: number }
  arcade: Arcade
}

type Hud = {
  score: number
  streak: number
  level: number
  promptZh: string
  promptEn: string
  messageZh: string
  messageEn: string
}

type PendingRecord = {
  templateId: TemplateId
  score: number
  streak: number
  level: number
  round: number
  duration: number
}

type PendingPenalty = {
  templateId: TemplateId
  penalty: number
  reason: string
  score: number
}

const width = 1040
const height = 640
const snakeCols = 16
const snakeRows = 11
const snakeCellW = 58
const snakeCellH = 43
const snakeOriginX = 56
const snakeOriginY = 122

export const showcaseGames: ShowcaseGameCard[] = [
  {
    id: 'starship',
    titleZh: '星际算力战舰',
    titleEn: 'Starship Compute',
    subject: 'Arithmetic',
    verbZh: '操控飞船拦截正确能量球',
    verbEn: 'Pilot into the correct energy pod',
    accent: '#38bdf8',
    wash: 'from-sky-500/25 via-indigo-500/15 to-[#07111f]',
  },
  {
    id: 'geometry',
    titleZh: '几何建城',
    titleEn: 'Geometry City',
    subject: 'Geometry',
    verbZh: '拖拽建筑角点做出目标面积',
    verbEn: 'Drag the building corner to match area',
    accent: '#f59e0b',
    wash: 'from-amber-400/25 via-teal-500/10 to-[#10120a]',
  },
  {
    id: 'coaster',
    titleZh: '函数过山车',
    titleEn: 'Function Coaster',
    subject: 'Functions',
    verbZh: '拖动控制点让轨道穿过光门',
    verbEn: 'Drag the control point through the gate',
    accent: '#fb7185',
    wash: 'from-rose-500/25 via-violet-500/15 to-[#160914]',
  },
  {
    id: 'circuit',
    titleZh: '电路黑客',
    titleEn: 'Circuit Hacker',
    subject: 'Science',
    verbZh: '拖入正确电阻点亮电路',
    verbEn: 'Drag the right resistor into the socket',
    accent: '#22c55e',
    wash: 'from-emerald-400/25 via-cyan-500/10 to-[#06130f]',
  },
  {
    id: 'fraction',
    titleZh: '分数切割场',
    titleEn: 'Fraction Slicer',
    subject: 'Fractions',
    verbZh: '旋转切割刀切出目标分数',
    verbEn: 'Rotate the cutter to the target fraction',
    accent: '#a78bfa',
    wash: 'from-violet-500/25 via-fuchsia-500/10 to-[#10091b]',
  },
  {
    id: 'molecule',
    titleZh: '分子实验室',
    titleEn: 'Molecule Lab',
    subject: 'Chemistry',
    verbZh: '拖拽原子靠近形成目标成键数',
    verbEn: 'Drag atoms close to form target bonds',
    accent: '#2dd4bf',
    wash: 'from-teal-400/25 via-blue-500/10 to-[#061217]',
  },
  {
    id: 'blaster',
    titleZh: '算力弹幕战机',
    titleEn: 'Compute Blaster',
    subject: 'Arcade',
    verbZh: '移动战机，瞄准并击落正确答案',
    verbEn: 'Move, aim, and shoot the correct answer',
    accent: '#f97316',
    wash: 'from-orange-500/25 via-red-500/10 to-[#190b06]',
  },
  {
    id: 'snake',
    titleZh: '倍数贪吃蛇',
    titleEn: 'Multiple Snake',
    subject: 'Classic',
    verbZh: '操控蛇吃掉符合规则的数字',
    verbEn: 'Steer the snake into matching numbers',
    accent: '#84cc16',
    wash: 'from-lime-400/25 via-emerald-500/10 to-[#071306]',
  },
  {
    id: 'tetra',
    titleZh: '数值俄罗斯方块',
    titleEn: 'Tetra Sum',
    subject: 'Classic',
    verbZh: '移动下落方块，让列和达到目标',
    verbEn: 'Drop blocks so a lane sum hits the target',
    accent: '#60a5fa',
    wash: 'from-blue-400/25 via-cyan-500/10 to-[#06111f]',
  },
  {
    id: 'creature',
    titleZh: '能量对战训练场',
    titleEn: 'Energy Duel Trainer',
    subject: 'Battle',
    verbZh: '移动能量核心，凑够伤害发动攻击',
    verbEn: 'Move the energy core to charge the right attack',
    accent: '#f472b6',
    wash: 'from-pink-400/25 via-purple-500/10 to-[#170617]',
  },
  {
    id: 'maze',
    titleZh: '因数迷宫',
    titleEn: 'Factor Maze',
    subject: 'Maze',
    verbZh: '在迷宫里收集正确因数并避开诱饵',
    verbEn: 'Collect factors and dodge decoys in a maze',
    accent: '#facc15',
    wash: 'from-yellow-300/25 via-orange-500/10 to-[#171205]',
  },
  {
    id: 'pinball',
    titleZh: '算术弹球',
    titleEn: 'Equation Pinball',
    subject: 'Physics',
    verbZh: '移动挡板，让弹球击中正确砖块',
    verbEn: 'Move the paddle and bounce into the answer',
    accent: '#c084fc',
    wash: 'from-purple-400/25 via-indigo-500/10 to-[#10071c]',
  },
]

const templates: Template[] = showcaseGames

const howToPlay: Record<TemplateId, { goalZh: string; goalEn: string; stepsZh: string[]; stepsEn: string[]; learnZh: string; learnEn: string; visual: string }> = {
  starship: {
    goalZh: '让飞船撞上正确结果的能量球。',
    goalEn: 'Fly into the pod with the correct result.',
    stepsZh: ['看左上角算式', '拖动飞船或按 WASD', '撞数字，不看颜色'],
    stepsEn: ['Read the expression', 'Drag the ship or press WASD', 'Hit the number, not the color'],
    learnZh: '把乘法和减法合成一个动作判断。',
    learnEn: 'Combines multiplication and subtraction into one action.',
    visual: 'ship',
  },
  geometry: {
    goalZh: '拖角点，搭出目标面积的矩形。',
    goalEn: 'Drag the corner to build the target area.',
    stepsZh: ['看目标面积', '拖右上角圆点', '让 宽×高 命中目标'],
    stepsEn: ['Read the target area', 'Drag the top-right handle', 'Match width × height'],
    learnZh: '面积不是背公式，是数格子形成的乘法。',
    learnEn: 'Area becomes visible as rows times columns.',
    visual: 'grid',
  },
  coaster: {
    goalZh: '拖轨道控制点，让小车穿过目标光门。',
    goalEn: 'Drag the control point so the cart crosses the gate.',
    stepsZh: ['看目标高度', '拖动轨道控制点', '让曲线穿过光门'],
    stepsEn: ['Read the gate height', 'Drag the curve handle', 'Guide the track through the gate'],
    learnZh: '函数图像是可以被操作和预测的轨迹。',
    learnEn: 'A function graph becomes a controllable path.',
    visual: 'curve',
  },
  circuit: {
    goalZh: '把正确电阻拖进插槽，点亮电路。',
    goalEn: 'Drag the right resistor into the socket.',
    stepsZh: ['看电流和目标电压', '计算 V=I×R', '拖正确电阻'],
    stepsEn: ['Read current and voltage', 'Use V=I×R', 'Drop the right resistor'],
    learnZh: '欧姆定律从公式变成电路反馈。',
    learnEn: 'Ohm law becomes a live circuit reaction.',
    visual: 'circuit',
  },
  fraction: {
    goalZh: '旋转刀片，切出目标分数对应的角度。',
    goalEn: 'Rotate the blade to the fraction angle.',
    stepsZh: ['看目标分数', '拖动刀片方向', '点执行切割'],
    stepsEn: ['Read the fraction', 'Drag the blade angle', 'Press Slice'],
    learnZh: '分数是整体的一部分，也能映射成圆心角。',
    learnEn: 'Fractions map to parts of a whole circle.',
    visual: 'fraction',
  },
  molecule: {
    goalZh: '拖原子靠近，形成指定数量的稳定键。',
    goalEn: 'Drag atoms close to make stable bonds.',
    stepsZh: ['看目标成键数', '拖动原子靠近', '稳定 0.5 秒过关'],
    stepsEn: ['Read the bond target', 'Drag atoms together', 'Hold stable for half a second'],
    learnZh: '结构关系通过距离和连接被看见。',
    learnEn: 'Structure appears through distance and bonding.',
    visual: 'molecule',
  },
  blaster: {
    goalZh: '移动战机，击落正确答案。',
    goalEn: 'Move the blaster and shoot the correct answer.',
    stepsZh: ['看算式', '拖动或 WASD 移动', '空格/点击发射'],
    stepsEn: ['Read the expression', 'Drag or use WASD', 'Click or press Space'],
    learnZh: '复杂算式需要先乘除，再加减。',
    learnEn: 'Mixed operations need order of operations.',
    visual: 'blaster',
  },
  snake: {
    goalZh: '只吃目标数的倍数。',
    goalEn: 'Eat only multiples of the target number.',
    stepsZh: ['看目标因子', '方向键控制路线', '吃倍数，避开干扰'],
    stepsEn: ['Read the factor', 'Steer with arrows', 'Eat multiples and avoid decoys'],
    learnZh: '倍数判断变成路径规划。',
    learnEn: 'Multiple recognition becomes route planning.',
    visual: 'snake',
  },
  tetra: {
    goalZh: '移动下落数字，让某一列和刚好等于目标。',
    goalEn: 'Drop numbers so one lane sum equals the target.',
    stepsZh: ['看列目标', '左右移动方块', '让列和刚好命中'],
    stepsEn: ['Read the lane target', 'Move the falling block', 'Hit the exact lane sum'],
    learnZh: '加法组合和超额风险一起训练。',
    learnEn: 'Addition strategy trains exact sums and overshoot control.',
    visual: 'tetra',
  },
  creature: {
    goalZh: '收集能量，刚好凑出攻击值。',
    goalEn: 'Collect energy to match the attack value exactly.',
    stepsZh: ['看目标伤害', '移动能量核心', '凑够就发动攻击'],
    stepsEn: ['Read target damage', 'Move the energy core', 'Attack when the sum matches'],
    learnZh: '加法分解、估算和停止时机合在一起。',
    learnEn: 'Number composition, estimation, and timing work together.',
    visual: 'duel',
  },
  maze: {
    goalZh: '在迷宫里收集目标数的因数。',
    goalEn: 'Collect factors of the target inside the maze.',
    stepsZh: ['看目标数', '方向键走格子', '收集 3 个因数'],
    stepsEn: ['Read the target number', 'Move through the grid', 'Collect three factors'],
    learnZh: '因数是能整除目标数的数字。',
    learnEn: 'Factors divide the target with no remainder.',
    visual: 'maze',
  },
  pinball: {
    goalZh: '控制挡板，让弹球击中正确砖块。',
    goalEn: 'Move the paddle so the ball hits the answer brick.',
    stepsZh: ['看算式', '左右移动挡板', '反弹命中答案砖'],
    stepsEn: ['Read the expression', 'Move the paddle', 'Bounce into the answer brick'],
    learnZh: '算式判断和物理反弹同时发生。',
    learnEn: 'Equation judgment connects with bounce timing.',
    visual: 'pinball',
  },
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

const candyColors = ['#38bdf8', '#f97316', '#84cc16', '#f472b6', '#facc15', '#c084fc', '#2dd4bf', '#fb7185']

function pickColor(seed = 0) {
  return candyColors[Math.abs(seed) % candyColors.length]
}

function makeObjective(id: TemplateId, level: number, round: number): Objective {
  if (id === 'starship') {
    const a = 6 + ((round + level * 2) % 9)
    const b = 4 + ((round * 3 + level) % 8)
    const c = 3 + ((round * 5 + level) % 11)
    const target = a * b - c
    const expression = `${a} x ${b} - ${c}`
    return {
      promptZh: `只看屏幕：拦截 ${expression} 的结果`,
      promptEn: `Screen only: intercept ${expression}`,
      target,
      expression,
      a,
      b,
      c,
    }
  }

  if (id === 'geometry') {
    const target = [18, 24, 30, 36, 42, 48, 54, 60][round % 8]
    return {
      promptZh: `拖出面积 ${target} 的建筑`,
      promptEn: `Build a rectangle with area ${target}`,
      target,
    }
  }

  if (id === 'coaster') {
    const target = 145 + ((round * 53 + level * 29) % 210)
    return {
      promptZh: `调整轨道穿过高度 ${target} 的光门`,
      promptEn: `Shape the track through the gate at height ${target}`,
      target,
    }
  }

  if (id === 'circuit') {
    const current = [2, 3, 4, 5][round % 4]
    const r = [3, 4, 5, 6, 7, 8][(round + level) % 6]
    return {
      promptZh: `电流 ${current}A，拖入电阻让电压变成 ${current * r}V`,
      promptEn: `${current}A current. Drag resistance for ${current * r}V`,
      target: current * r,
      current,
    }
  }

  if (id === 'fraction') {
    const pairs = [
      [1, 4],
      [1, 3],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 5],
      [4, 5],
    ]
    const [num, den] = pairs[round % pairs.length]
    return {
      promptZh: `旋转刀片切出 ${num}/${den}`,
      promptEn: `Rotate the blade to cut ${num}/${den}`,
      target: (num / den) * Math.PI * 2,
      num,
      den,
    }
  }

  const requiredBonds = [2, 3, 4, 5][round % 4]
  if (id === 'molecule') {
    return {
      promptZh: `拖拽原子，形成 ${requiredBonds} 条稳定键`,
      promptEn: `Drag atoms to create ${requiredBonds} stable bonds`,
      target: requiredBonds,
    }
  }

  if (id === 'blaster') {
    const a = 7 + ((round * 2 + level) % 9)
    const b = 5 + ((round + level * 3) % 8)
    const c = 4 + ((round * 4 + level) % 10)
    const target = a * b + c
    const expression = `${a} x ${b} + ${c}`
    return {
      promptZh: `击落 ${expression} 的陨石`,
      promptEn: `Blast the asteroid for ${expression}`,
      target,
      expression,
      a,
      b,
      c,
    }
  }

  if (id === 'snake') {
    const factor = [6, 7, 8, 9, 11, 12][round % 6]
    return {
      promptZh: `只吃 ${factor} 的倍数`,
      promptEn: `Eat multiples of ${factor}`,
      target: factor,
      expression: `x % ${factor} = 0`,
    }
  }

  if (id === 'tetra') {
    const target = [18, 21, 24, 27, 30, 33, 36, 40][round % 8]
    return {
      promptZh: `让任意列的和正好等于 ${target}`,
      promptEn: `Make any lane sum exactly ${target}`,
      target,
      expression: `lane = ${target}`,
    }
  }

  if (id === 'creature') {
    const target = [24, 28, 32, 36, 42, 48][round % 6]
    return {
      promptZh: `收集能量，凑出 ${target} 点攻击`,
      promptEn: `Collect energy for a ${target} damage attack`,
      target,
      expression: `attack ${target}`,
    }
  }

  if (id === 'maze') {
    const target = [24, 30, 36, 42, 48, 54, 60, 72][round % 8]
    return {
      promptZh: `收集 ${target} 的因数`,
      promptEn: `Collect factors of ${target}`,
      target,
      expression: `factor of ${target}`,
    }
  }

  const a = 8 + ((round + level) % 8)
  const b = 5 + ((round * 2 + level) % 7)
  const c = 2 + (round % 6)
  const target = a * b - c
  return {
    promptZh: `弹球击中 ${a} x ${b} - ${c}`,
    promptEn: `Bounce into ${a} x ${b} - ${c}`,
    target,
    expression: `${a} x ${b} - ${c}`,
    a,
    b,
    c,
  }
}

function makeChips(objective: Objective): Chip[] {
  const current = objective.current ?? 2
  const correct = objective.target / current
  const values = Array.from(new Set([correct, correct + 1, Math.max(1, correct - 1), correct + 3])).slice(0, 4)
  return values.map((r, index) => ({
    id: index,
    r,
    x: 140 + index * 140,
    y: 420,
    homeX: 140 + index * 140,
    homeY: 420,
  }))
}

function makeAtoms(requiredBonds: number): Atom[] {
  const atoms: Atom[] = [
    { id: 0, label: 'O', x: 460, y: 255, vx: 0, vy: 0, radius: 36, color: '#2dd4bf' },
    { id: 1, label: 'H', x: 255, y: 190, vx: 18, vy: -10, radius: 24, color: '#bae6fd' },
    { id: 2, label: 'H', x: 690, y: 190, vx: -16, vy: 14, radius: 24, color: '#bae6fd' },
    { id: 3, label: 'C', x: 255, y: 370, vx: 14, vy: 16, radius: 30, color: '#fef3c7' },
    { id: 4, label: 'N', x: 690, y: 370, vx: -18, vy: -12, radius: 30, color: '#c4b5fd' },
  ]
  return atoms.slice(0, Math.min(5, requiredBonds + 2))
}

function makeTargets(objective: Objective, count: number, fromTop = false): Pod[] {
  const target = objective.target
  const offsets = [0, 3, -4, 7, -9, 11, -13, 16, -18, 21]
  return Array.from({ length: count }, (_, index) => {
    const value = Math.max(1, target + offsets[index % offsets.length] + (index > 5 ? index : 0))
    return {
      x: fromTop ? rand(90, width - 90) : width + index * 96,
      y: fromTop ? -60 - index * 72 : rand(90, height - 120),
      vx: fromTop ? rand(-20, 20) : -rand(115, 185),
      vy: fromTop ? rand(80, 150) : rand(-22, 22),
      value,
      good: value === target,
      radius: fromTop ? 28 : 30,
      color: pickColor(index + value),
    }
  })
}

function makeFood(objective: Objective): Pod[] {
  const factor = objective.target
  const values = [factor * 2, factor * 3, factor + 1, factor * 4, factor * 5 - 1, factor * 6]
  const cells = [
    { x: 2, y: 1 },
    { x: 7, y: 1 },
    { x: 13, y: 1 },
    { x: 3, y: 5 },
    { x: 10, y: 7 },
    { x: 14, y: 9 },
  ]
  return values.map((value, index) => ({
    x: snakeOriginX + cells[index].x * snakeCellW + snakeCellW / 2,
    y: snakeOriginY + cells[index].y * snakeCellH + snakeCellH / 2,
    vx: 0,
    vy: 0,
    value,
    good: value % factor === 0,
    radius: 24,
    color: pickColor(index + value),
  }))
}

function makeFallingBlock(round: number): FallingBlock {
  const value = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12][round % 10]
  return {
    x: 2,
    y: 0,
    value,
    color: pickColor(value + round),
  }
}

function makeMazeItems(objective: Objective): MazeItem[] {
  const target = objective.target
  const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18]
  return values.map((value, index) => ({
    x: 1 + (index % 6),
    y: 1 + Math.floor(index / 6) * 3,
    value,
    good: target % value === 0,
    color: pickColor(value + index),
  }))
}

function makeBricks(objective: Objective): Brick[] {
  const target = objective.target
  const offsets = [0, 4, -5, 8, -11, 13, -17, 20, 23, -25, 29, -31]
  return offsets.map((offset, index) => {
    const value = Math.max(1, target + offset)
    return {
      x: 110 + (index % 6) * 128,
      y: 96 + Math.floor(index / 6) * 68,
      value,
      good: value === target,
      alive: true,
      color: pickColor(index + value),
    }
  })
}

function makeArcade(id: TemplateId, objective: Objective, round: number): Arcade {
  return {
    aimX: width / 2,
    aimY: 120,
    playerX: width / 2,
    playerY: height - 72,
    cooldown: 0,
    shots: [],
    targets: id === 'blaster' || id === 'creature' ? makeTargets(objective, 7, true) : [],
    snake: [
      { x: 7, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 5 },
    ],
    snakeDir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: id === 'snake' ? makeFood(objective) : [],
    snakeTimer: 0,
    falling: id === 'tetra' ? makeFallingBlock(round) : null,
    lanes: [0, 0, 0, 0, 0, 0],
    dropTimer: 0,
    creatureX: 155,
    creatureY: 330,
    enemyHp: 100,
    energy: 0,
    mazePlayer: { x: 0, y: 0 },
    mazeItems: id === 'maze' ? makeMazeItems(objective) : [],
    mazePulse: 0,
    ballX: width / 2,
    ballY: 330,
    ballVx: 180,
    ballVy: -210,
    paddleX: width / 2,
    bricks: id === 'pinball' ? makeBricks(objective) : [],
  }
}

function makeSim(id: TemplateId, level = 1): Sim {
  const objective = makeObjective(id, level, 0)
  return {
    id,
    round: 0,
    level,
    score: 0,
    streak: 0,
    startedAt: Date.now(),
    pendingRecord: null,
    pendingPenalty: null,
    objective,
    messageZh: '',
    messageEn: '',
    messageTimer: 0,
    drag: 'none',
    dragId: -1,
    mouse: { x: width / 2, y: height / 2, down: false },
    keys: new Set(),
    particles: [],
    pods: [],
    spawnTimer: 0,
    ship: { x: 150, y: 260, tx: 150, ty: 260, boost: 0 },
    geometry: { w: 4, h: 5, built: 0, settled: false },
    coaster: { handleX: 455, handleY: 150, cartT: 0, flash: 0 },
    circuit: { chips: makeChips(objective), socketR: null, pulse: 0 },
    fraction: { angle: Math.PI / 2, sliced: 0, spin: 0 },
    molecule: { atoms: makeAtoms(objective.target), requiredBonds: objective.target, stableTimer: 0 },
    arcade: makeArcade(id, objective, 0),
  }
}

function useArcadeAudio() {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = () => {
    if (typeof window === 'undefined') return null
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    contextRef.current ??= new (audioWindow.AudioContext || audioWindow.webkitAudioContext || AudioContext)()
    if (contextRef.current.state === 'suspended') {
      void contextRef.current.resume()
    }
    return contextRef.current
  }

  const tone = useCallback((notes: number[], type: OscillatorType, gainValue: number) => {
    const ctx = getContext()
    if (!ctx) return
    notes.forEach((note, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = note
      const start = ctx.currentTime + index * 0.055
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.25)
    })
  }, [])

  const success = useCallback(() => tone([392, 523, 659, 784], 'triangle', 0.12), [tone])
  const missTone = useCallback(() => tone([196, 146], 'sawtooth', 0.055), [tone])
  const move = useCallback(() => tone([330, 440], 'sine', 0.045), [tone])

  return useMemo(() => ({ success, miss: missTone, move }), [success, missTone, move])
}

function makeHud(sim: Sim): Hud {
  return {
    score: sim.score,
    streak: sim.streak,
    level: sim.level,
    promptZh: sim.objective.promptZh,
    promptEn: sim.objective.promptEn,
    messageZh: sim.messageZh,
    messageEn: sim.messageEn,
  }
}

function addBurst(sim: Sim, x: number, y: number, color: string) {
  for (let i = 0; i < 26; i += 1) {
    const angle = rand(0, Math.PI * 2)
    const speed = rand(90, 260)
    sim.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.35, 0.75),
      color,
    })
  }
}

function knowledgeText(sim: Sim) {
  const o = sim.objective
  const expression = o.expression?.replaceAll('x', '×')
  if (sim.id === 'geometry') return `${sim.geometry.w}×${sim.geometry.h}=${sim.geometry.w * sim.geometry.h}`
  if (sim.id === 'coaster') return `y≈${o.target}: graph hits gate`
  if (sim.id === 'circuit') return `${o.current}A×${sim.circuit.socketR}Ω=${o.target}V`
  if (sim.id === 'fraction') return `${o.num}/${o.den} of a circle`
  if (sim.id === 'molecule') return `${getBondCount(sim.molecule.atoms)} stable bonds`
  if (sim.id === 'snake') return `multiple rule: n÷${o.target} has no remainder`
  if (sim.id === 'tetra') return `lane sum=${o.target}`
  if (sim.id === 'creature') return `${sim.arcade.energy}=${o.target} attack`
  if (sim.id === 'maze') return `factors divide ${o.target}`
  return expression ? `${expression}=${o.target}` : `${o.target}`
}

function addKnowledgeBurst(sim: Sim, color: string) {
  const text = knowledgeText(sim)
  sim.particles.push({
    x: clamp(sim.mouse.x - 95, 80, width - 300),
    y: clamp(sim.mouse.y - 34, 96, height - 90),
    vx: 0,
    vy: -46,
    life: 1.45,
    color,
    text,
    size: text.length > 26 ? 24 : 30,
  })
}

function advance(sim: Sim, zh: string, en: string, color: string, audio: ReturnType<typeof useArcadeAudio>) {
  addBurst(sim, sim.mouse.x, sim.mouse.y, color)
  addKnowledgeBurst(sim, color)
  sim.score += 120 + sim.streak * 25
  sim.streak += 1
  sim.round += 1
  sim.level = 1 + Math.floor(sim.round / 4)
  sim.pendingRecord = {
    templateId: sim.id,
    score: sim.score,
    streak: sim.streak,
    level: sim.level,
    round: sim.round,
    duration: Math.max(1, Math.round((Date.now() - sim.startedAt) / 1000)),
  }
  sim.startedAt = Date.now()
  sim.objective = makeObjective(sim.id, sim.level, sim.round)
  sim.messageZh = zh
  sim.messageEn = en
  sim.messageTimer = 1.4
  sim.geometry.settled = false
  sim.circuit.socketR = null
  sim.circuit.chips = makeChips(sim.objective)
  sim.fraction.sliced = 0
  sim.molecule.requiredBonds = sim.objective.target
  sim.molecule.atoms = makeAtoms(sim.molecule.requiredBonds)
  sim.molecule.stableTimer = 0
  sim.arcade = makeArcade(sim.id, sim.objective, sim.round)
  audio.success()
}

function miss(sim: Sim, zh: string, en: string, audio: ReturnType<typeof useArcadeAudio>) {
  const scorePenalty = Math.min(95, 35 + sim.level * 8 + Math.floor(sim.score * 0.04))
  sim.score = Math.max(0, sim.score - scorePenalty)
  sim.streak = 0
  sim.messageZh = zh
  sim.messageEn = en
  sim.messageTimer = 1.1
  sim.pendingPenalty = {
    templateId: sim.id,
    penalty: Math.max(4, Math.round(scorePenalty / 5)),
    reason: zh,
    score: sim.score,
  }
  audio.miss()
}

function spawnPods(sim: Sim) {
  const target = sim.objective.target
  const values = [target, target + 3, Math.max(1, target - 5), target + 8, Math.max(1, target - 11), target + 13]
  const value = values[Math.floor(Math.random() * values.length)]
  sim.pods.push({
    x: width + 40,
    y: rand(86, height - 86),
    vx: -rand(155, 235) - sim.level * 9,
    vy: rand(-34, 34),
    value,
    good: value === target,
    radius: 30,
    color: pickColor(value + sim.pods.length),
  })
}

function getCoasterPoint(sim: Sim, t: number) {
  const p0 = { x: 80, y: 400 }
  const p1 = { x: sim.coaster.handleX, y: sim.coaster.handleY }
  const p2 = { x: 840, y: 250 }
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
  return { x, y }
}

function getBondCount(atoms: Atom[]) {
  let bonds = 0
  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      if (dist(atoms[i].x, atoms[i].y, atoms[j].x, atoms[j].y) < atoms[i].radius + atoms[j].radius + 20) {
        bonds += 1
      }
    }
  }
  return bonds
}

function shoot(sim: Sim) {
  const dx = sim.arcade.aimX - sim.arcade.playerX
  const dy = sim.arcade.aimY - sim.arcade.playerY
  const len = Math.max(1, Math.hypot(dx, dy))
  sim.arcade.shots.push({
    x: sim.arcade.playerX,
    y: sim.arcade.playerY - 18,
    vx: (dx / len) * 520,
    vy: (dy / len) * 520,
    life: 1.5,
  })
}

function updateBlaster(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  const arcade = sim.arcade
  const speed = 340
  if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) arcade.playerX -= speed * dt
  if (sim.keys.has('ArrowRight') || sim.keys.has('d')) arcade.playerX += speed * dt
  if (sim.keys.has('ArrowUp') || sim.keys.has('w')) arcade.playerY -= speed * dt
  if (sim.keys.has('ArrowDown') || sim.keys.has('s')) arcade.playerY += speed * dt
  arcade.playerX = clamp(arcade.playerX, 58, width - 58)
  arcade.playerY = clamp(arcade.playerY, 180, height - 44)
  arcade.cooldown -= dt
  if ((sim.keys.has(' ') || sim.mouse.down) && arcade.cooldown <= 0) {
    shoot(sim)
    arcade.cooldown = 0.18
    audio.move()
  }
  arcade.shots = arcade.shots
    .map((shot) => ({ ...shot, x: shot.x + shot.vx * dt, y: shot.y + shot.vy * dt, life: shot.life - dt }))
    .filter((shot) => shot.life > 0 && shot.x > -40 && shot.x < width + 40 && shot.y > -60 && shot.y < height + 60)

  if (arcade.targets.length < 8) {
    arcade.targets.push(...makeTargets(sim.objective, 2, true))
  }
  for (const target of arcade.targets) {
    target.x += target.vx * dt
    target.y += target.vy * dt
    if (target.y > height + 70) {
      target.y = -70
      target.x = rand(90, width - 90)
      target.value = Math.max(1, sim.objective.target + [0, 5, -7, 9, -12][Math.floor(rand(0, 5))])
      target.good = target.value === sim.objective.target
      target.color = pickColor(target.value)
    }
  }
  for (const shot of arcade.shots) {
    const hit = arcade.targets.find((target) => dist(shot.x, shot.y, target.x, target.y) < target.radius + 8)
    if (!hit) continue
    sim.mouse.x = hit.x
    sim.mouse.y = hit.y
    if (hit.good) {
      advance(sim, '击落正确目标', 'Correct target destroyed', '#f97316', audio)
    } else {
      miss(sim, '击中了干扰目标', 'Decoy target hit', audio)
      addBurst(sim, hit.x, hit.y, '#fb7185')
      arcade.targets = arcade.targets.filter((target) => target !== hit)
    }
    shot.life = 0
    break
  }
}

function foodCell(food: Pod): Cell {
  return {
    x: Math.round((food.x - snakeOriginX - snakeCellW / 2) / snakeCellW),
    y: Math.round((food.y - snakeOriginY - snakeCellH / 2) / snakeCellH),
  }
}

function resetSnakeRun(sim: Sim) {
  sim.arcade.snake = [
    { x: 7, y: 5 },
    { x: 6, y: 5 },
    { x: 5, y: 5 },
  ]
  sim.arcade.snakeDir = { x: 1, y: 0 }
  sim.arcade.nextDir = { x: 1, y: 0 }
  sim.arcade.food = makeFood(sim.objective)
  sim.arcade.snakeTimer = 0
  sim.arcade.cooldown = 0.55
}

function updateSnake(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  const arcade = sim.arcade
  if (arcade.cooldown > 0) {
    arcade.cooldown -= dt
    return
  }
  const dir = arcade.nextDir
  if (dir.x !== -arcade.snakeDir.x || dir.y !== -arcade.snakeDir.y) {
    arcade.snakeDir = dir
  }
  arcade.snakeTimer += dt
  if (arcade.snakeTimer < Math.max(0.16, 0.34 - sim.level * 0.018)) return
  arcade.snakeTimer = 0
  const head = arcade.snake[0]
  const next = {
    x: head.x + arcade.snakeDir.x,
    y: head.y + arcade.snakeDir.y,
  }
  const bodyHit = arcade.snake.some((part, index) => index > 0 && part.x === next.x && part.y === next.y)
  const wallHit = next.x < 0 || next.x >= snakeCols || next.y < 0 || next.y >= snakeRows

  if (wallHit || bodyHit) {
    sim.mouse.x = snakeOriginX + head.x * snakeCellW + snakeCellW / 2
    sim.mouse.y = snakeOriginY + head.y * snakeCellH + snakeCellH / 2
    miss(sim, wallHit ? '撞到边界，重新出发' : '撞到自己，重新出发', wallHit ? 'Wall hit. Restart from a safe lane.' : 'Body hit. Restart from a safe lane.', audio)
    resetSnakeRun(sim)
    return
  }

  arcade.snake.unshift(next)
  const food = arcade.food.find((item) => {
    const cell = foodCell(item)
    return cell.x === next.x && cell.y === next.y
  })
  if (food) {
    sim.mouse.x = food.x
    sim.mouse.y = food.y
    if (food.good) {
      advance(sim, '吃到正确倍数', 'Correct multiple eaten', '#84cc16', audio)
    } else {
      miss(sim, '吃到了不是倍数的诱饵', 'A non-multiple decoy was eaten', audio)
      resetSnakeRun(sim)
    }
  } else {
    arcade.snake.pop()
  }
}

function updateTetra(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  const arcade = sim.arcade
  if (!arcade.falling) arcade.falling = makeFallingBlock(sim.round + arcade.dropTimer)
  const block = arcade.falling
  arcade.cooldown -= dt
  if (arcade.cooldown <= 0) {
    if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) {
      block.x = clamp(block.x - 1, 0, 5)
      arcade.cooldown = 0.12
    }
    if (sim.keys.has('ArrowRight') || sim.keys.has('d')) {
      block.x = clamp(block.x + 1, 0, 5)
      arcade.cooldown = 0.12
    }
  }
  block.y += (sim.keys.has('ArrowDown') || sim.keys.has('s') ? 5.8 : 1.7 + sim.level * 0.12) * dt
  if (block.y >= 7) {
    arcade.lanes[block.x] += block.value
    sim.mouse.x = 185 + block.x * 105
    sim.mouse.y = 430
    if (arcade.lanes[block.x] === sim.objective.target) {
      advance(sim, '列和命中目标', 'Lane sum hit the target', '#60a5fa', audio)
    } else if (arcade.lanes[block.x] > sim.objective.target) {
      arcade.lanes[block.x] = 0
      miss(sim, '这一列超出目标，被清空', 'Lane exceeded target and cleared', audio)
    }
    arcade.dropTimer += 1
    arcade.falling = makeFallingBlock(sim.round + arcade.dropTimer)
  }
}

function updateCreature(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  const arcade = sim.arcade
  const speed = 260
  if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) arcade.creatureX -= speed * dt
  if (sim.keys.has('ArrowRight') || sim.keys.has('d')) arcade.creatureX += speed * dt
  if (sim.keys.has('ArrowUp') || sim.keys.has('w')) arcade.creatureY -= speed * dt
  if (sim.keys.has('ArrowDown') || sim.keys.has('s')) arcade.creatureY += speed * dt
  arcade.creatureX = clamp(arcade.creatureX, 64, width - 64)
  arcade.creatureY = clamp(arcade.creatureY, 96, height - 64)
  if (arcade.targets.length < 7) arcade.targets = makeTargets(sim.objective, 7, true)
  for (const target of arcade.targets) {
    target.y += (65 + sim.level * 8) * dt
    target.x += Math.sin((target.y + target.value) * 0.02) * 28 * dt
    if (target.y > height + 40) {
      target.y = -40
      target.x = rand(90, width - 90)
    }
  }
  const hit = arcade.targets.find((target) => dist(arcade.creatureX, arcade.creatureY, target.x, target.y) < 48)
  if (!hit) return
  arcade.energy += hit.value
  sim.mouse.x = hit.x
  sim.mouse.y = hit.y
  addBurst(sim, hit.x, hit.y, hit.color ?? '#f472b6')
  arcade.targets = arcade.targets.filter((target) => target !== hit)
  if (arcade.energy === sim.objective.target) {
    arcade.enemyHp = Math.max(0, arcade.enemyHp - 34)
    advance(sim, '伤害值刚好命中，发动攻击', 'Exact damage charged. Attack launched', '#f472b6', audio)
  } else if (arcade.energy > sim.objective.target) {
    arcade.energy = 0
    miss(sim, '能量超载，攻击失败', 'Energy overloaded', audio)
  }
}

function updateMaze(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  const arcade = sim.arcade
  arcade.mazePulse += dt
  arcade.cooldown -= dt
  if (arcade.cooldown > 0) return
  const move = { x: 0, y: 0 }
  if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) move.x = -1
  if (sim.keys.has('ArrowRight') || sim.keys.has('d')) move.x = 1
  if (sim.keys.has('ArrowUp') || sim.keys.has('w')) move.y = -1
  if (sim.keys.has('ArrowDown') || sim.keys.has('s')) move.y = 1
  if (!move.x && !move.y) return
  const nx = clamp(arcade.mazePlayer.x + move.x, 0, 7)
  const ny = clamp(arcade.mazePlayer.y + move.y, 0, 5)
  if ((nx === 3 && ny < 5) || (ny === 2 && nx > 1 && nx < 7)) {
    arcade.cooldown = 0.12
    return
  }
  arcade.mazePlayer = { x: nx, y: ny }
  arcade.cooldown = 0.16
  const item = arcade.mazeItems.find((candidate) => candidate.x === nx && candidate.y === ny)
  if (!item) return
  sim.mouse.x = 120 + nx * 90
  sim.mouse.y = 105 + ny * 62
  if (item.good) {
    arcade.energy += 1
    arcade.mazeItems = arcade.mazeItems.filter((candidate) => candidate !== item)
    if (arcade.energy >= 3) {
      advance(sim, '收集到足够因数，迷宫开启', 'Enough factors collected. Gate opened', '#facc15', audio)
    } else {
      addBurst(sim, sim.mouse.x, sim.mouse.y, '#facc15')
      audio.success()
    }
  } else {
    arcade.energy = 0
    miss(sim, '这不是目标数的因数', 'That value is not a factor', audio)
  }
}

function updatePinball(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  const arcade = sim.arcade
  if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) arcade.paddleX -= 390 * dt
  if (sim.keys.has('ArrowRight') || sim.keys.has('d')) arcade.paddleX += 390 * dt
  arcade.paddleX = clamp(arcade.paddleX, 90, width - 90)
  arcade.ballX += arcade.ballVx * dt
  arcade.ballY += arcade.ballVy * dt
  if (arcade.ballX < 28 || arcade.ballX > width - 28) arcade.ballVx *= -1
  if (arcade.ballY < 56) arcade.ballVy *= -1
  if (arcade.ballY > height - 56 && Math.abs(arcade.ballX - arcade.paddleX) < 92) {
    arcade.ballVy = -Math.abs(arcade.ballVy) - 18
    arcade.ballVx += (arcade.ballX - arcade.paddleX) * 2.4
    audio.move()
  }
  if (arcade.ballY > height + 50) {
    arcade.ballX = width / 2
    arcade.ballY = 330
    arcade.ballVx = rand(-210, 210)
    arcade.ballVy = -230
    miss(sim, '弹球漏掉了，重新发球', 'Ball lost. Relaunching', audio)
  }
  const brick = arcade.bricks.find((candidate) => candidate.alive && Math.abs(arcade.ballX - candidate.x) < 56 && Math.abs(arcade.ballY - candidate.y) < 28)
  if (!brick) return
  brick.alive = false
  arcade.ballVy *= -1
  sim.mouse.x = brick.x
  sim.mouse.y = brick.y
  if (brick.good) {
    advance(sim, '弹球击中正确砖块', 'Correct brick hit', '#c084fc', audio)
  } else {
    miss(sim, '击中了干扰砖块', 'Decoy brick hit', audio)
    addBurst(sim, brick.x, brick.y, '#fb7185')
  }
}

function updateSim(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  if (sim.messageTimer > 0) {
    sim.messageTimer -= dt
    if (sim.messageTimer <= 0) {
      sim.messageZh = ''
      sim.messageEn = ''
    }
  }

  sim.particles = sim.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vy: particle.text ? particle.vy - 8 * dt : particle.vy + 180 * dt,
      life: particle.life - dt,
    }))
    .filter((particle) => particle.life > 0)

  if (sim.id === 'starship') {
    const speed = 280
    if (sim.keys.has('ArrowUp') || sim.keys.has('w')) sim.ship.ty -= speed * dt
    if (sim.keys.has('ArrowDown') || sim.keys.has('s')) sim.ship.ty += speed * dt
    if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) sim.ship.tx -= speed * dt
    if (sim.keys.has('ArrowRight') || sim.keys.has('d')) sim.ship.tx += speed * dt
    sim.ship.tx = clamp(sim.ship.tx, 46, width - 80)
    sim.ship.ty = clamp(sim.ship.ty, 70, height - 70)
    sim.ship.x += (sim.ship.tx - sim.ship.x) * Math.min(1, dt * 10)
    sim.ship.y += (sim.ship.ty - sim.ship.y) * Math.min(1, dt * 10)
    sim.spawnTimer -= dt
    if (sim.spawnTimer <= 0 || sim.pods.length < 3) {
      spawnPods(sim)
      sim.spawnTimer = rand(0.7, 1.05)
    }
    sim.pods = sim.pods.filter((pod) => {
      pod.x += pod.vx * dt
      pod.y += pod.vy * dt
      pod.y = clamp(pod.y, 70, height - 70)
      if (dist(sim.ship.x + 24, sim.ship.y, pod.x, pod.y) < pod.radius + 30) {
        if (pod.good) {
          sim.mouse.x = pod.x
          sim.mouse.y = pod.y
          advance(sim, '命中正确能量球', 'Correct pod intercepted', '#38bdf8', audio)
          sim.pods = []
        } else {
          miss(sim, '撞到了错误能量球', 'Wrong pod hit', audio)
          addBurst(sim, pod.x, pod.y, '#fb7185')
        }
        return false
      }
      return pod.x > -60
    })
  }

  if (sim.id === 'geometry') {
    const area = sim.geometry.w * sim.geometry.h
    if (area === sim.objective.target && !sim.geometry.settled) {
      sim.geometry.settled = true
      sim.geometry.built += 1
      sim.mouse.x = 520
      sim.mouse.y = 260
      advance(sim, '建筑面积匹配，城市扩建完成', 'Area matched. City block built', '#f59e0b', audio)
    }
    if (area !== sim.objective.target) {
      sim.geometry.settled = false
    }
  }

  if (sim.id === 'coaster') {
    sim.coaster.cartT += dt * (0.18 + sim.level * 0.015)
    if (sim.coaster.cartT > 1) sim.coaster.cartT = 0
    const gateT = 0.76
    const p = getCoasterPoint(sim, gateT)
    const nearGate = Math.abs(sim.coaster.cartT - gateT) < 0.015
    const targetY = sim.objective.target
    if (nearGate) {
      if (Math.abs(p.y - targetY) < 18) {
        sim.mouse.x = p.x
        sim.mouse.y = p.y
        sim.coaster.cartT = 0
        advance(sim, '轨道穿过目标光门', 'Track crossed the target gate', '#fb7185', audio)
      } else {
        sim.coaster.flash = 0.4
        miss(sim, '轨道高度偏离光门', 'Track missed the gate height', audio)
      }
    }
    sim.coaster.flash = Math.max(0, sim.coaster.flash - dt)
  }

  if (sim.id === 'circuit') {
    sim.circuit.pulse += dt
  }

  if (sim.id === 'fraction') {
    sim.fraction.spin += dt * 0.7
  }

  if (sim.id === 'molecule') {
    for (const atom of sim.molecule.atoms) {
      if (sim.drag === 'atom' && sim.dragId === atom.id) continue
      atom.x += atom.vx * dt
      atom.y += atom.vy * dt
      if (atom.x < 120 || atom.x > width - 120) atom.vx *= -1
      if (atom.y < 105 || atom.y > height - 80) atom.vy *= -1
      atom.x = clamp(atom.x, 95, width - 95)
      atom.y = clamp(atom.y, 88, height - 70)
    }
    const bonds = getBondCount(sim.molecule.atoms)
    if (bonds === sim.molecule.requiredBonds) {
      sim.molecule.stableTimer += dt
      if (sim.molecule.stableTimer > 0.55) {
        sim.mouse.x = width / 2
        sim.mouse.y = height / 2
        advance(sim, '分子结构稳定', 'Molecular structure stabilized', '#2dd4bf', audio)
      }
    } else {
      sim.molecule.stableTimer = 0
    }
  }

  if (sim.id === 'blaster') updateBlaster(sim, dt, audio)
  if (sim.id === 'snake') updateSnake(sim, dt, audio)
  if (sim.id === 'tetra') updateTetra(sim, dt, audio)
  if (sim.id === 'creature') updateCreature(sim, dt, audio)
  if (sim.id === 'maze') updateMaze(sim, dt, audio)
  if (sim.id === 'pinball') updatePinball(sim, dt, audio)
}

function drawBackground(ctx: CanvasRenderingContext2D, template: Template) {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#050816')
  gradient.addColorStop(0.55, '#111827')
  gradient.addColorStop(1, '#030712')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.18
  ctx.strokeStyle = template.accent
  for (let x = 0; x < width; x += 46) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 46) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawTextPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = '700 18px system-ui, -apple-system, sans-serif'
  const metrics = ctx.measureText(text)
  ctx.fillStyle = 'rgba(0,0,0,.42)'
  ctx.strokeStyle = 'rgba(255,255,255,.14)'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, metrics.width + 30, 42, 16)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fillText(text, x + 15, y + 27)
}

function drawMission(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const text = sim.objective.expression ?? `${sim.objective.target}`
  ctx.fillStyle = 'rgba(0,0,0,.52)'
  ctx.strokeStyle = 'rgba(255,255,255,.16)'
  ctx.lineWidth = 1
  roundRect(ctx, 24, 22, 380, 58, 18)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = template.accent
  ctx.font = '900 13px system-ui, -apple-system, sans-serif'
  ctx.fillText('TARGET', 44, 43)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 25px system-ui, -apple-system, sans-serif'
  ctx.fillText(text, 44, 68)

  if (sim.messageZh) {
    ctx.fillStyle = 'rgba(0,0,0,.52)'
    roundRect(ctx, width - 360, 22, 336, 52, 18)
    ctx.fill()
    ctx.fillStyle = template.accent
    ctx.font = '900 17px system-ui, -apple-system, sans-serif'
    ctx.fillText(sim.messageEn, width - 340, 55)
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawStarship(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  drawTextPill(ctx, 'Drag or WASD. Catch the value, not the color.', 34, 94, '#e0f2fe')
  for (const pod of sim.pods) {
    const color = pod.color ?? template.accent
    const glow = ctx.createRadialGradient(pod.x, pod.y, 4, pod.x, pod.y, pod.radius + 18)
    glow.addColorStop(0, color)
    glow.addColorStop(1, 'rgba(255,255,255,.04)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(pod.x, pod.y, pod.radius + 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(pod.x, pod.y, pod.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#020617'
    ctx.font = '900 22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(pod.value), pod.x, pod.y + 8)
  }

  ctx.save()
  ctx.translate(sim.ship.x, sim.ship.y)
  ctx.fillStyle = template.accent
  ctx.shadowBlur = 28
  ctx.shadowColor = template.accent
  ctx.beginPath()
  ctx.moveTo(52, 0)
  ctx.lineTo(-28, -30)
  ctx.lineTo(-12, 0)
  ctx.lineTo(-28, 30)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#e0f2fe'
  ctx.beginPath()
  ctx.arc(6, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.textAlign = 'left'
}

function drawGeometry(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const cell = 24
  const left = 180
  const bottom = 425
  const w = sim.geometry.w
  const h = sim.geometry.h
  ctx.fillStyle = 'rgba(245,158,11,.12)'
  ctx.fillRect(left, bottom - h * cell, w * cell, h * cell)
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  ctx.strokeRect(left, bottom - h * cell, w * cell, h * cell)
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(255,255,255,.22)'
  for (let i = 1; i < w; i += 1) {
    ctx.beginPath()
    ctx.moveTo(left + i * cell, bottom - h * cell)
    ctx.lineTo(left + i * cell, bottom)
    ctx.stroke()
  }
  for (let i = 1; i < h; i += 1) {
    ctx.beginPath()
    ctx.moveTo(left, bottom - i * cell)
    ctx.lineTo(left + w * cell, bottom - i * cell)
    ctx.stroke()
  }
  ctx.fillStyle = '#fff7ed'
  ctx.font = '900 26px system-ui, sans-serif'
  ctx.fillText(`${w} x ${h} = ${w * h}`, left, bottom + 40)

  const hx = left + w * cell
  const hy = bottom - h * cell
  ctx.fillStyle = template.accent
  ctx.beginPath()
  ctx.arc(hx, hy, 14, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,.08)'
  for (let i = 0; i < sim.geometry.built; i += 1) {
    const x = 590 + i * 44
    const bh = 70 + (i % 4) * 24
    ctx.fillRect(x, bottom - bh, 30, bh)
    ctx.fillStyle = 'rgba(245,158,11,.7)'
    ctx.fillRect(x + 6, bottom - bh + 10, 6, 9)
    ctx.fillRect(x + 18, bottom - bh + 28, 6, 9)
    ctx.fillStyle = 'rgba(255,255,255,.08)'
  }
  drawTextPill(ctx, `Target area ${sim.objective.target}`, 34, 94, '#fef3c7')
}

function drawCoaster(ctx: CanvasRenderingContext2D, sim: Sim) {
  const targetY = sim.objective.target
  ctx.strokeStyle = sim.coaster.flash > 0 ? '#fb7185' : 'rgba(255,255,255,.22)'
  ctx.lineWidth = 3
  ctx.setLineDash([8, 10])
  ctx.beginPath()
  ctx.moveTo(650, targetY)
  ctx.lineTo(860, targetY)
  ctx.stroke()
  ctx.setLineDash([])
  drawTextPill(ctx, `Gate y=${targetY}`, 650, targetY - 62, '#fecdd3')

  ctx.strokeStyle = '#fb7185'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(80, 400)
  ctx.quadraticCurveTo(sim.coaster.handleX, sim.coaster.handleY, 840, 250)
  ctx.stroke()

  ctx.fillStyle = '#fff1f2'
  ctx.beginPath()
  ctx.arc(sim.coaster.handleX, sim.coaster.handleY, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sim.coaster.handleX, sim.coaster.handleY)
  ctx.lineTo(80, 400)
  ctx.moveTo(sim.coaster.handleX, sim.coaster.handleY)
  ctx.lineTo(840, 250)
  ctx.stroke()

  const cart = getCoasterPoint(sim, sim.coaster.cartT)
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, cart.x - 22, cart.y - 16, 44, 32, 10)
  ctx.fill()
  ctx.fillStyle = '#fb7185'
  ctx.beginPath()
  ctx.arc(cart.x - 12, cart.y + 17, 6, 0, Math.PI * 2)
  ctx.arc(cart.x + 12, cart.y + 17, 6, 0, Math.PI * 2)
  ctx.fill()
}

function drawCircuit(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const socket = { x: 460, y: 230 }
  const isLit = sim.circuit.socketR !== null && (sim.objective.current ?? 2) * sim.circuit.socketR === sim.objective.target
  ctx.strokeStyle = isLit ? '#86efac' : 'rgba(255,255,255,.2)'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(120, 230)
  ctx.lineTo(300, 230)
  ctx.moveTo(520, 230)
  ctx.lineTo(780, 230)
  ctx.moveTo(780, 230)
  ctx.lineTo(780, 340)
  ctx.lineTo(120, 340)
  ctx.lineTo(120, 230)
  ctx.stroke()
  ctx.fillStyle = isLit ? '#86efac' : 'rgba(255,255,255,.12)'
  ctx.beginPath()
  ctx.arc(780, 230, 34 + Math.sin(sim.circuit.pulse * 6) * 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#052e16'
  ctx.font = '900 20px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('V', 780, 237)

  ctx.strokeStyle = template.accent
  ctx.lineWidth = 3
  ctx.fillStyle = 'rgba(34,197,94,.16)'
  roundRect(ctx, socket.x - 70, socket.y - 42, 140, 84, 18)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#dcfce7'
  ctx.font = '900 18px system-ui, sans-serif'
  ctx.fillText(sim.circuit.socketR ? `${sim.circuit.socketR} ohm` : 'SOCKET', socket.x, socket.y + 7)
  ctx.textAlign = 'left'

  for (const chip of sim.circuit.chips) {
    ctx.fillStyle = '#ecfdf5'
    roundRect(ctx, chip.x - 44, chip.y - 30, 88, 60, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(34,197,94,.85)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#052e16'
    ctx.font = '900 19px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${chip.r} ohm`, chip.x, chip.y + 7)
  }
  ctx.textAlign = 'left'
  drawTextPill(ctx, `${sim.objective.current}A -> ${sim.objective.target}V`, 34, 94, '#dcfce7')
}

function drawFraction(ctx: CanvasRenderingContext2D, sim: Sim) {
  const cx = width / 2
  const cy = 265
  const radius = 150
  const target = sim.objective.target
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(sim.fraction.spin * 0.12)
  ctx.fillStyle = 'rgba(167,139,250,.18)'
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.22)'
  ctx.lineWidth = 2
  const den = sim.objective.den ?? 4
  for (let i = 0; i < den; i += 1) {
    const angle = (i / den) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(167,139,250,.58)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, radius, 0, target)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(sim.fraction.angle) * 190, cy + Math.sin(sim.fraction.angle) * 190)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx + Math.cos(sim.fraction.angle) * 190, cy + Math.sin(sim.fraction.angle) * 190, 14, 0, Math.PI * 2)
  ctx.fill()
  drawTextPill(ctx, `${sim.objective.num}/${sim.objective.den}`, 34, 94, '#ede9fe')
}

function drawMolecule(ctx: CanvasRenderingContext2D, sim: Sim) {
  const atoms = sim.molecule.atoms
  ctx.lineWidth = 7
  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      const near = dist(atoms[i].x, atoms[i].y, atoms[j].x, atoms[j].y) < atoms[i].radius + atoms[j].radius + 20
      if (!near) continue
      ctx.strokeStyle = 'rgba(45,212,191,.7)'
      ctx.beginPath()
      ctx.moveTo(atoms[i].x, atoms[i].y)
      ctx.lineTo(atoms[j].x, atoms[j].y)
      ctx.stroke()
    }
  }

  for (const atom of atoms) {
    ctx.fillStyle = atom.color
    ctx.shadowColor = atom.color
    ctx.shadowBlur = 24
    ctx.beginPath()
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#082f2e'
    ctx.font = '900 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(atom.label, atom.x, atom.y + 7)
  }
  ctx.textAlign = 'left'
  drawTextPill(ctx, `Bonds ${getBondCount(atoms)} / ${sim.molecule.requiredBonds}`, 34, 94, '#ccfbf1')
}

function drawBlaster(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const arcade = sim.arcade
  drawTextPill(ctx, 'Move WASD / drag. Click or Space to fire.', 34, 94, '#fed7aa')
  for (const target of arcade.targets) {
    const color = target.color ?? template.accent
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 26
    ctx.beginPath()
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2
      const r = target.radius + (i % 2) * 9
      const x = target.x + Math.cos(angle) * r
      const y = target.y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#111827'
    ctx.font = '900 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(target.value), target.x, target.y + 7)
  }
  ctx.strokeStyle = 'rgba(255,255,255,.34)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(arcade.playerX, arcade.playerY)
  ctx.lineTo(arcade.aimX, arcade.aimY)
  ctx.stroke()
  for (const shot of arcade.shots) {
    ctx.fillStyle = '#fff7ed'
    ctx.beginPath()
    ctx.arc(shot.x, shot.y, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.save()
  ctx.translate(arcade.playerX, arcade.playerY)
  ctx.fillStyle = template.accent
  ctx.shadowColor = template.accent
  ctx.shadowBlur = 28
  ctx.beginPath()
  ctx.moveTo(0, -34)
  ctx.lineTo(28, 28)
  ctx.lineTo(0, 12)
  ctx.lineTo(-28, 28)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.textAlign = 'left'
}

function drawSnake(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  drawTextPill(ctx, `Eat multiples of ${sim.objective.target}`, 34, 94, '#ecfccb')
  ctx.strokeStyle = 'rgba(255,255,255,.11)'
  for (let x = 0; x <= snakeCols; x += 1) {
    ctx.beginPath()
    ctx.moveTo(snakeOriginX + x * snakeCellW, snakeOriginY)
    ctx.lineTo(snakeOriginX + x * snakeCellW, snakeOriginY + snakeRows * snakeCellH)
    ctx.stroke()
  }
  for (let y = 0; y <= snakeRows; y += 1) {
    ctx.beginPath()
    ctx.moveTo(snakeOriginX, snakeOriginY + y * snakeCellH)
    ctx.lineTo(snakeOriginX + snakeCols * snakeCellW, snakeOriginY + y * snakeCellH)
    ctx.stroke()
  }
  for (const food of sim.arcade.food) {
    ctx.fillStyle = food.color ?? template.accent
    ctx.beginPath()
    ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#10210a'
    ctx.font = '900 18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(food.value), food.x, food.y + 6)
  }
  sim.arcade.snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? '#bef264' : '#65a30d'
    roundRect(ctx, snakeOriginX + part.x * snakeCellW + 7, snakeOriginY + part.y * snakeCellH + 6, snakeCellW - 14, snakeCellH - 12, 14)
    ctx.fill()
  })
  ctx.textAlign = 'left'
}

function drawTetra(ctx: CanvasRenderingContext2D, sim: Sim) {
  const ox = 155
  const oy = 86
  const laneW = 104
  const floor = 438
  drawTextPill(ctx, `Lane target ${sim.objective.target}`, 34, 94, '#dbeafe')
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = 'rgba(96,165,250,.08)'
    ctx.strokeStyle = 'rgba(255,255,255,.15)'
    roundRect(ctx, ox + i * laneW, oy, laneW - 12, floor - oy, 16)
    ctx.fill()
    ctx.stroke()
    const fillH = clamp((sim.arcade.lanes[i] / sim.objective.target) * 220, 0, 260)
    ctx.fillStyle = sim.arcade.lanes[i] > sim.objective.target ? 'rgba(251,113,133,.75)' : 'rgba(96,165,250,.7)'
    roundRect(ctx, ox + i * laneW + 12, floor - fillH, laneW - 36, fillH, 12)
    ctx.fill()
    ctx.fillStyle = '#eff6ff'
    ctx.font = '900 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(sim.arcade.lanes[i]), ox + i * laneW + 46, floor + 34)
  }
  const block = sim.arcade.falling
  if (block) {
    ctx.fillStyle = block.color
    roundRect(ctx, ox + block.x * laneW + 7, oy + block.y * 48, laneW - 24, 54, 16)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.font = '900 24px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(block.value), ox + block.x * laneW + 46, oy + block.y * 48 + 35)
  }
  ctx.textAlign = 'left'
}

function drawCreature(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const arcade = sim.arcade
  drawTextPill(ctx, `Charge exact damage ${sim.objective.target}`, 34, 94, '#fce7f3')
  ctx.fillStyle = 'rgba(0,0,0,.34)'
  roundRect(ctx, width - 230, 96, 170, 26, 13)
  ctx.fill()
  ctx.fillStyle = '#fb7185'
  roundRect(ctx, width - 230, 96, 170 * (arcade.enemyHp / 100), 26, 13)
  ctx.fill()
  ctx.fillStyle = '#fce7f3'
  ctx.font = '900 16px system-ui, sans-serif'
  ctx.fillText(`Energy ${arcade.energy}`, 34, 140)
  for (const target of arcade.targets) {
    ctx.fillStyle = target.color ?? template.accent
    ctx.beginPath()
    ctx.arc(target.x, target.y, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111827'
    ctx.font = '900 17px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(target.value), target.x, target.y + 6)
  }
  ctx.fillStyle = '#f9a8d4'
  ctx.shadowColor = '#f472b6'
  ctx.shadowBlur = 28
  ctx.beginPath()
  ctx.arc(arcade.creatureX, arcade.creatureY, 38, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#831843'
  ctx.font = '900 22px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('L', arcade.creatureX, arcade.creatureY + 8)
  ctx.textAlign = 'left'
}

function drawMaze(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const ox = 120
  const oy = 105
  const cw = 90
  const ch = 62
  drawTextPill(ctx, `Collect 3 factors of ${sim.objective.target}`, 34, 94, '#fef9c3')
  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const wall = (x === 3 && y < 5) || (y === 2 && x > 1 && x < 7)
      ctx.fillStyle = wall ? 'rgba(250,204,21,.22)' : 'rgba(255,255,255,.05)'
      ctx.strokeStyle = 'rgba(255,255,255,.13)'
      roundRect(ctx, ox + x * cw, oy + y * ch, cw - 8, ch - 8, 12)
      ctx.fill()
      ctx.stroke()
    }
  }
  for (const item of sim.arcade.mazeItems) {
    ctx.fillStyle = item.color
    ctx.beginPath()
    ctx.arc(ox + item.x * cw + 41, oy + item.y * ch + 28, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111827'
    ctx.font = '900 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(item.value), ox + item.x * cw + 41, oy + item.y * ch + 34)
  }
  ctx.fillStyle = template.accent
  const px = ox + sim.arcade.mazePlayer.x * cw + 41
  const py = oy + sim.arcade.mazePlayer.y * ch + 28
  ctx.beginPath()
  ctx.arc(px, py, 25 + Math.sin(sim.arcade.mazePulse * 8) * 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111827'
  ctx.font = '900 13px system-ui, sans-serif'
  ctx.fillText(`${sim.arcade.energy}/3`, px, py + 5)
  ctx.textAlign = 'left'
}

function drawPinball(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const arcade = sim.arcade
  drawTextPill(ctx, `Hit ${sim.objective.expression}`, 34, 94, '#f3e8ff')
  for (const brick of arcade.bricks) {
    if (!brick.alive) continue
    ctx.fillStyle = brick.color
    roundRect(ctx, brick.x - 54, brick.y - 24, 108, 48, 14)
    ctx.fill()
    ctx.fillStyle = '#111827'
    ctx.font = '900 18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(brick.value), brick.x, brick.y + 6)
  }
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = template.accent
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.arc(arcade.ballX, arcade.ballY, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = template.accent
  roundRect(ctx, arcade.paddleX - 88, height - 42, 176, 20, 10)
  ctx.fill()
  ctx.textAlign = 'left'
}

function drawParticles(ctx: CanvasRenderingContext2D, sim: Sim) {
  for (const p of sim.particles) {
    ctx.globalAlpha = clamp(p.life, 0, 1)
    if (p.text) {
      ctx.font = `900 ${p.size ?? 28}px system-ui, -apple-system, sans-serif`
      const metrics = ctx.measureText(p.text)
      ctx.fillStyle = 'rgba(0,0,0,.68)'
      ctx.strokeStyle = p.color
      ctx.lineWidth = 2
      roundRect(ctx, p.x - 16, p.y - 38, metrics.width + 32, 54, 18)
      ctx.fill()
      ctx.stroke()
      ctx.shadowColor = p.color
      ctx.shadowBlur = 26
      ctx.fillStyle = '#ffffff'
      ctx.fillText(p.text, p.x, p.y)
      ctx.shadowBlur = 0
      continue
    }
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawSim(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  drawBackground(ctx, template)
  drawMission(ctx, sim, template)
  if (sim.id === 'starship') drawStarship(ctx, sim, template)
  if (sim.id === 'geometry') drawGeometry(ctx, sim, template)
  if (sim.id === 'coaster') drawCoaster(ctx, sim)
  if (sim.id === 'circuit') drawCircuit(ctx, sim, template)
  if (sim.id === 'fraction') drawFraction(ctx, sim)
  if (sim.id === 'molecule') drawMolecule(ctx, sim)
  if (sim.id === 'blaster') drawBlaster(ctx, sim, template)
  if (sim.id === 'snake') drawSnake(ctx, sim, template)
  if (sim.id === 'tetra') drawTetra(ctx, sim)
  if (sim.id === 'creature') drawCreature(ctx, sim, template)
  if (sim.id === 'maze') drawMaze(ctx, sim, template)
  if (sim.id === 'pinball') drawPinball(ctx, sim, template)
  drawParticles(ctx, sim)
}

function getPointer(canvas: HTMLCanvasElement, event: PointerEvent | React.PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  }
}

function HowToPlayGraphic({ visual, accent }: { visual: string; accent: string }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-2xl border border-white/10 bg-black/35">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:28px_28px]" />
      {visual === 'grid' && (
        <div className="absolute left-12 top-8 grid grid-cols-5 gap-1">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} className="block size-4 rounded-sm" style={{ backgroundColor: accent }} />
          ))}
        </div>
      )}
      {visual === 'curve' && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 144">
          <path d="M28 110 C92 20 176 132 292 40" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" />
          <circle cx="236" cy="64" r="20" fill="none" stroke="#fff" strokeWidth="5" />
        </svg>
      )}
      {visual === 'fraction' && (
        <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/70" style={{ background: `conic-gradient(${accent} 0 90deg, rgba(255,255,255,.08) 90deg 360deg)` }} />
      )}
      {visual === 'circuit' && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 144">
          <path d="M34 72 H112 M204 72 H286 M286 72 V118 H34 V72" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          <rect x="116" y="48" width="88" height="48" rx="14" fill="rgba(255,255,255,.14)" stroke="#fff" />
          <text x="160" y="80" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900">R</text>
        </svg>
      )}
      {visual === 'molecule' && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 144">
          <line x1="160" y1="72" x2="88" y2="42" stroke={accent} strokeWidth="7" />
          <line x1="160" y1="72" x2="238" y2="44" stroke={accent} strokeWidth="7" />
          <line x1="160" y1="72" x2="194" y2="118" stroke={accent} strokeWidth="7" />
          {[ [160,72,'O'], [88,42,'H'], [238,44,'H'], [194,118,'C'] ].map(([x, y, label]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="24" fill={accent} />
              <text x={x} y={Number(y) + 7} textAnchor="middle" fill="#04111d" fontSize="18" fontWeight="900">{label}</text>
            </g>
          ))}
        </svg>
      )}
      {['ship', 'blaster', 'snake', 'tetra', 'duel', 'maze', 'pinball'].includes(visual) && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 144">
          <circle cx="238" cy="48" r="28" fill={accent} />
          <text x="238" y="56" textAnchor="middle" fill="#07111f" fontSize="24" fontWeight="900">50</text>
          <path d="M52 104 L102 72 L52 40 L66 72 Z" fill="#fff" opacity=".92" />
          <path d="M112 72 H194" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeDasharray="16 10" />
          <rect x="42" y="106" width="236" height="12" rx="6" fill="rgba(255,255,255,.16)" />
        </svg>
      )}
    </div>
  )
}

export default function LearningGameShowcase({
  selectedId,
  onActiveChange,
  compact = false,
  lockedTemplate = false,
  completionRounds = 1,
  onComplete,
}: {
  selectedId?: TemplateId
  onActiveChange?: (id: TemplateId) => void
  compact?: boolean
  lockedTemplate?: boolean
  completionRounds?: number
  onComplete?: (record: PendingRecord) => void
} = {}) {
  const { locale } = useLanguage()
  const audio = useArcadeAudio()
  const [activeId, setActiveId] = useState<TemplateId>(selectedId ?? 'starship')
  const activeTemplate = useMemo(() => templates.find((template) => template.id === activeId) ?? templates[0], [activeId])
  const simRef = useRef<Sim>(makeSim(selectedId ?? 'starship'))
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const seenHowToPlayRef = useRef(new Set<TemplateId>())
  const [showHowToPlay, setShowHowToPlay] = useState(true)
  const [hud, setHud] = useState<Hud>(makeHud(simRef.current))
  const how = howToPlay[activeId]
  const showcaseLayoutClass = compact
    ? 'mb-4 grid gap-4'
    : activeId === 'snake'
      ? 'mb-8 grid gap-5 lg:grid-cols-[0.52fr_1.48fr]'
      : 'mb-8 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]'

  const chooseTemplate = useCallback((id: TemplateId) => {
    if (lockedTemplate) return
    setActiveId(id)
    onActiveChange?.(id)
    if (!seenHowToPlayRef.current.has(id)) {
      setShowHowToPlay(true)
    }
    audio.move()
  }, [audio, lockedTemplate, onActiveChange])

  const reset = useCallback((id = activeId) => {
    simRef.current = makeSim(id)
    completedRef.current = false
    setHud(makeHud(simRef.current))
    audio.move()
  }, [activeId, audio])

  useEffect(() => {
    reset(activeId)
  }, [activeId, reset])

  useEffect(() => {
    if (selectedId && selectedId !== activeId) {
      setActiveId(selectedId)
      if (!seenHowToPlayRef.current.has(selectedId)) {
        setShowHowToPlay(true)
      }
    }
  }, [activeId, selectedId])

  const closeHowToPlay = useCallback(() => {
    seenHowToPlayRef.current.add(activeId)
    simRef.current.startedAt = Date.now()
    simRef.current.keys.clear()
    setShowHowToPlay(false)
  }, [activeId])

  const saveShowcaseRecord = useCallback(async (record: PendingRecord) => {
    try {
      const response = await fetch('/api/games/showcase/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      if (!response.ok) return

      const result = await response.json()
      if (result?.saved && (result.earnedPoints > 0 || result.earnedGems > 0)) {
        window.dispatchEvent(
          new CustomEvent('larry:reward-earned', {
            detail: {
              points: Number(result.earnedPoints || 0),
              gems: Number(result.earnedGems || 0),
            },
          })
        )
      }
    } catch (error) {
      console.warn('Unable to save showcase game record', error)
    }
  }, [])

  const saveShowcasePenalty = useCallback(async (penalty: PendingPenalty) => {
    try {
      const response = await fetch('/api/games/showcase/penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(penalty),
      })
      if (!response.ok) return

      const result = await response.json()
      if (result?.saved && result.deductedPoints > 0) {
        window.dispatchEvent(
          new CustomEvent('larry:reward-earned', {
            detail: {
              points: -Number(result.deductedPoints || 0),
              gems: 0,
            },
          })
        )
      }
    } catch (error) {
      console.warn('Unable to save showcase game penalty', error)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const sim = simRef.current
      sim.keys.add(event.key)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault()
      }
      if (sim.id === 'snake') {
        if (event.key === 'ArrowUp' || event.key === 'w') sim.arcade.nextDir = { x: 0, y: -1 }
        if (event.key === 'ArrowDown' || event.key === 's') sim.arcade.nextDir = { x: 0, y: 1 }
        if (event.key === 'ArrowLeft' || event.key === 'a') sim.arcade.nextDir = { x: -1, y: 0 }
        if (event.key === 'ArrowRight' || event.key === 'd') sim.arcade.nextDir = { x: 1, y: 0 }
      }
      if (event.key === ' ' && sim.id === 'fraction') {
        event.preventDefault()
        sliceFraction()
      }
      if (event.key === ' ' && sim.id === 'blaster' && sim.arcade.cooldown <= 0) {
        shoot(sim)
        sim.arcade.cooldown = 0.18
        audio.move()
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      simRef.current.keys.delete(event.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    let hudTimer = 0
    const loop = (time: number) => {
      const dt = Math.min(0.035, (time - last) / 1000)
      last = time
      if (!showHowToPlay) {
        updateSim(simRef.current, dt, audio)
      }
      const record = simRef.current.pendingRecord
      if (record) {
        simRef.current.pendingRecord = null
        void saveShowcaseRecord(record)
        if (onComplete && !completedRef.current && record.round >= Math.max(1, completionRounds)) {
          completedRef.current = true
          window.setTimeout(() => onComplete(record), 420)
        }
      }
      const penalty = simRef.current.pendingPenalty
      if (penalty) {
        simRef.current.pendingPenalty = null
        void saveShowcasePenalty(penalty)
      }
      drawSim(ctx, simRef.current, activeTemplate)
      hudTimer += dt
      if (hudTimer > 0.12) {
        setHud(makeHud(simRef.current))
        hudTimer = 0
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activeTemplate, audio, completionRounds, onComplete, saveShowcasePenalty, saveShowcaseRecord, showHowToPlay])

  const beginDrag = (x: number, y: number) => {
    const sim = simRef.current
    sim.mouse = { x, y, down: true }
    if (sim.id === 'starship' && dist(x, y, sim.ship.x, sim.ship.y) < 90) {
      sim.drag = 'ship'
      sim.ship.tx = x
      sim.ship.ty = y
      return
    }
    if (sim.id === 'geometry') {
      const hx = 180 + sim.geometry.w * 24
      const hy = 425 - sim.geometry.h * 24
      if (dist(x, y, hx, hy) < 36) sim.drag = 'geometry'
      return
    }
    if (sim.id === 'coaster' && dist(x, y, sim.coaster.handleX, sim.coaster.handleY) < 44) {
      sim.drag = 'coaster'
      return
    }
    if (sim.id === 'circuit') {
      const chip = sim.circuit.chips.find((item) => Math.abs(x - item.x) < 52 && Math.abs(y - item.y) < 40)
      if (chip) {
        sim.drag = 'chip'
        sim.dragId = chip.id
      }
      return
    }
    if (sim.id === 'fraction' && dist(x, y, width / 2, 265) < 220) {
      sim.drag = 'blade'
      return
    }
    if (sim.id === 'molecule') {
      const atom = sim.molecule.atoms.find((item) => dist(x, y, item.x, item.y) < item.radius + 18)
      if (atom) {
        sim.drag = 'atom'
        sim.dragId = atom.id
      }
      return
    }
    if (sim.id === 'blaster') {
      sim.drag = 'aim'
      sim.arcade.aimX = x
      sim.arcade.aimY = y
      sim.arcade.playerX = clamp(x, 58, width - 58)
      return
    }
    if (sim.id === 'creature') {
      sim.arcade.creatureX = clamp(x, 64, width - 64)
      sim.arcade.creatureY = clamp(y, 96, height - 64)
      return
    }
    if (sim.id === 'pinball') {
      sim.drag = 'paddle'
      sim.arcade.paddleX = clamp(x, 90, width - 90)
    }
  }

  const moveDrag = (x: number, y: number) => {
    const sim = simRef.current
    sim.mouse.x = x
    sim.mouse.y = y
    if (sim.id === 'starship' && (sim.drag === 'ship' || sim.mouse.down)) {
      sim.ship.tx = clamp(x, 46, width - 80)
      sim.ship.ty = clamp(y, 70, height - 70)
    }
    if (sim.drag === 'geometry') {
      sim.geometry.w = clamp(Math.round((x - 180) / 24), 1, 16)
      sim.geometry.h = clamp(Math.round((425 - y) / 24), 1, 12)
    }
    if (sim.drag === 'coaster') {
      sim.coaster.handleX = clamp(x, 180, 700)
      sim.coaster.handleY = clamp(y, 80, 420)
    }
    if (sim.drag === 'chip') {
      const chip = sim.circuit.chips.find((item) => item.id === sim.dragId)
      if (chip) {
        chip.x = x
        chip.y = y
      }
    }
    if (sim.drag === 'blade') {
      sim.fraction.angle = Math.atan2(y - 265, x - width / 2)
      if (sim.fraction.angle < 0) sim.fraction.angle += Math.PI * 2
    }
    if (sim.drag === 'atom') {
      const atom = sim.molecule.atoms.find((item) => item.id === sim.dragId)
      if (atom) {
        atom.x = clamp(x, 80, width - 80)
        atom.y = clamp(y, 82, height - 65)
        atom.vx *= 0.82
        atom.vy *= 0.82
      }
    }
    if (sim.id === 'blaster') {
      sim.arcade.aimX = x
      sim.arcade.aimY = y
      if (sim.mouse.down) {
        sim.arcade.playerX = clamp(x, 58, width - 58)
        sim.arcade.playerY = clamp(y + 150, 180, height - 44)
      }
    }
    if (sim.id === 'creature' && sim.mouse.down) {
      sim.arcade.creatureX = clamp(x, 64, width - 64)
      sim.arcade.creatureY = clamp(y, 96, height - 64)
    }
    if (sim.id === 'pinball') {
      sim.arcade.paddleX = clamp(x, 90, width - 90)
    }
  }

  const endDrag = () => {
    const sim = simRef.current
    if (sim.drag === 'chip') {
      const chip = sim.circuit.chips.find((item) => item.id === sim.dragId)
      if (chip) {
        const socketHit = Math.abs(chip.x - 460) < 78 && Math.abs(chip.y - 230) < 58
        if (socketHit) {
          sim.circuit.socketR = chip.r
          chip.x = chip.homeX
          chip.y = chip.homeY
          const voltage = (sim.objective.current ?? 2) * chip.r
          if (voltage === sim.objective.target) {
            sim.mouse.x = 460
            sim.mouse.y = 230
            advance(sim, '电路点亮，欧姆定律匹配', 'Circuit lit. Ohm law matched', '#22c55e', audio)
          } else {
            miss(sim, `${voltage}V 不是目标电压`, `${voltage}V is not the target voltage`, audio)
          }
        } else {
          chip.x = chip.homeX
          chip.y = chip.homeY
        }
      }
    }
    sim.mouse.down = false
    sim.drag = 'none'
    sim.dragId = -1
    setHud(makeHud(sim))
  }

  const sliceFraction = useCallback(() => {
    const sim = simRef.current
    if (sim.id !== 'fraction') return
    const target = sim.objective.target
    const raw = Math.abs(sim.fraction.angle - target)
    const diff = Math.min(raw, Math.PI * 2 - raw)
    sim.mouse.x = width / 2 + Math.cos(sim.fraction.angle) * 180
    sim.mouse.y = 265 + Math.sin(sim.fraction.angle) * 180
    if (diff < 0.18) {
      sim.fraction.sliced += 1
      advance(sim, '切割角度命中目标分数', 'Slice angle matched the fraction', '#a78bfa', audio)
    } else {
      miss(sim, '切割角度还不够接近目标分数', 'Blade angle is not close enough', audio)
    }
    setHud(makeHud(sim))
  }, [audio])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const point = getPointer(canvas, event)
    canvas.setPointerCapture(event.pointerId)
    beginDrag(point.x, point.y)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const point = getPointer(canvas, event)
    moveDrag(point.x, point.y)
  }

  const handlePointerUp = () => {
    endDrag()
  }

  return (
    <section className="relative">
      <div className={showcaseLayoutClass}>
        <div className={compact ? 'hidden' : 'space-y-5'}>
          <div className="border-b border-white/10 pb-5">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-white/45">Larry Academy Lab</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {locale === 'zh' ? '真正可操控的学习游戏' : 'Playable Learning Games'}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
              {locale === 'zh'
                ? '这版把数学和科学概念放进移动、拖拽、连线、切割和碰撞动作里。学生要操作物体完成任务，不是只点选答案。'
                : 'Concepts now live inside movement, dragging, wiring, slicing, and collision. Students operate the world instead of just choosing answers.'}
            </p>
          </div>

          <div className={`grid grid-cols-2 gap-3 ${activeId === 'snake' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            {templates.map((template) => {
              const selected = template.id === activeId
              return (
                <button
                  key={template.id}
                  onClick={() => chooseTemplate(template.id)}
                  className={`min-h-32 rounded-2xl border p-4 text-left transition ${
                    selected ? 'border-white/45 bg-white text-black shadow-2xl shadow-white/10' : 'border-white/10 bg-white/[0.035] text-white hover:border-white/25 hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: selected ? '#111' : template.accent }}>
                    {template.subject}
                  </span>
                  <span className="mt-3 block text-base font-black leading-tight">
                    {locale === 'zh' ? template.titleZh : template.titleEn}
                  </span>
                  <span className={`mt-2 block text-xs leading-5 ${selected ? 'text-black/58' : 'text-white/45'}`}>
                    {locale === 'zh' ? template.verbZh : template.verbEn}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${activeTemplate.wash} ${compact ? 'p-3 shadow-xl shadow-black/20' : 'p-4 shadow-2xl shadow-black/25'}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                {compact ? (locale === 'zh' ? '本课技能挑战' : 'Lesson Skill Challenge') : activeTemplate.subject}
              </p>
              <h3 className={`${compact ? 'mt-1 text-xl' : 'mt-1 text-2xl'} font-black text-white`}>
                {locale === 'zh' ? activeTemplate.titleZh : activeTemplate.titleEn}
              </h3>
            </div>
            <button
              onClick={() => reset(activeId)}
              className={`${compact ? 'rounded-lg px-3 py-2 text-xs' : 'rounded-xl px-4 py-3 text-sm'} bg-white font-black text-black transition hover:scale-[1.02] active:scale-[0.98]`}
            >
              {locale === 'zh' ? '重开' : 'Reset'}
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="block aspect-[1040/640] w-full touch-none rounded-xl border border-white/10 bg-black shadow-inner"
          />
          {showHowToPlay && (
            <div className="absolute inset-4 z-20 flex items-center justify-center rounded-xl bg-black/72 p-4 backdrop-blur-md">
              <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#07111f]/95 p-5 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: activeTemplate.accent }}>
                      {locale === 'zh' ? '怎么玩' : 'How to Play'}
                    </p>
                    <h4 className="mt-1 text-2xl font-black text-white">
                      {locale === 'zh' ? activeTemplate.titleZh : activeTemplate.titleEn}
                    </h4>
                  </div>
                  <button
                    onClick={closeHowToPlay}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    {locale === 'zh' ? '开始' : 'Start'}
                  </button>
                </div>

                <HowToPlayGraphic visual={how.visual} accent={activeTemplate.accent} />

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-lg font-black text-white">
                    {locale === 'zh' ? how.goalZh : how.goalEn}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(locale === 'zh' ? how.stepsZh : how.stepsEn).map((step, index) => (
                      <div key={step} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                        <div className="mb-2 flex size-7 items-center justify-center rounded-full text-sm font-black text-black" style={{ backgroundColor: activeTemplate.accent }}>
                          {index + 1}
                        </div>
                        <div className="text-sm font-bold leading-5 text-white/80">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold leading-6 text-white/72">
                  <span className="mr-2 text-white">{locale === 'zh' ? '学到什么：' : 'Learning:'}</span>
                  {locale === 'zh' ? how.learnZh : how.learnEn}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${compact ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-4 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]'}`}>
        {!compact && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
            {locale === 'zh' ? '操作原则' : 'Play Rule'}
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {locale === 'zh' ? '只看游戏屏幕内的目标、数值和运动轨迹来操作。' : 'Use only the objective, values, and motion inside the game screen.'}
          </div>
          {hud.messageZh && (
            <div className="mt-3 text-sm font-bold" style={{ color: activeTemplate.accent }}>
              {locale === 'zh' ? hud.messageZh : hud.messageEn}
            </div>
          )}
        </div>
        )}
        {[
          [locale === 'zh' ? '分数' : 'Score', hud.score],
          [locale === 'zh' ? '连击' : 'Streak', hud.streak],
          [locale === 'zh' ? '等级' : 'Level', hud.level],
        ].map(([label, value]) => (
          <div key={label} className={`${compact ? 'rounded-xl p-3' : 'rounded-2xl p-5'} border border-white/10 bg-white/[0.04]`}>
            <div className={`${compact ? 'text-xl' : 'text-3xl'} font-black text-white`}>{value}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white/42">{label}</div>
          </div>
        ))}
      </div>

      {activeId === 'fraction' && (
        <button
          onClick={sliceFraction}
          className="mt-4 rounded-2xl px-6 py-4 text-base font-black text-black transition hover:scale-[1.01] active:scale-[0.98]"
          style={{ backgroundColor: activeTemplate.accent }}
        >
          {locale === 'zh' ? '执行切割' : 'Slice'}
        </button>
      )}
    </section>
  )
}
