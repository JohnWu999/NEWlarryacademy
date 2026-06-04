export type Locale = 'zh' | 'en'

export const defaultLocale: Locale = 'zh'

export function normalizeLocale(value?: string | null): Locale {
  return value === 'en' ? 'en' : 'zh'
}
