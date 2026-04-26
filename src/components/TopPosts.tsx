'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Item { slug: string; views: number; title?: string }
interface PostIndexEntry { slug: string; locale: string; title: string; url: string }

interface TopPostsProps {
  locale: string
  days?: number
  limit?: number
  heading: string
}

export function TopPosts({ locale, days = 7, limit = 5, heading }: TopPostsProps) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let cancelled = false
    const url = `/api/top-posts?limit=${limit}&days=${days}`
    Promise.all([
      fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http-${r.status}`)))),
      fetch('/post-index.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('idx')))),
    ])
      .then(([top, index]) => {
        if (cancelled) return
        const idxItems = (index?.items || []) as PostIndexEntry[]
        const lookup = new Map<string, PostIndexEntry>()
        for (const it of idxItems) {
          if (it.locale === locale) lookup.set(it.slug, it)
        }
        // fallback to ko
        for (const it of idxItems) {
          if (it.locale === 'ko' && !lookup.has(it.slug)) lookup.set(it.slug, it)
        }
        const enriched = (top.items as Item[]).map((x) => {
          const m = lookup.get(x.slug)
          return { ...x, title: m?.title }
        }).filter((x) => x.title)
        setItems(enriched)
      })
      .catch(() => {
        if (!cancelled) setErrored(true)
      })
    return () => { cancelled = true }
  }, [locale, days, limit])

  if (errored) return null
  if (!items) {
    return (
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {heading}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>…</p>
      </section>
    )
  }
  if (items.length === 0) return null

  const max = Math.max(...items.map((i) => i.views), 1)
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
        {heading}
      </h2>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={item.slug} className="flex items-center gap-3 text-sm">
            <span className="mono shrink-0 text-right" style={{ width: 16, color: 'var(--text-faint)' }}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/${locale}/posts/${item.slug}`}
                className="block truncate link-hover-text"
                style={{ color: 'var(--text)' }}
                title={item.title}
              >
                {item.title}
              </Link>
              <div className="mt-1 h-1 rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(item.views / max) * 100}%`, background: 'var(--accent)' }}
                />
              </div>
            </div>
            <span className="mono shrink-0 tabular-nums" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {item.views.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
