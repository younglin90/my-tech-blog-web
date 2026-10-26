export interface GlossaryTexts {
  ko?: string
  en?: string
  ja?: string
  zh?: string
  es?: string
}

export function glossaryText(entry: GlossaryTexts, locale: string): string {
  const value = (entry as Record<string, string | undefined>)[locale]
  return value || entry.en || entry.ko || ''
}
