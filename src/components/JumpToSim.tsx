'use client'

import { useEffect, useState } from 'react'

/**
 * 첫 조작형 그림이 첫 화면 아래에 있을 때만 보이는 한 줄 점프.
 * 조사 기준 한국어 188편 중 114편은 첫 viz가 본문 35% 뒤에 있다.
 * 스크롤마다 setState하지 않는다. 보이기/숨기기 경계에서만 바꾼다.
 */
export function JumpToSim({ label }: { label: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let stopped = false
    let tries = 0
    let raf = 0
    let ticking = false
    let target: Element | null = null

    const find = () => document.querySelector('.mdx canvas, .mdx svg')

    const belowFold = (el: Element, factor: number) =>
      el.getBoundingClientRect().top > window.innerHeight * factor

    const seek = () => {
      if (stopped) return
      target = find()
      tries += 1
      if (!target && tries < 90) {
        raf = requestAnimationFrame(seek)
        return
      }
      if (target) setShow(belowFold(target, 0.85))
    }

    raf = requestAnimationFrame(seek)

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (!target) target = find()
        if (!target) return
        const next = belowFold(target, 0.7)
        setShow((prev) => (prev === next ? prev : next))
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!show) return null

  return (
    <p className="mono" style={{ margin: '0 0 28px', fontSize: 12, letterSpacing: '0.04em' }}>
      <button
        type="button"
        onClick={() => {
          const el = document.querySelector('.mdx canvas, .mdx svg')
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
        style={{
          background: 'transparent',
          border: 0,
          padding: 0,
          color: 'var(--accent)',
          cursor: 'pointer',
          font: 'inherit',
          letterSpacing: 'inherit',
        }}
      >
        ↓ {label}
      </button>
    </p>
  )
}
