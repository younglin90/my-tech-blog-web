'use client'

import Link from 'next/link'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { VIZ_COMPONENTS } from '@/lib/viz-registry'
import { t, type Locale } from '@/lib/i18n'

interface VizItem {
  component: string
  type: string
  postSlug: string
  postTitle: string
  postUrl: string
  file?: string
  date: string
  series?: string
}

interface Topic {
  slug: string
  title: string
  count: number
}

type FilterType = 'all' | 'custom' | 'pre-built'

const PAGE = 24

// "KarmanVortexStreetSim" → "Karman Vortex Street Sim"
const humanize = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

export function VizGalleryClient({ locale, items, topics }: { locale: Locale; items: VizItem[]; topics: Topic[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [topic, setTopic] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const isCustom = item.type === 'custom' || item.type === 'custom-orphan'
      if (filter === 'custom' && !isCustom) return false
      if (filter === 'pre-built' && item.type !== 'pre-built') return false
      if (topic !== 'all' && item.series !== topic) return false
      if (!deferredQuery) return true
      return [item.component, humanize(item.component), item.postTitle, item.postSlug].join(' ').toLowerCase().includes(deferredQuery)
    })
  }, [deferredQuery, filter, topic, items])

  // 조건이 바뀌면 다시 첫 페이지부터.
  useEffect(() => setLimit(PAGE), [deferredQuery, filter, topic])

  const shown = filtered.slice(0, limit)
  const topicTitle = new Map(topics.map((tp) => [tp.slug, tp.title]))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          {t(locale, 'viz.title')}
        </h1>
        <p className="max-w-2xl text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {t(locale, 'viz.subtitle')}
        </p>
      </header>

      <section className="space-y-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(locale, 'viz.searchPlaceholder')}
          aria-label={t(locale, 'viz.search')}
          className="min-h-11 w-full max-w-xl rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t(locale, 'viz.topic')}>
          <span className="mr-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'viz.topic')}
          </span>
          <FilterChip active={topic === 'all'} onClick={() => setTopic('all')}>
            {t(locale, 'viz.all')} <Count n={items.length} />
          </FilterChip>
          {topics.map((tp) => (
            <FilterChip key={tp.slug} active={topic === tp.slug} onClick={() => setTopic(tp.slug)}>
              {tp.title} <Count n={tp.count} />
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t(locale, 'viz.kind')}>
          <span className="mr-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'viz.kind')}
          </span>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t(locale, 'viz.all')}
          </FilterChip>
          <FilterChip active={filter === 'custom'} onClick={() => setFilter('custom')}>
            {t(locale, 'viz.custom')}
          </FilterChip>
          <FilterChip active={filter === 'pre-built'} onClick={() => setFilter('pre-built')}>
            {t(locale, 'viz.prebuilt')}
          </FilterChip>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }} aria-live="polite">
          {t(locale, 'viz.showing', { shown: String(shown.length), total: String(filtered.length) })}
        </p>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-xl p-5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {t(locale, 'viz.empty')}
        </p>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((item, index) => {
              const key = `${item.component}-${item.postSlug || index}`
              const Component = VIZ_COMPONENTS[item.component]
              const isOpen = !!open[key]
              const postHref = item.postUrl ? `/${locale}${item.postUrl}` : ''

              return (
                <article
                  key={key}
                  className="flex flex-col overflow-hidden rounded-xl"
                  style={{ border: '1px solid var(--border-soft)', background: 'var(--surface)', gridColumn: isOpen ? '1 / -1' : undefined }}
                >
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <div className="mono flex flex-wrap gap-x-2 text-[11px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                      <span>{item.date.replaceAll('-', '.')}</span>
                      {item.series && <span style={{ color: 'var(--accent)' }}>{topicTitle.get(item.series)}</span>}
                    </div>
                    <h2 className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                      {humanize(item.component)}
                    </h2>
                    {postHref ? (
                      <Link href={postHref} className="line-clamp-2 text-sm link-hover-accent" style={{ color: 'var(--text-muted)' }}>
                        {item.postTitle}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm" style={{ color: 'var(--text-muted)' }}>{item.postTitle}</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      {Component ? (
                        <button
                          onClick={() => setOpen((current) => ({ ...current, [key]: !isOpen }))}
                          aria-expanded={isOpen}
                          className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
                        >
                          {isOpen ? t(locale, 'viz.hide') : t(locale, 'viz.render')}
                        </button>
                      ) : (
                        <span className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                          {t(locale, 'viz.noRenderer')}
                        </span>
                      )}
                      {postHref && (
                        <Link
                          href={postHref}
                          className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          {t(locale, 'viz.openPost')}
                        </Link>
                      )}
                    </div>
                  </div>

                  {isOpen && Component && (
                    <div className="border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      <Component />
                    </div>
                  )}
                </article>
              )
            })}
          </section>
          {shown.length < filtered.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {t(locale, 'viz.loadMore', { shown: String(shown.length), total: String(filtered.length) })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Count({ n }: { n: number }) {
  return <span className="mono ml-1 tabular-nums opacity-70">{n}</span>
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: active ? 'var(--accent-glow)' : 'var(--surface)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  )
}
