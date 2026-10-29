'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { t } from '@/lib/i18n'
import { timeAgo } from '@/lib/post-stats'
import { usePostTitles } from '@/lib/use-post-titles'

interface Item { id: number; slug: string; name: string; body: string; ts: number }

// 홈: 방금 달린 댓글 (D1, 엣지 60초 캐시).
export function RecentComments({ locale, limit = 5 }: { locale: string; limit?: number }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const titles = usePostTitles(locale)

  useEffect(() => {
    let cancelled = false
    fetch('/api/recent-comments')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: Item[] }) => { if (!cancelled) setItems(d.items ?? []) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [])

  const rows = items && titles ? items.filter((i) => titles.has(i.slug)).slice(0, limit) : null

  return (
    <section className="home-panel">
      <header>
        <h2>{t(locale, 'home.recentComments')}</h2>
      </header>
      {rows === null ? (
        <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-4 rounded" />)}</div>
      ) : rows.length === 0 ? (
        <p className="home-panel-empty">{t(locale, 'home.noComments')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="text-sm">
              <Link href={`/${locale}/posts/${c.slug}/#comment-${c.id}`} className="group block">
                <p className="line-clamp-2 leading-snug transition-colors group-hover:[color:var(--accent)]" style={{ color: 'var(--text)' }}>
                  {c.body}
                </p>
                <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-faint)' }}>
                  {c.name} · {timeAgo(c.ts, locale)} · {titles!.get(c.slug)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
