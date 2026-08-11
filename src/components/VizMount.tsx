'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'

/**
 * viz를 화면 근처에 올 때까지 마운트하지 않는다.
 *
 * post-viz 139개가 전부 useEffect 안에서 조건 없이 requestAnimationFrame 루프를 돈다.
 * 포스트 한 편에 viz가 1~2개이므로, 지금은 페이지가 뜨자마자 캔버스 루프 두 개가
 * hydration·첫 입력과 같은 메인 스레드를 놓고 경쟁한다. 정작 viz는 본문 중간에 있어
 * 그 시점에는 화면에 보이지도 않는다.
 *
 * 뷰포트 300px 앞에서 마운트하면 사용자가 도달했을 때는 이미 돌고 있고, 초기 로드
 * 구간(INP·LCP가 측정되는 그 구간)은 비어 있다. 한 번 마운트되면 유지한다 —
 * 스크롤을 지나쳤다고 언마운트하면 슬라이더 상태가 날아간다.
 *
 * 플레이스홀더는 실제 캔버스와 비슷한 높이를 미리 잡아 CLS를 만들지 않는다.
 */
export function VizMount({ Component }: { Component: ComponentType }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // IntersectionObserver가 없으면 그냥 바로 보여준다 (기능 후퇴 없이)
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (show) return <Component />

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        margin: '1.5rem 0',
        minHeight: 420,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    />
  )
}
