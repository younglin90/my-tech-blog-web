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
        className="relative overflow-hidden rounded-3xl"
        style={{
          background:
            'radial-gradient(circle at 16% 16%, rgba(34,211,238,0.24), transparent 30%), radial-gradient(circle at 88% 14%, rgba(129,140,248,0.18), transparent 30%), linear-gradient(135deg, rgba(8,17,31,0.98), rgba(15,29,46,0.94))',
          border: '1px solid var(--border)',
          boxShadow: '0 30px 90px rgba(8,17,31,0.32)',
        }}
      >
        <div className="grid lg:grid-cols-[1.05fr,0.95fr]">
          <div className="relative z-10 p-5 sm:p-7 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.28)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 18px #22d3ee' }} />
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#22d3ee' }}>
                post-viz gallery
              </span>
            </div>
            <h1 className="display max-w-xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl" style={{ color: '#e2e8f0' }}>
              {t(locale, 'viz.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base" style={{ color: '#a8b3c4', lineHeight: 1.75 }}>
              {t(locale, 'viz.subtitle')}
            </p>
          </div>
          <div className="relative min-h-[280px] border-t lg:border-l lg:border-t-0" style={{ borderColor: 'var(--border)' }}>
            <VizHeroGraphic customCount={customCount} prebuiltCount={prebuiltCount} />
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
            {t(locale, 'viz.all')}
          </FilterChip>
          <FilterChip active={filter === 'custom'} onClick={() => setFilter('custom')}>
            {t(locale, 'viz.custom')}
          </FilterChip>
          <FilterChip active={filter === 'pre-built'} onClick={() => setFilter('pre-built')}>
            {t(locale, 'viz.prebuilt')}
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
                        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
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

function VizHeroGraphic({ customCount, prebuiltCount }: { customCount: number; prebuiltCount: number }) {
  const total = Math.max(customCount + prebuiltCount, 1)
  const customPct = Math.max(18, Math.round((customCount / total) * 100))

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 560 360" className="h-full w-full" role="img" aria-label="Lazy-rendered CFD visualization gallery">
        <defs>
          <linearGradient id="viz-hero-stream" x1="0" x2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.82" />
          </linearGradient>
          <radialGradient id="viz-hero-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <pattern id="viz-hero-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="360" fill="rgba(8,17,31,0.24)" />
        <rect width="560" height="360" fill="url(#viz-hero-grid)" />
        <circle cx="300" cy="174" r="170" fill="url(#viz-hero-glow)" />
        {[72, 118, 164, 210, 256].map((y, index) => (
          <path
            key={y}
            d={`M-18 ${y} C104 ${y - 36}, 156 ${y + 42}, 252 ${y - 8} S420 ${y - 30}, 586 ${y + 18}`}
            fill="none"
            stroke={index % 2 ? '#818cf8' : '#22d3ee'}
            strokeWidth={index === 2 ? 4 : 2.4}
            strokeLinecap="round"
            strokeDasharray="12 16"
            opacity={index === 2 ? 0.88 : 0.58}
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-56" dur={`${4.2 + index * 0.35}s`} repeatCount="indefinite" />
          </path>
        ))}
        <g transform="translate(306 178)">
          <circle r="78" fill="rgba(8,17,31,0.72)" stroke="url(#viz-hero-stream)" strokeWidth="3" />
          <path d="M-52 16 C-30 -52 44 -48 56 8 C32 54 -26 62 -52 16 Z" fill="none" stroke="#22d3ee" strokeWidth="4" strokeDasharray="14 12">
            <animate attributeName="stroke-dashoffset" from="0" to="-72" dur="5.4s" repeatCount="indefinite" />
          </path>
          <circle cx="-14" cy="-6" r="9" fill="#fb923c">
            <animate attributeName="cx" values="-32;30;-32" dur="4.8s" repeatCount="indefinite" />
            <animate attributeName="cy" values="-20;18;-20" dur="4.8s" repeatCount="indefinite" />
          </circle>
        </g>
        <g transform="translate(88 272)">
          <rect width="380" height="18" rx="9" fill="rgba(8,17,31,0.72)" stroke="rgba(148,163,184,0.18)" />
          <rect width={(380 * customPct) / 100} height="18" rx="9" fill="url(#viz-hero-stream)" opacity="0.78" />
          <text x="0" y="-12" className="mono" fill="#94a3b8" fontSize="12">custom renderers</text>
          <text x="390" y="14" className="mono" fill="#e2e8f0" fontSize="12">{customCount}</text>
        </g>
        <g transform="translate(88 316)">
          <rect width="260" height="12" rx="6" fill="rgba(129,140,248,0.28)" />
          <rect width={Math.max(34, Math.min(260, prebuiltCount * 18))} height="12" rx="6" fill="#818cf8" opacity="0.64" />
          <text x="0" y="-10" className="mono" fill="#94a3b8" fontSize="12">shared components</text>
          <text x="272" y="11" className="mono" fill="#e2e8f0" fontSize="12">{prebuiltCount}</text>
        </g>
      </svg>
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
