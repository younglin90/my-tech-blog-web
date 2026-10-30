export interface SeriesRule {
  slug: string
  tags: Record<string, number>
  title: Record<'ko' | 'en' | 'ja' | 'zh' | 'es', string>
  description: Record<'ko' | 'en' | 'ja' | 'zh' | 'es', string>
}
export const SERIES: SeriesRule[]
export function resolveSeries(post: { series?: string; tags?: string[] }): string | undefined
