'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

interface ReadingETAProps {
  totalMinutes: number
}

export function ReadingETA({ totalMinutes }: ReadingETAProps) {
  const [minutesLeft, setMinutesLeft] = useState(totalMinutes)
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

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
        ? `${totalMinutes} ${t(locale, 'post.minRead')}`
        : `~${minutesLeft} ${t(locale, 'post.minLeft')}`}
    </span>
  )
}
