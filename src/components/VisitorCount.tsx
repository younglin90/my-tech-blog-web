'use client'

import { useEffect, useState } from 'react'

interface Stats {
  visitors: number | null
  pageviews: number | null
}

export function VisitorCount() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/visitors')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Stats | null) => {
        if (!cancelled && d && d.visitors !== null) setStats(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!stats || stats.visitors === null) return null

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
      today {nf.format(stats.visitors ?? 0)} · {nf.format(stats.pageviews ?? 0)} views
    </span>
  )
}
