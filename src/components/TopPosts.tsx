'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { t } from '@/lib/i18n'
import { usePostTitles } from '@/lib/use-post-titles'

interface Item { slug: string; views: number }

// D1 조회 로그(post_daily: 방문자·글·날짜당 1회) 기준 지난 N일 인기 글.
export function TopPosts({ locale, days = 7, limit = 5, heading, hint }: {
  locale: string
  days?: number
  limit?: number
  heading: string
  hint?: string
}) {
  const [items, setItems] = useState<Item[] | null>(null)
  const titles = usePostTitles(locale)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/top-posts?limit=${limit}&days=${days}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: Item[] }) => { if (!cancelled) setItems(d.items ?? []) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [days, limit])

  const rows = items && titles ? items.filter((i) => titles.has(i.slug)) : null

  return (
    <section className="home-panel">
      <header>
        <h2>{heading}</h2>
        {hint && <span>{hint}</span>}
      </header>
      {rows === null ? (
        <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-4 rounded" />)}</div>
      ) : rows.length === 0 ? (
        <p className="home-panel-empty">{t(locale, 'home.noData')}</p>
      ) : (
        <ol className="space-y-2.5">
          {rows.map((item, i) => (
            <li key={item.slug} className="flex items-baseline gap-3 text-sm">
              <span className="tabular w-4 shrink-0 text-right text-xs" style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-faint)' }}>
                {i + 1}
              </span>
              <Link
                href={`/${locale}/posts/${item.slug}/`}
                className="min-w-0 flex-1 truncate link-hover-text-accent"
                style={{ color: 'var(--text)' }}
                title={titles!.get(item.slug)}
              >
                {titles!.get(item.slug)}
              </Link>
              <span className="tabular shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>
                {item.views.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
