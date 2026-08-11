import { SITE_URL } from '@/lib/site'

// 사이트 전역 엔티티의 고정 @id.
//
// 지금까지 Person/Organization/WebSite/Article 노드가 서로를 참조하지 않는 섬 네 개였다.
// 같은 @id를 공유해야 검색엔진이 "이 글의 저자 = 이 사이트의 저자 = 이 프로필 페이지의
// 주인"이라고 하나로 묶는다. locale이 달라도 엔티티는 하나이므로 @id에는 locale을 넣지 않는다.
export const PERSON_ID = `${SITE_URL}/#person`
export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/**
 * JSON-LD를 <script>에 안전하게 넣기 위한 직렬화.
 *
 * 포스트 제목·설명에는 실제로 `<`가 들어간다(예: post-index.json의
 * 2026-05-20-positivity-preserving-flux-limiter). 그대로 두면 `</script>` 시퀀스가
 * 만들어져 문서가 깨질 수 있다. `&`는 raw text 안에서 무해하므로 이스케이프하지 않는다
 * — 645개 페이지에서 바이트만 늘어난다.
 */
export function jsonLdHtml(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** URL 끝에 슬래시를 보장한다 (trailingSlash: true인 사이트의 canonical과 일치시키기 위해). */
export const slash = (u: string) => (u.endsWith('/') ? u : `${u}/`)

/** 'riemann-solvers' → 'Riemann Solvers' */
export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => (w.length <= 3 && w === w.toLowerCase() ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}
