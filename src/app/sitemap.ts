import { allPosts } from 'contentlayer/generated'
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { CALCULATORS } from '@/lib/calculators'
import { listAllSeries } from '@/lib/series'
import { TAG_INDEX_MIN } from '@/lib/tags'
import type { Locale } from '@/lib/i18n'

export const dynamic = 'force-static'
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const

// Next.js generateSitemaps()로 5개 locale별 sitemap을 분리 생성한다.
// 결과: /sitemap.xml(인덱스), /sitemap/ko.xml, /sitemap/en.xml, ...
export async function generateSitemaps() {
  return LOCALES.map((id) => ({ id }))
}

interface SitemapProps {
  id: string | Promise<string>
}

export default async function sitemap({ id }: SitemapProps): Promise<MetadataRoute.Sitemap> {
  // Next.js 16: id가 string 또는 Promise<string>으로 들어올 수 있음 — 둘 다 안전 처리
  const resolvedId = typeof id === 'string' ? id : await id
  const locale = resolvedId as (typeof LOCALES)[number]

  // ko 베이스 + 해당 locale 덮어쓰기 → 같은 slug 중복 제거
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  const posts = Array.from(bySlug.values())
  const slugs = posts.map((p) => p.slug)
  // 태그별 문서 빈도. 포스트 1개짜리 태그는 본문이 없는 얇은 페이지라 색인 대상에서 뺀다
  // (394개 중 306개가 여기 해당). tags/[tag]/page.tsx의 noindex 임계값과 반드시 같아야 한다.
  const tagDf = new Map<string, number>()
  for (const tg of posts.flatMap((p) => p.tags ?? [])) tagDf.set(tg, (tagDf.get(tg) ?? 0) + 1)
  const tags = Array.from(tagDf.keys()).filter((tg) => (tagDf.get(tg) ?? 0) >= TAG_INDEX_MIN)

  // next.config.ts의 trailingSlash: true 때문에 각 페이지가 스스로 선언하는 canonical은
  // 항상 슬래시로 끝난다. sitemap의 <loc>도 바이트 단위로 같아야 하므로 여기서 맞춘다.
  const u = (path: string) => `${SITE_URL}/${locale}${path}/`

  // hreflang alternates: 각 URL에 대해 5개 locale 전부 + x-default.
  // 자기 자신도 포함해야(self-referential) Google이 클러스터를 인정한다.
  const alternateLanguages = (path: string) => ({
    ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}/`])),
    'x-default': `${SITE_URL}/en${path}/`,
  })

  // lastmod는 "정확할 때만" 가치가 있다. 전부 오늘 날짜로 찍으면 Google은 그 사이트의
  // lastmod를 통째로 무시한다. 그래서 콘텐츠에서 실제로 유도되는 날짜만 쓰고,
  // 유도할 수 없는 URL(계산기 도구)은 lastmod를 아예 비운다.
  const dateOf = (p: (typeof posts)[number]) =>
    new Date((p as unknown as { updated?: string }).updated ?? p.date)
  const newest = (list: typeof posts) =>
    list.length ? new Date(Math.max(...list.map((p) => dateOf(p).getTime()))) : undefined
  const siteUpdated = newest(posts)

  const entries: MetadataRoute.Sitemap = []

  entries.push({
    url: u(''),
    lastModified: siteUpdated,
    changeFrequency: 'daily',
    priority: 1.0,
    alternates: { languages: alternateLanguages('') },
  })

  // about은 포스트 수·단어 수·활동 그래프를 렌더하므로 새 글이 올라오면 같이 바뀐다.
  entries.push({
    url: u('/about'),
    lastModified: siteUpdated,
    changeFrequency: 'monthly',
    priority: 0.5,
    alternates: { languages: alternateLanguages('/about') },
  })

  entries.push({
    url: u('/privacy'),
    changeFrequency: 'yearly',
    priority: 0.3,
    alternates: { languages: alternateLanguages('/privacy') },
  })

  entries.push({
    url: u('/tags'),
    lastModified: siteUpdated,
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: { languages: alternateLanguages('/tags') },
  })

  // 정적 허브 페이지 — 검색엔진이 발견하도록 명시.
  // 전부 포스트 목록을 렌더하므로 최신 글 날짜가 곧 이 페이지들의 lastmod다.
  for (const path of ['/posts', '/viz', '/glossary', '/series'] as const) {
    entries.push({
      url: u(path),
      lastModified: siteUpdated,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: { languages: alternateLanguages(path) },
    })
  }

  // /tools 허브와 개별 계산기는 포스트와 무관하게 코드로만 바뀐다 → lastmod 생략.
  entries.push({
    url: u('/tools'),
    changeFrequency: 'monthly',
    priority: 0.6,
    alternates: { languages: alternateLanguages('/tools') },
  })

  // 각 계산기 도구 (9개) — 빌드 시 정적 생성됨
  for (const tool of CALCULATORS) {
    const toolPath = `/tools/${tool.slug}`
    entries.push({
      url: u(toolPath),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: alternateLanguages(toolPath) },
    })
  }

  // 시리즈 인덱스 페이지 (locale별 계산)
  // lastmod는 그 시리즈에 속한 가장 최근 글의 날짜 — 시리즈에 편이 추가되면 같이 움직인다.
  for (const series of listAllSeries(locale as Locale)) {
    const seriesPath = `/series/${series.slug}`
    const seriesSlugs = new Set((series.posts ?? []).map((p) => p.slug))
    entries.push({
      url: u(seriesPath),
      lastModified: newest(posts.filter((p) => seriesSlugs.has(p.slug))),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: alternateLanguages(seriesPath) },
    })
  }

  for (const slug of slugs) {
    const post = posts.find((p) => p.slug === slug)
    // updated 필드가 있으면 그것을 우선 사용 (검색엔진에 글 수정을 알림)
    const updatedRaw = (post as unknown as { updated?: string })?.updated
    const lastMod = updatedRaw ? new Date(updatedRaw) : post ? new Date(post.date) : new Date()
    entries.push({
      url: u(`/posts/${slug}`),
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.8,
      // Google 이미지 검색 인덱싱 — 각 포스트의 OG 이미지를 sitemap에 명시
      images: [`${SITE_URL}/${locale}/posts/${slug}/opengraph-image`],
      alternates: { languages: alternateLanguages(`/posts/${slug}`) },
    })
  }

  // 태그 페이지의 lastmod = 그 태그가 붙은 가장 최근 글의 날짜.
  // 오늘 글에 붙은 태그만 날짜가 올라가므로 Google이 다시 볼 페이지를 정확히 좁혀준다.
  for (const tag of tags) {
    const tagPath = `/tags/${encodeURIComponent(tag)}`
    entries.push({
      url: u(tagPath),
      lastModified: newest(posts.filter((p) => (p.tags ?? []).includes(tag))),
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages: alternateLanguages(tagPath) },
    })
  }

  return entries
}
