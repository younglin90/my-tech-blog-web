'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// 경로가 바뀔 때마다 /api/pageview 로 1건 보낸다 (방문자·글 조회수 D1 집계).
// 실패해도 화면에는 영향 없음.
export function PageviewBeacon() {
  const pathname = usePathname()
  useEffect(() => {
    if (!pathname) return
    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])
  return null
}
