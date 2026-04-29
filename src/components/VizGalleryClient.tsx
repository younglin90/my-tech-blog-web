'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { VIZ_COMPONENTS } from '@/lib/viz-registry'
import { t, type Locale } from '@/lib/i18n'

interface VizItem {
  component: string
  type: string
  postSlug: string
  postTitle: string
  postUrl: string
  file?: string
}

type FilterType = 'all' | 'custom' | 'pre-built'

export function VizGalleryClient({ locale, items }: { locale: Locale; items: VizItem[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const isCustom = item.type === 'custom' || item.type === 'custom-orphan'
      if (filter === 'custom' && !isCustom) return false
      if (filter === 'pre-built' && item.type !== 'pre-built') return false
      if (!deferredQuery) return true
      return [item.component, item.postTitle, item.postSlug, item.file ?? ''].join(' ').toLowerCase().includes(deferredQuery)
    })
  }, [deferredQuery, filter, items])

  const customCount = items.filter((item) => item.type === 'custom' || item.type === 'custom-orphan').length
  const prebuiltCount = items.length - customCount

  return (
    <div className="space-y-8">
      <section
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(15,29,46,0.95))',
          border: '1px solid var(--border)',
        }}
      >
        <div className="mono mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>$</span> render post-viz --lazy
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          <div>
            <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {t(locale, 'viz.title')}
            </h1>
            <p className="max-w-2xl text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {t(locale, 'viz.subtitle')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Stat label={t(locale, 'viz.statsTotal')} value={String(items.length)} />
            <Stat label={t(locale, 'viz.statsCustom')} value={String(customCount)} />
            <Stat label={t(locale, 'viz.statsPrebuilt')} value={String(prebuiltCount)} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <label className="flex max-w-xl flex-col gap-1">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'viz.search')}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(locale, 'viz.searchPlaceholder')}
            className="min-h-11 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t(locale, 'viz.all')} / {items.length}
          </FilterChip>
          <FilterChip active={filter === 'custom'} onClick={() => setFilter('custom')}>
            {t(locale, 'viz.custom')} / {customCount}
          </FilterChip>
          <FilterChip active={filter === 'pre-built'} onClick={() => setFilter('pre-built')}>
            {t(locale, 'viz.prebuilt')} / {prebuiltCount}
          </FilterChip>
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-xl p-5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {t(locale, 'viz.empty')}
        </p>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filtered.map((item, index) => {
            const key = `${item.component}-${item.postSlug || index}`
            const Component = VIZ_COMPONENTS[item.component]
            const isOpen = !!open[key]
            const isCustom = item.type === 'custom' || item.type === 'custom-orphan'
            const postHref = item.postUrl ? `/${locale}${item.postUrl}` : ''

            return (
              <article
                key={key}
                className="overflow-hidden rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="mono rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        background: isCustom ? 'var(--accent-glow)' : 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: isCustom ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {isCustom ? t(locale, 'viz.custom') : t(locale, 'viz.prebuilt')}
                    </span>
                    <span className="mono text-xs" style={{ color: 'var(--text-faint)' }}>
                      {item.component}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {postHref ? (
                      <Link href={postHref} className="link-hover-accent">
                        {item.postTitle}
                      </Link>
                    ) : (
                      item.postTitle
                    )}
                  </h2>
                  {item.file && (
                    <p className="mono text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {item.file}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {Component ? (
                      <button
                        onClick={() => setOpen((current) => ({ ...current, [key]: !isOpen }))}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ background: 'var(--accent)', color: '#08111f' }}
                      >
                        {isOpen ? t(locale, 'viz.hide') : t(locale, 'viz.render')}
                      </button>
                    ) : (
                      <span className="rounded-lg px-3 py-1.5 text-xs" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                        {t(locale, 'viz.noRenderer')}
                      </span>
                    )}
                    {postHref && (
                      <Link
                        href={postHref}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 py-1.5 text-xs font-medium"
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
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
