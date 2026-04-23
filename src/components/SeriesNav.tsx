import Link from 'next/link'
import { ListOrdered } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { getSeriesContext } from '@/lib/series'

interface Props {
  locale: Locale
  postSlug: string
}

// 포스트 본문 위에 시리즈 컨텍스트(현재 N/M, 시리즈 링크, prev/next) 노출.
// 시리즈에 속하지 않으면 null.
export function SeriesNav({ locale, postSlug }: Props) {
  const ctx = getSeriesContext(locale, postSlug)
  if (!ctx) return null
  const { series, index, prev, next } = ctx
  return (
    <aside
      className="mb-8 rounded-lg p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={`/${locale}/series/${series.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium link-hover-accent"
          style={{ color: 'var(--accent)' }}
        >
          <ListOrdered className="h-4 w-4" />
          <span>Series: {series.slug}</span>
        </Link>
        <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
          part {index + 1} / {series.count}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {prev ? (
          <Link
            href={`/${locale}/posts/${prev.slug}`}
            className="rounded-md p-2 transition-colors duration-100"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <div className="mono text-[10px]" style={{ color: 'var(--text-faint)' }}>← prev part</div>
            <div className="mt-0.5 line-clamp-1" style={{ color: 'var(--text)' }}>{prev.title}</div>
          </Link>
        ) : <div />}
        {next ? (
          <Link
            href={`/${locale}/posts/${next.slug}`}
            className="rounded-md p-2 text-right transition-colors duration-100"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <div className="mono text-[10px]" style={{ color: 'var(--text-faint)' }}>next part →</div>
            <div className="mt-0.5 line-clamp-1" style={{ color: 'var(--text)' }}>{next.title}</div>
          </Link>
        ) : <div />}
      </div>
    </aside>
  )
}
