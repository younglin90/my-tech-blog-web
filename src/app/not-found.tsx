import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { NotFoundContent } from '@/components/NotFoundContent'

// Global fallback (out of [locale] segment). 서버에서는 locale을 알 수 없으므로
// 문구·링크 현지화는 NotFoundContent가 클라이언트에서 처리한다.
export default function NotFound() {
  // Use ko base for recent posts (제목은 ko지만 링크는 클라이언트에서 locale 경로로 변환)
  const recent = allPosts
    .filter((p) => !p.draft && p.locale === 'ko')
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .slice(0, 3)
    .map((p) => ({ slug: p.slug, title: p.title, date: p.date }))

  return <NotFoundContent recent={recent} />
}
