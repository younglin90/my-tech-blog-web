'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

// Giscus 댓글 통합 — GitHub Discussions를 백엔드로 사용. DB 불필요.
//
// 활성화하려면 다음 환경변수가 모두 필요 (.env.local 또는 CF Pages):
//   NEXT_PUBLIC_GISCUS_REPO          (예: younglin90/my-tech-blog-web)
//   NEXT_PUBLIC_GISCUS_REPO_ID       (giscus.app 설정 시 발급)
//   NEXT_PUBLIC_GISCUS_CATEGORY      (예: Comments)
//   NEXT_PUBLIC_GISCUS_CATEGORY_ID   (giscus.app 설정 시 발급)
//
// 사전 준비:
//   1. GitHub 저장소 → Settings → Discussions 활성화
//   2. https://giscus.app 방문 → 저장소 입력 → 카테고리 선택 → repoId/categoryId 받음
//   3. https://github.com/apps/giscus 설치
//
// 환경변수 미설정 시 컴포넌트는 아무것도 렌더하지 않음.

interface GiscusProps {
  postId: string
}

export function Giscus({ postId }: GiscusProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID

  useEffect(() => {
    if (!ref.current || !repo || !repoId || !category || !categoryId) return
    // 기존 iframe 제거 (locale 변경/페이지 이동 시 중복 방지)
    ref.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', repo)
    script.setAttribute('data-repo-id', repoId)
    script.setAttribute('data-category', category)
    script.setAttribute('data-category-id', categoryId)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', postId)
    script.setAttribute('data-strict', '0')
    // 글 반응은 PostFeedback(👍/👎, D1 집계·로그인 불필요)이 맡는다. 같은 기능이 두 번 보이지 않게 끈다.
    script.setAttribute('data-reactions-enabled', '0')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', resolvedTheme === 'dark' ? 'dark_dimmed' : 'light')
    script.setAttribute('data-lang', 'en')
    script.setAttribute('data-loading', 'lazy')

    ref.current.appendChild(script)
  }, [postId, repo, repoId, category, categoryId, resolvedTheme])

  // Theme 동적 변경 — postMessage로 iframe에 알림
  useEffect(() => {
    if (!resolvedTheme) return
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: resolvedTheme === 'dark' ? 'dark_dimmed' : 'light' } } },
      'https://giscus.app',
    )
  }, [resolvedTheme])

  if (!repo || !repoId || !category || !categoryId) return null

  return (
    <section className="mt-12 border-t pt-10" style={{ borderColor: 'var(--border)' }}>
      <div ref={ref} />
    </section>
  )
}
