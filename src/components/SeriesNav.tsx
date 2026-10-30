'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ListOrdered, ChevronDown } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { SeriesSummary } from '@/lib/series'
import { seriesTitle } from '@/lib/series-title'

interface Props {
  locale: Locale
  ctx: {
    series: SeriesSummary
    index: number
    prev: SeriesSummary['posts'][number] | null
    next: SeriesSummary['posts'][number] | null
  } | null
}

// 시리즈 컨텍스트 + 전체 파트 목록(접힘 가능)을 함께 노출.
// 학습자가 현재 위치와 전체 구조를 동시에 파악 가능.
export function SeriesNav({ locale, ctx }: Props) {
  const [expanded, setExpanded] = useState(false)
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
          <span>{t(locale, 'series.navLabel', { title: seriesTitle(series.slug, locale) })}</span>
        </Link>
        <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
          {t(locale, 'series.partLabel')} {index + 1} / {series.count}
        </span>
      </div>

      {/* 진행도 — 16편까지는 점, 그보다 길면 막대 (점 수십 개는 줄을 넘쳐 읽히지 않는다) */}
      {series.count > 16 ? (
        <div
          className="mb-3 h-1.5 overflow-hidden rounded-full"
          style={{ background: 'var(--border)' }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={series.count}
          aria-valuenow={index + 1}
          aria-label={`${t(locale, 'series.partLabel')} ${index + 1} / ${series.count}`}
        >
          <div className="h-full rounded-full" style={{ width: `${((index + 1) / series.count) * 100}%`, background: 'var(--accent)' }} />
        </div>
      ) : (
      <div className="mb-3 flex items-center gap-1">
        {series.posts.map((p, i) => (
          <Link
            key={p.slug}
            href={`/${locale}/posts/${p.slug}`}
            aria-label={p.title}
            title={`${i + 1}. ${p.title}`}
            className="rounded-full transition-all"
            style={{
              width: i === index ? 18 : 8,
              height: 8,
              background: i === index ? 'var(--accent)' : i < index ? 'var(--accent-glow)' : 'var(--border)',
              border: i < index ? '1px solid var(--accent)' : 'none',
            }}
          />
        ))}
      </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        {prev ? (
          <Link
            href={`/${locale}/posts/${prev.slug}`}
            className="rounded-md p-2 transition-colors duration-100"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <div className="mono text-[10px]" style={{ color: 'var(--text-faint)' }}>← {t(locale, 'series.prevPart')}</div>
            <div className="mt-0.5 line-clamp-1" style={{ color: 'var(--text)' }}>{prev.title}</div>
          </Link>
        ) : <div />}
        {next ? (
          <Link
            href={`/${locale}/posts/${next.slug}`}
            className="rounded-md p-2 text-right transition-colors duration-100"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <div className="mono text-[10px]" style={{ color: 'var(--text-faint)' }}>{t(locale, 'series.nextPart')} →</div>
            <div className="mt-0.5 line-clamp-1" style={{ color: 'var(--text)' }}>{next.title}</div>
          </Link>
        ) : <div />}
      </div>

      {series.count > 2 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors"
            style={{
              background: 'transparent',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)',
            }}
            aria-expanded={expanded}
          >
            <ChevronDown
              className="h-3 w-3 transition-transform duration-150"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
            {expanded ? t(locale, 'series.hide') : t(locale, 'series.show')}
          </button>
          {expanded && (
            <ol className="relative mt-2 max-h-72 space-y-1 overflow-y-auto pr-1" ref={(el) => {
              // 긴 시리즈에서도 현재 글이 목록 안에 보이게, 목록 자체만 스크롤한다.
              const cur = el?.querySelector<HTMLElement>('[aria-current="page"]')
              if (el && cur) el.scrollTop = cur.offsetTop - el.clientHeight / 2
            }}>
              {series.posts.map((p, i) => {
                const isCurrent = i === index
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/${locale}/posts/${p.slug}`}
                      className="flex items-baseline gap-2 rounded px-2 py-1 text-xs transition-colors"
                      style={{
                        background: isCurrent ? 'var(--accent-glow)' : 'transparent',
                        color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${isCurrent ? 'var(--accent)' : 'transparent'}`,
                        cursor: isCurrent ? 'default' : 'pointer',
                      }}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <span className="mono shrink-0 tabular-nums" style={{ width: 18, color: 'var(--text-faint)' }}>
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      <span className="line-clamp-1">{p.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </aside>
  )
}
