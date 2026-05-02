'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

const STORAGE_KEY = 'cfd-lab-reading-positions'
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

interface SavedPosition {
  y: number
  pct: number
  ts: number
}

interface PostMeta {
  slug: string
  title: string
  url: string
  series?: string
  seriesOrder?: number
}

interface InProgress extends PostMeta {
  pct: number
  ts: number
}

interface Props {
  posts: PostMeta[]   // 모든 포스트 (slug → 메타 룩업용)
  limit?: number
}

// 홈 페이지에 노출. localStorage의 reading-positions에서 진행중 포스트만
// 추려 카드 목록으로 보여준다. 데이터가 없으면 아무것도 렌더링 안 함.
//
// SSR로는 절대 그릴 수 없으니 useState/useEffect로 마운트 후만 렌더 — hydration mismatch 회피.
export function ContinueReading({ posts, limit = 4 }: Props) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [items, setItems] = useState<InProgress[] | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setItems([])
        return
      }
      const store = JSON.parse(raw) as Record<string, SavedPosition>
      const now = Date.now()
      const lookup = new Map(posts.map((p) => [p.slug, p]))
      const result: InProgress[] = []
      for (const [slug, pos] of Object.entries(store)) {
        if (now - pos.ts > MAX_AGE_MS) continue
        if (pos.pct < 0.05 || pos.pct > 0.94) continue   // 너무 시작 직후 / 거의 완독은 제외
        const meta = lookup.get(slug)
        if (!meta) continue
        result.push({ ...meta, pct: pos.pct, ts: pos.ts })
      }
      result.sort((a, b) => b.ts - a.ts)
      setItems(result.slice(0, limit))
    } catch {
      setItems([])
    }
  }, [posts, limit])

  if (!items || items.length === 0) return null

  return (
    <section className="mb-10">
      <h2
        className="mb-3 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text-faint)' }}
      >
        {t(locale, 'home.continueReading')}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((it) => {
          const pct = Math.round(it.pct * 100)
          return (
            <Link
              key={it.slug}
              href={it.url}
              className="group flex flex-col gap-2 rounded-lg p-3 transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="line-clamp-1 text-sm font-medium transition-colors group-hover:[color:var(--accent)]"
                  style={{ color: 'var(--text)' }}
                >
                  {it.title}
                </span>
                <span className="mono shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--accent)' }}>
                  {pct}%
                </span>
              </div>
              {it.series && (
                <span
                  className="mono inline-block self-start rounded px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                >
                  {it.series}
                  {it.seriesOrder ? ` · ${String(it.seriesOrder).padStart(2, '0')}` : ''}
                </span>
              )}
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg)' }}>
                <div
                  className="h-1 rounded-full"
                  style={{ width: `${pct}%`, background: 'var(--accent)' }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
