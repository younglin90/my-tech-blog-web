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

    // scrollHeight/innerHeight를 읽는 것은 레이아웃 강제 계산이다. scroll 이벤트마다
    // 하면 스크롤 내내 스타일 재계산이 걸리므로 rAF로 프레임당 1회로 묶는다.
    let ticking = false
    let raf = 0

    const measure = () => {
      ticking = false
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const pct = Math.min(100, Math.round((window.scrollY / docHeight) * 100))

      for (const t of thresholds) {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t)
          trackEvent('read-progress', { postId, pct: t })
        }
      }
      if (fired.current.size === thresholds.length) {
        window.removeEventListener('scroll', handler)
      }
    }

    const handler = () => {
      if (ticking) return
      ticking = true
      raf = requestAnimationFrame(measure)
    }

    window.addEventListener('scroll', handler, { passive: true })
    measure()
    return () => {
      window.removeEventListener('scroll', handler)
      cancelAnimationFrame(raf)
    }
  }, [postId])

  return null
}
