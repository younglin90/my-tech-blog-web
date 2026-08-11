'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 상단 읽기 진행 바.
 *
 * 예전에는 scroll 이벤트마다 setProgress를 불렀다. 스크롤 한 번에 이벤트가 수십 번
 * 오므로 그때마다 React 리렌더가 돌았고, 그게 포스트 페이지에서 입력 지연(INP)의
 * 상시 부하가 됐다. 진행 바는 DOM 노드 하나의 width만 바꾸면 되는 일이라
 * ref로 직접 쓰고, 측정은 rAF로 프레임당 1회로 묶는다.
 *
 * state는 완료 배지에만 남긴다 — 세션당 최대 두 번 바뀐다.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)
  const [showBadge, setShowBadge] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    let ticking = false
    let raf = 0

    const measure = () => {
      ticking = false
      const bar = barRef.current
      if (!bar) return
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0

      bar.style.width = `${pct}%`
      bar.style.opacity = pct > 0 && pct < 100 ? '1' : '0'

      if (pct >= 99 && !completedRef.current) {
        completedRef.current = true
        bar.style.background = 'var(--success)'
        setShowBadge(true)
        setTimeout(() => setShowBadge(false), 2500)
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      raf = requestAnimationFrame(measure)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    measure()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={barRef}
        className="reading-progress fixed left-0 top-0 z-50 h-[2px]"
        style={{
          width: '0%',
          background: 'var(--accent)',
          opacity: 0,
          transition: 'width 80ms linear, opacity 0.3s, background 0.3s',
        }}
      />
      {showBadge && (
        <div
          className="fixed right-4 top-4 z-50 rounded-full px-3 py-1 text-[10px] font-semibold animate-fade-up"
          style={{ background: 'var(--success)', color: '#fff', opacity: 0.9 }}
        >
          ✓ Read
        </div>
      )}
    </>
  )
}
