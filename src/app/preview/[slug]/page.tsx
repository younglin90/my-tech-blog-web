import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { PreviewContent } from '@/components/PreviewContent'

interface PreviewProps {
  params: Promise<{ slug: string }>
}

// Preview는 ko 포스트만(관리자 미리보기). slug는 ko/ prefix 없는 형태.
//
// 프로덕션 export에서는 아무것도 만들지 않는다. 만들면 각 포스트의 전체 본문이 담긴
// /preview/{slug}/ 사본 129개가 생기고(포스트당 340KB), noindex를 붙여도 크롤러가
// 먼저 받아 읽어야 알 수 있는 중복 문서가 된다. 로컬에서 미리보기가 필요하면
// NEXT_PUBLIC_ENABLE_PREVIEW=1 로 빌드한다.
const PREVIEW_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PREVIEW === '1'

export async function generateStaticParams() {
  // output: export는 dynamic route에 최소 1개의 param을 요구하므로 빈 배열을 줄 수 없다.
  // 대신 비활성 시에는 스텁 1개만 내보낸다.
  if (!PREVIEW_ENABLED) return [{ slug: 'disabled' }]
  return allPosts
    .filter((p) => p.locale === 'ko')
    .map((p) => ({ slug: p.slug }))
}

export default async function PreviewPage({ params }: PreviewProps) {
  const { slug } = await params
  if (!PREVIEW_ENABLED) {
    return (
      <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        Preview is disabled in this build. Rebuild with NEXT_PUBLIC_ENABLE_PREVIEW=1.
      </p>
    )
  }
  const post = allPosts.find((p) => p.locale === 'ko' && p.slug === slug)
  if (!post) notFound()
  return <PreviewContent post={post} />
}
