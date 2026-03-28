'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      className="reading-progress fixed left-0 top-0 z-50 h-[2px] transition-[width] duration-75"
      style={{
        width: `${progress}%`,
        background: 'var(--accent)',
        opacity: progress > 0 && progress < 100 ? 1 : 0,
        transition: 'width 80ms linear, opacity 0.3s',
      }}
    />
  )
}
