function stableTwoDigitSeed(key: string) {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0
  }
  return 20 + (hash % 80)
}

export function getPeerLearningCount(key: string, viewCount?: number | null) {
  return stableTwoDigitSeed(key) + Math.max(0, Number(viewCount || 0))
}
