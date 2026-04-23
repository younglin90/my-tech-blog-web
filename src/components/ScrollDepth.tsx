'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

interface ScrollDepthProps {
  postId: string
}

// 25/50/75/100% 스크롤 도달 시 read-progress 이벤트 1회 발사 (포스트당).
// 같은 페이지에서 새로고침 없이 재발사 방지.
export function ScrollDepth({ postId }: ScrollDepthProps) {
  const fired = useRef<Set<number>>(new Set())

  useEffect(() => {
    fired.current = new Set()
    const thresholds = [25, 50, 75, 100]

    const handler = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100))

      for (const t of thresholds) {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t)
          trackEvent('read-progress', { postId, pct: t })
        }
      }
    }

    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [postId])

  return null
}
