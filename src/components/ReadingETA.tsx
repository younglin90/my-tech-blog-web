'use client'

import { useEffect, useState } from 'react'

interface ReadingETAProps {
  totalMinutes: number
}

export function ReadingETA({ totalMinutes }: ReadingETAProps) {
  const [minutesLeft, setMinutesLeft] = useState(totalMinutes)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? scrollTop / docHeight : 0
      const remaining = Math.ceil(totalMinutes * (1 - progress))
      setMinutesLeft(remaining)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [totalMinutes])

  if (minutesLeft <= 0) return null

  return (
    <span className="tabular-nums">
      {minutesLeft === totalMinutes
        ? `${totalMinutes} min read`
        : `~${minutesLeft} min left`}
    </span>
  )
}
