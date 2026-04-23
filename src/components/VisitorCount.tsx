'use client'

import { useEffect, useState } from 'react'

interface Stats {
  visitors: number | null
  pageviews: number | null
}

// Umami Cloud 통계 프록시(/api/visitors)에서 오늘자 수치를 가져온다.
// Umami 대시보드에 아직 이벤트가 기록되지 않으면 API는 {visitors: 0, pageviews: 0}을
// 정상 응답으로 돌려준다. 이 경우 "today 0 · 0 views" 같은 의미 없는 0만 표시되므로
// 실제 트래픽이 집계되기 전까지는 컴포넌트 자체를 숨긴다.
export function VisitorCount() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/visitors')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Stats | null) => {
        if (cancelled || !d) return
        if (d.visitors === null || d.pageviews === null) return
        if (d.visitors === 0 && d.pageviews === 0) return
        setStats(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!stats || stats.visitors === null || stats.pageviews === null) return null

  const nf = new Intl.NumberFormat('en-US')
  return (
    <span
      title="오늘의 방문자 · 페이지뷰 (Umami)"
      className="inline-flex items-center gap-1.5"
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: 999,
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent)',
        }}
      />
      today {nf.format(stats.visitors)} · {nf.format(stats.pageviews)} views
    </span>
  )
}
