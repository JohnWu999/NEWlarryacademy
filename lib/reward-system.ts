export type LevelCopy = {
  zh: string
  en: string
}

export type RewardLevel = {
  id: string
  min: number
  rank: number
  copy: LevelCopy
  shortCopy: LevelCopy
}

export const identityLevels: RewardLevel[] = [
  {
    id: 'spark-seeker',
    min: 0,
    rank: 1,
    copy: { zh: '星尘探索者', en: 'Spark Seeker' },
    shortCopy: { zh: '星尘 I', en: 'Spark I' },
  },
  {
    id: 'crystal-builder',
    min: 5,
    rank: 2,
    copy: { zh: '水晶建造师', en: 'Crystal Builder' },
    shortCopy: { zh: '水晶 II', en: 'Crystal II' },
  },
  {
    id: 'prism-solver',
    min: 15,
    rank: 3,
    copy: { zh: '棱镜解题师', en: 'Prism Solver' },
    shortCopy: { zh: '棱镜 III', en: 'Prism III' },
  },
  {
    id: 'diamond-strategist',
    min: 35,
    rank: 4,
    copy: { zh: '钻石策略师', en: 'Diamond Strategist' },
    shortCopy: { zh: '钻石 IV', en: 'Diamond IV' },
  },
  {
    id: 'galaxy-architect',
    min: 80,
    rank: 5,
    copy: { zh: '星河架构师', en: 'Galaxy Architect' },
    shortCopy: { zh: '星河 V', en: 'Galaxy V' },
  },
]

export const heroLevels: RewardLevel[] = [
  {
    id: 'spark-scout',
    min: 0,
    rank: 1,
    copy: { zh: '火花新秀', en: 'Spark Scout' },
    shortCopy: { zh: 'Hero Lv.1', en: 'Hero Lv.1' },
  },
  {
    id: 'comet-runner',
    min: 300,
    rank: 2,
    copy: { zh: '彗星冲刺者', en: 'Comet Runner' },
    shortCopy: { zh: 'Hero Lv.2', en: 'Hero Lv.2' },
  },
  {
    id: 'nova-hero',
    min: 900,
    rank: 3,
    copy: { zh: '新星英雄', en: 'Nova Hero' },
    shortCopy: { zh: 'Hero Lv.3', en: 'Hero Lv.3' },
  },
  {
    id: 'supernova-hero',
    min: 2000,
    rank: 4,
    copy: { zh: '超新星英雄', en: 'Supernova Hero' },
    shortCopy: { zh: 'Hero Lv.4', en: 'Hero Lv.4' },
  },
  {
    id: 'legend-hero',
    min: 5000,
    rank: 5,
    copy: { zh: '传奇 Hero', en: 'Legend Hero' },
    shortCopy: { zh: 'Hero Lv.5', en: 'Hero Lv.5' },
  },
]

export function getRewardLevel(levels: RewardLevel[], value: number) {
  const safeValue = Math.max(0, Number(value || 0))
  return [...levels].reverse().find((level) => safeValue >= level.min) || levels[0]
}

export function getIdentityLevel(gems: number) {
  return getRewardLevel(identityLevels, gems)
}

export function getHeroLevel(sparks: number) {
  return getRewardLevel(heroLevels, sparks)
}

export function getNextRewardLevel(levels: RewardLevel[], value: number) {
  const safeValue = Math.max(0, Number(value || 0))
  return levels.find((level) => level.min > safeValue) || null
}

export function getDisplayName(name?: string | null, id?: string | null) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  const suffix = (id || 'hero').slice(-4).toUpperCase()
  return `Hero ${suffix}`
}

export function getInitials(displayName: string) {
  const parts = displayName
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'H'
  if (/[\u4e00-\u9fff]/.test(parts[0])) return parts[0].slice(0, 2)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}
