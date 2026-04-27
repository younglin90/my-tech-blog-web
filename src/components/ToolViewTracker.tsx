'use client'

import { useEffect } from 'react'

const RECENT_TOOLS_KEY = 'cfd-lab-recent-tools'

export function ToolViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_TOOLS_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      const next = [slug, ...parsed.filter((value: string) => value !== slug)].slice(0, 6)
      localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next))
    } catch {
      // ignore localStorage failures
    }
  }, [slug])

  return null
}

export { RECENT_TOOLS_KEY }
