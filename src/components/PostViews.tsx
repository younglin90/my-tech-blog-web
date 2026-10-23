'use client'

import { useEffect, useState } from 'react'
import { getPostStats } from '@/lib/post-stats'

// 글 상단 메타 줄의 조회수 (방문자·날짜당 1회 집계). 집계가 없으면 아무것도 그리지 않는다.
export function PostViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    getPostStats(slug).then((s) => { if (!cancelled && s && s.views > 0) setViews(s.views) })
    return () => { cancelled = true }
  }, [slug])
  if (views === null) return null
  return (
    <span>
      VIEWS <span className="tabular" style={{ color: 'var(--text)' }}>{views.toLocaleString('en-US')}</span>
    </span>
  )
}
