'use client'

import { useEffect, useState } from 'react'

interface Stats {
  visitors: number | null
  pageviews: number | null
}

// Umami Cloud 통계 프록시(/api/visitors, Cloudflare Pages Function)에서 오늘자 수치를 가져온다.
// API 미구성/오류여도 자리는 유지하고 "—" 로 표시 → 사용자가 작동 여부를 직접 확인 가능.
export function VisitorCount() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/visitors', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http-${r.status}`))))
      .then((d: Stats) => {
        if (cancelled) return
        setStats({
          visitors: typeof d.visitors === 'number' ? d.visitors : null,
          pageviews: typeof d.pageviews === 'number' ? d.pageviews : null,
        })
      })
      .catch(() => {
        if (!cancelled) setErrored(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const nf = new Intl.NumberFormat('en-US')
  const visitors = stats?.visitors
  const pageviews = stats?.pageviews
  const visitorsLabel = typeof visitors === 'number' ? nf.format(visitors) : errored ? '—' : '…'
  const pageviewsLabel = typeof pageviews === 'number' ? nf.format(pageviews) : errored ? '—' : '…'

  return (
    <span
      title="오늘의 방문자 · 페이지뷰 (Umami, KST 기준)"
      className="inline-flex items-center gap-1.5"
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: 999,
          background: errored ? 'var(--text-faint)' : 'var(--accent)',
          boxShadow: errored ? 'none' : '0 0 6px var(--accent)',
        }}
      />
      today {visitorsLabel} · {pageviewsLabel} views
    </span>
  )
}
