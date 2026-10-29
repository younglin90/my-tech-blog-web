'use client'

import { useEffect, useState } from 'react'

interface PostIndexEntry { slug: string; locale: string; title: string }

let index: Promise<PostIndexEntry[]> | null = null

// slug → 현재 locale 제목 (없으면 ko). /post-index.json 은 탭당 한 번만 받는다.
export function usePostTitles(locale: string): Map<string, string> | null {
  const [map, setMap] = useState<Map<string, string> | null>(null)
  useEffect(() => {
    let cancelled = false
    index ??= fetch('/post-index.json')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: PostIndexEntry[] }) => d.items ?? [])
      .catch(() => [])
    index.then((items) => {
      if (cancelled) return
      const m = new Map<string, string>()
      for (const it of items) if (it.locale === locale) m.set(it.slug, it.title)
      for (const it of items) if (it.locale === 'ko' && !m.has(it.slug)) m.set(it.slug, it.title)
      setMap(m)
    })
    return () => { cancelled = true }
  }, [locale])
  return map
}
