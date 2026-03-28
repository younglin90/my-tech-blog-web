'use client'

import { useEffect } from 'react'

const READ_POSTS_KEY = 'cfd-lab-read-posts'

export function MarkAsRead({ id }: { id: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_POSTS_KEY)
      const set: string[] = raw ? JSON.parse(raw) : []
      if (!set.includes(id)) {
        set.push(id)
        localStorage.setItem(READ_POSTS_KEY, JSON.stringify(set))
      }
    } catch {}
  }, [id])

  return null
}
