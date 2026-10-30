import { allPosts } from 'contentlayer/generated'
import type { Locale } from '@/lib/i18n'
import { SERIES, resolveSeries } from '@/lib/series-rules.mjs'

export interface SeriesSummary {
  slug: string
  count: number
  /** 첫 글과 가장 최근 글의 날짜 (YYYY-MM-DD 문자열 그대로) */
  started: string
  updated: string
  posts: Array<{
    slug: string
    title: string
    seriesOrder?: number
    date: string
    description: string
  }>
}

/** locale 기준으로 dedupe된 포스트만 사용 — 시리즈는 ko 베이스 + locale fallback */
function dedupedPostsForLocale(locale: Locale) {
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  return Array.from(bySlug.values())
}

const ORDER = new Map(SERIES.map((s, i) => [s.slug, i]))

/** frontmatter `series`가 있으면 그것, 없으면 태그 규칙으로 배정된 시리즈 */
export function postSeries(p: { series?: string; tags?: string[] }): string | undefined {
  return resolveSeries({ series: p.series, tags: p.tags ?? [] })
}

export function listAllSeries(locale: Locale): SeriesSummary[] {
  const grouped = new Map<string, SeriesSummary>()
  for (const p of dedupedPostsForLocale(locale)) {
    const series = postSeries(p as { series?: string; tags?: string[] })
    if (!series) continue
    if (!grouped.has(series)) grouped.set(series, { slug: series, count: 0, started: '', updated: '', posts: [] })
    const entry = grouped.get(series)!
    entry.count += 1
    entry.posts.push({
      slug: p.slug,
      title: p.title,
      seriesOrder: (p as { seriesOrder?: number }).seriesOrder,
      date: p.date,
      description: p.description,
    })
  }
  for (const s of grouped.values()) {
    s.posts.sort((a, b) => {
      const ao = a.seriesOrder ?? 999
      const bo = b.seriesOrder ?? 999
      if (ao !== bo) return ao - bo
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    const dates = s.posts.map((p) => p.date.slice(0, 10)).sort()
    s.started = dates[0]
    s.updated = dates[dates.length - 1]
  }
  // 학습 순서(series-rules.mjs의 SERIES 순서)대로. 규칙에 없는 frontmatter 시리즈는 뒤로.
  return Array.from(grouped.values()).sort(
    (a, b) => (ORDER.get(a.slug) ?? 99) - (ORDER.get(b.slug) ?? 99) || b.count - a.count,
  )
}

export function getSeries(locale: Locale, slug: string): SeriesSummary | null {
  return listAllSeries(locale).find((s) => s.slug === slug) ?? null
}

export function getSeriesContext(locale: Locale, postSlug: string) {
  for (const s of listAllSeries(locale)) {
    const idx = s.posts.findIndex((p) => p.slug === postSlug)
    if (idx >= 0) {
      return {
        series: s,
        index: idx,
        prev: idx > 0 ? s.posts[idx - 1] : null,
        next: idx < s.posts.length - 1 ? s.posts[idx + 1] : null,
      }
    }
  }
  return null
}
