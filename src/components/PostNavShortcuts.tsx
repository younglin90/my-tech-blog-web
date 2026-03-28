'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PostNavShortcutsProps {
  prevUrl?: string
  nextUrl?: string
}

export function PostNavShortcuts({ prevUrl, nextUrl }: PostNavShortcutsProps) {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'j' && nextUrl) {
        router.push(nextUrl)
      } else if (e.key === 'k' && prevUrl) {
        router.push(prevUrl)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [prevUrl, nextUrl, router])

  return null
}
