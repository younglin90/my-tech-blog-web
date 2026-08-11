import { allPosts } from 'contentlayer/generated'
import type { Locale } from '@/lib/i18n'

/**
 * 색인 대상 태그의 최소 포스트 수.
 *
 * 태그 페이지는 제목 + 포스트 목록뿐이라 자체 본문이 없다. 포스트가 1개뿐이면
 * 그 포스트 페이지와 거의 같은 내용을 담은 얇은 페이지가 되고, 현재 394개 태그 중
 * 306개가 여기 해당한다(locale 5개 곱하면 1,530개). 이런 URL이 sitemap에 올라가면
 * 크롤 예산을 먹고 사이트 전체의 품질 평가를 끌어내린다.
 *
 * 단 페이지 자체는 계속 200으로 서빙하고 링크도 유지한다 — 사용자에게는 쓸모가 있고,
 * /tags 허브가 포스트로 가는 내부 링크 경로이기 때문이다. 색인만 막는다.
 *
 * ⚠️ 이 값은 sitemap.ts(어떤 URL을 제출할지)와 tags/[tag]/page.tsx(어떤 페이지에
 * noindex를 붙일지)에서 함께 쓰인다. 두 곳이 다르면 "sitemap에 넣어놓고 noindex"라는
 * 모순 신호가 되므로 반드시 이 상수 하나만 참조할 것.
 */
export const TAG_INDEX_MIN = 2

/** locale별 유효 포스트 집합 (해당 locale 우선 + ko fallback, draft 제외). */
export function postsForLocale(locale: Locale) {
  const bySlug = new Map<string, (typeof allPosts)[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  return Array.from(bySlug.values())
}

/** 태그 → 포스트 수. */
export function tagFrequency(locale: Locale): Map<string, number> {
  const df = new Map<string, number>()
  for (const tg of postsForLocale(locale).flatMap((p) => p.tags ?? [])) {
    df.set(tg, (df.get(tg) ?? 0) + 1)
  }
  return df
}

/** 이 태그 페이지를 색인시킬 것인가. */
export function isTagIndexable(locale: Locale, tag: string): boolean {
  return (tagFrequency(locale).get(tag) ?? 0) >= TAG_INDEX_MIN
}
