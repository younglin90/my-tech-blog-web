import type { Metadata } from 'next'
import { RootRedirect } from '@/components/RootRedirect'
import { SITE_URL } from '@/lib/site'

// 도메인 루트. 프로덕션에서는 functions/_middleware.ts가 요청을 먼저 잡아
// /{locale}/로 302를 보내므로 이 문서가 서빙되는 일은 거의 없다. 다만 Functions가
// 꺼진 *.pages.dev 프리뷰 배포에서는 실제로 이게 나가므로, 내용 없는 리다이렉트
// 스텁이 색인되지 않도록 noindex를 명시하고 canonical을 /en/으로 고정한다.
// ('use client' 파일은 metadata를 export할 수 없어서 서버 컴포넌트로 분리했다.)
export const metadata: Metadata = {
  title: "Younglin's CFD Blog",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/en/` },
}

export default function RootPage() {
  return <RootRedirect />
}
