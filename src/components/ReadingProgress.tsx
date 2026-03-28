'use client'

import { useEffect, useRef, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [showBadge, setShowBadge] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(pct)
      if (pct >= 99 && !completedRef.current) {
        completedRef.current = true
        setShowBadge(true)
        setTimeout(() => setShowBadge(false), 2500)
      }
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <>
      <div
        className="reading-progress fixed left-0 top-0 z-50 h-[2px]"
        style={{
          width: `${progress}%`,
          background: completedRef.current ? 'var(--success)' : 'var(--accent)',
          opacity: progress > 0 && progress < 100 ? 1 : 0,
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
