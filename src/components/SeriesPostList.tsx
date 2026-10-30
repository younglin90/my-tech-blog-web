'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'

interface Item {
  slug: string
  title: string
  description: string
  date: string
  seriesOrder?: number
}

// 시리즈 상세 목록. 연재 순/최신 순 전환과 시리즈 안 검색만 제공한다.
// 번호는 연재 순서 기준으로 고정해, 최신 순으로 봐도 "몇 번째 글인지"가 유지된다.
export function SeriesPostList({ locale, posts }: { locale: Locale; posts: Item[] }) {
  const [order, setOrder] = useState<'series' | 'newest'>('series')
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query.trim().toLowerCase())

  const shown = useMemo(() => {
    const numbered = posts.map((p, i) => ({ ...p, no: p.seriesOrder ?? i + 1 }))
    const list = order === 'newest' ? [...numbered].sort((a, b) => b.date.localeCompare(a.date)) : numbered
    return q ? list.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q)) : list
  }, [posts, order, q])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['series', 'newest'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setOrder(key)}
            aria-pressed={order === key}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium transition-colors"
            style={{
              background: order === key ? 'var(--accent-glow)' : 'var(--surface)',
              border: `1px solid ${order === key ? 'var(--accent)' : 'var(--border)'}`,
              color: order === key ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {t(locale, key === 'series' ? 'series.orderSeries' : 'series.orderNewest')}
          </button>
        ))}
        {posts.length > 8 && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, 'series.listFilter')}
            aria-label={t(locale, 'series.listFilter')}
            className="min-h-11 flex-1 rounded-full px-4 text-sm focus:outline-none"
            style={{ minWidth: 180, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        )}
      </div>

      <ol className="space-y-2">
        {shown.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/${locale}/posts/${p.slug}`}
              className="group flex items-start gap-4 rounded-lg p-4 transition-colors duration-100 hover:[border-color:var(--accent)]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
              >
                {String(p.no).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium link-hover-accent" style={{ color: 'var(--text)' }}>
                  {p.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {p.description}
                </p>
                <p className="mono mt-1 text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
                  {p.date.slice(0, 10).replaceAll('-', '.')}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
