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

  const entries: MetadataRoute.Sitemap = []

  entries.push({
    url: u(''),
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
    alternates: { languages: alternateLanguages('') },
  })

  entries.push({
    url: u('/about'),
    changeFrequency: 'monthly',
    priority: 0.5,
    alternates: { languages: alternateLanguages('/about') },
  })

  entries.push({
    url: u('/tags'),
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: { languages: alternateLanguages('/tags') },
  })

  // 정적 허브 페이지 — 검색엔진이 발견하도록 명시
  for (const path of ['/posts', '/tools', '/viz', '/glossary', '/series'] as const) {
    entries.push({
      url: u(path),
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: { languages: alternateLanguages(path) },
    })
  }

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
  for (const series of listAllSeries(locale as Locale)) {
    const seriesPath = `/series/${series.slug}`
    entries.push({
      url: u(seriesPath),
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

  for (const tag of tags) {
    const tagPath = `/tags/${encodeURIComponent(tag)}`
    entries.push({
      url: u(tagPath),
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages: alternateLanguages(tagPath) },
    })
  }

  return entries
}
