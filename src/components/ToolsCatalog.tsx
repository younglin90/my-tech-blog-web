'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { RECENT_TOOLS_KEY } from '@/components/ToolViewTracker'
import {
  CALCULATORS,
  CATEGORY_ORDER,
  FEATURED_CALCULATOR_SLUGS,
  getCategoryLabel,
  type CalculatorCategory,
} from '@/lib/calculators'
import { t, type Locale } from '@/lib/i18n'
import { useUrlParam } from '@/lib/use-url-param'

const FAVORITES_KEY = 'cfd-lab-tool-favorites'

function loadFavorites(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch { return [] }
}

function saveFavorites(slugs: string[]) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(slugs)) } catch {}
}

export function ToolsCatalog({ locale }: { locale: Locale }) {
  const [query, setQuery] = useUrlParam<string>('q', '', 'string')
  const [activeCategoryRaw, setActiveCategoryRaw] = useUrlParam<string>('cat', 'all', 'string')
  const [recentSlugs, setRecentSlugs] = useState<string[]>([])
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([])
  const activeCategory: CalculatorCategory | 'all' = useMemo(() => {
    return activeCategoryRaw === 'all' || CATEGORY_ORDER.includes(activeCategoryRaw as CalculatorCategory)
      ? (activeCategoryRaw as CalculatorCategory | 'all')
      : 'all'
  }, [activeCategoryRaw])
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_TOOLS_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      setRecentSlugs(Array.isArray(parsed) ? parsed : [])
    } catch {
      setRecentSlugs([])
    }
    setFavoriteSlugs(loadFavorites())
  }, [])

  const toggleFavorite = (slug: string) => {
    setFavoriteSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      saveFavorites(next)
      return next
    })
  }
  const isFav = (slug: string) => favoriteSlugs.includes(slug)
  const favoriteTools = favoriteSlugs
    .map((slug) => CALCULATORS.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof CALCULATORS)[number] => Boolean(tool))

  const filtered = CALCULATORS.filter((tool) => {
    if (activeCategory !== 'all' && tool.category !== activeCategory) return false
    if (!deferredQuery) return true

    const haystack = [
      tool.title[locale],
      tool.title.en,
      tool.desc[locale],
      tool.desc.en,
      tool.tags.join(' '),
      tool.slug,
    ].join(' ').toLowerCase()

    return haystack.includes(deferredQuery)
  })

  const featured = CALCULATORS.filter((tool) => FEATURED_CALCULATOR_SLUGS.includes(tool.slug))
  const recentTools = recentSlugs
    .map((slug) => CALCULATORS.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof CALCULATORS)[number] => Boolean(tool))
  const activeLabel = activeCategory === 'all' ? null : getCategoryLabel(activeCategory, locale)
  const grouped = CATEGORY_ORDER
    .map((category) => ({
      category,
      label: getCategoryLabel(category, locale),
      items: filtered.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div id="tools-top" className="space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl"
        style={{
          background:
            'radial-gradient(circle at 20% 18%, rgba(34,211,238,0.22), transparent 32%), radial-gradient(circle at 88% 22%, rgba(249,115,22,0.18), transparent 30%), linear-gradient(135deg, rgba(8,17,31,0.98), rgba(15,29,46,0.94))',
          border: '1px solid var(--border)',
          boxShadow: '0 30px 90px rgba(8,17,31,0.32)',
        }}
      >
        <div className="grid gap-0 lg:grid-cols-[1.08fr,0.92fr]">
          <div className="relative z-10 p-5 sm:p-7 lg:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.28)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 18px #22d3ee' }} />
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: '#22d3ee' }}>
                CFD workbench
              </span>
            </div>
            <h1 className="display max-w-2xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl" style={{ color: '#e2e8f0' }}>
              {t(locale, 'tools.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base" style={{ color: '#a8b3c4', lineHeight: 1.75 }}>
              {t(locale, 'tools.subtitle')}
            </p>
          </div>

          <div className="relative min-h-[280px] border-t lg:border-l lg:border-t-0" style={{ borderColor: 'var(--border)' }}>
            <ToolsHeroGraphic locale={locale} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr,auto]">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              {t(locale, 'tools.search')}
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => startTransition(() => setQuery(e.target.value))}
              placeholder={t(locale, 'tools.searchPlaceholder')}
              className="min-h-11 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setActiveCategoryRaw('all')
                setQuery('')
              }}
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {t(locale, 'tools.reset')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={activeCategory === 'all'} onClick={() => setActiveCategoryRaw('all')}>
            {t(locale, 'tools.all')}
          </FilterChip>
          {CATEGORY_ORDER.map((category) => (
            <FilterChip
              key={category}
              active={activeCategory === category}
              onClick={() => setActiveCategoryRaw(category)}
            >
              {getCategoryLabel(category, locale)}
            </FilterChip>
          ))}
        </div>

        <div className="mono text-xs" style={{ color: 'var(--text-faint)' }}>
          <span style={{ color: 'var(--accent)' }}>$</span> {filtered.length} {t(locale, 'tools.matches')}
          {activeLabel ? ` / ${activeLabel}` : ''}
          {deferredQuery ? ` / "${deferredQuery}"` : ''}
        </div>
      </section>

      {grouped.length > 1 && (
        <section
          aria-labelledby="tools-jump-nav"
          className="rounded-xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            id="tools-jump-nav"
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-faint)' }}
          >
            {t(locale, 'tools.jumpTo')}
          </div>
          <div className="flex flex-wrap gap-2">
            {grouped.map((group) => (
              <a
                key={group.category}
                href={`#tools-category-${group.category}`}
                className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                {group.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {favoriteTools.length > 0 && !deferredQuery && activeCategory === 'all' && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            ★ {t(locale, 'tools.favorites')} / {favoriteTools.length}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {favoriteTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                locale={locale}
                slug={tool.slug}
                title={tool.title[locale]}
                desc={tool.desc[locale]}
                tags={tool.tags}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {recentTools.length > 0 && !deferredQuery && activeCategory === 'all' && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              {t(locale, 'tools.recentlyViewed')}
            </h2>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem(RECENT_TOOLS_KEY)
                } catch {}
                setRecentSlugs([])
              }}
              className="inline-flex min-h-11 items-center rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {t(locale, 'tools.clearRecent')}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                locale={locale}
                slug={tool.slug}
                title={tool.title[locale]}
                desc={tool.desc[locale]}
                tags={tool.tags}
                isFavorite={isFav(tool.slug)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {!deferredQuery && activeCategory === 'all' && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'tools.featured')}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tool) => (
              <ToolCard key={tool.slug} locale={locale} slug={tool.slug} title={tool.title[locale]} desc={tool.desc[locale]} tags={tool.tags} isFavorite={isFav(tool.slug)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.category} id={`tools-category-${group.category}`} style={{ scrollMarginTop: 96 }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-faint)' }}
                >
                  <span
                    className="mono rounded px-2 py-0.5 text-[10px]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                  >
                    {group.category}
                  </span>
                  {group.label}
                </h2>
                <a
                  href="#tools-top"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-[10px] uppercase tracking-widest transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {t(locale, 'tools.backToTop')}
                </a>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    locale={locale}
                    slug={tool.slug}
                    title={tool.title[locale]}
                    desc={tool.desc[locale]}
                    tags={tool.tags}
                    isFavorite={isFav(tool.slug)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section
          className="rounded-xl p-6 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {t(locale, 'tools.noResults')}{' '}
          <span style={{ color: 'var(--accent)' }}>shock</span>, <span style={{ color: 'var(--accent)' }}>wall</span>,{' '}
          <span style={{ color: 'var(--accent)' }}>diffusion</span>.
        </section>
      )}
    </div>
  )
}

function ToolsHeroGraphic({ locale }: { locale: Locale }) {
  const rings = CATEGORY_ORDER.slice(0, 8).map((category, index) => ({
    category,
    label: getCategoryLabel(category, locale),
    count: CALCULATORS.filter((tool) => tool.category === category).length,
    angle: (index / 8) * Math.PI * 2 - Math.PI / 2,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 560 360" className="h-full w-full" role="img" aria-label="CFD tool category map">
        <defs>
          <radialGradient id="tools-hero-radial" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tools-hero-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <pattern id="tools-hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="560" height="360" fill="rgba(8,17,31,0.18)" />
        <rect width="560" height="360" fill="url(#tools-hero-grid)" />
        <circle cx="280" cy="180" r="155" fill="url(#tools-hero-radial)" />
        {[92, 132, 172].map((r) => (
          <circle key={r} cx="280" cy="180" r={r} fill="none" stroke="rgba(226,232,240,0.12)" strokeWidth="1.5" />
        ))}
        {rings.map(({ category, count, angle }) => {
          const x = 280 + Math.cos(angle) * 138
          const y = 180 + Math.sin(angle) * 102
          const radius = 10 + Math.min(count, 12)
          return (
            <g key={category}>
              <path d={`M280 180 L${x} ${y}`} stroke="rgba(148,163,184,0.22)" strokeWidth="1" />
              <circle cx={x} cy={y} r={radius} fill="rgba(8,17,31,0.86)" stroke="url(#tools-hero-line)" strokeWidth="2.5">
                <animate attributeName="r" values={`${radius - 2};${radius + 3};${radius - 2}`} dur={`${3 + count * 0.08}s`} repeatCount="indefinite" />
              </circle>
              <text x={x} y={y + 4} textAnchor="middle" className="mono" fill="#e2e8f0" fontSize="11" fontWeight="700">
                {count}
              </text>
            </g>
          )
        })}
        <g transform="translate(280 180)">
          <circle r="54" fill="rgba(8,17,31,0.88)" stroke="#22d3ee" strokeWidth="2.5" />
          <path d="M-32 0 C-12 -34 16 -34 34 0 C12 34 -16 34 -32 0 Z" fill="none" stroke="#22d3ee" strokeWidth="3" />
          <path d="M-46 -22 C-8 -52 22 -48 54 -20 M-54 24 C-16 52 20 50 54 20" fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="9 10">
            <animate attributeName="stroke-dashoffset" from="0" to="-38" dur="4s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
      <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2">
        {rings.slice(0, 4).map(({ category, label, count }) => (
          <a
            key={category}
            href={`#tools-category-${category}`}
            className="rounded-xl px-3 py-2 text-xs backdrop-blur transition-colors"
            style={{ background: 'rgba(8,17,31,0.58)', border: '1px solid rgba(148,163,184,0.20)', color: '#a8b3c4' }}
          >
            <span className="mono mr-2" style={{ color: '#22d3ee' }}>{count}</span>
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active: boolean
  onClick: () => void
}) {
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

function ToolCard({
  locale,
  slug,
  title,
  desc,
  tags,
  isFavorite,
  onToggleFavorite,
}: {
  locale: Locale
  slug: string
  title: string
  desc: string
  tags: string[]
  isFavorite?: boolean
  onToggleFavorite?: (slug: string) => void
}) {
  const labelAdd = t(locale, 'tools.favoriteAdd')
  const labelRemove = t(locale, 'tools.favoriteRemove')
  const toolMeta = CALCULATORS.find((tool) => tool.slug === slug)
  return (
    <div className="group relative">
      <Link
        href={`/${locale}/tools/${slug}`}
        className="block overflow-hidden rounded-xl transition-colors duration-100"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <ToolCardGlyph category={toolMeta?.category ?? 'numerics'} />
        <div className="p-4">
          <h3 className="pr-12 text-base font-semibold link-hover-accent" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {desc}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? labelRemove : labelAdd}
          title={isFavorite ? labelRemove : labelAdd}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(slug)
          }}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-md text-base leading-none transition-colors"
          style={{
            color: isFavorite ? 'var(--accent)' : 'var(--text-faint)',
            background: 'transparent',
            border: '1px solid transparent',
          }}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  )
}

function ToolCardGlyph({ category }: { category: CalculatorCategory }) {
  const accent = category === 'heat-transfer' || category === 'reacting-flow' ? '#fb923c' : '#22d3ee'
  const secondary = category === 'multiphase' || category === 'turbulence' ? '#818cf8' : '#14b8a6'

  return (
    <div className="relative h-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(8,17,31,0.96), rgba(15,29,46,0.82))' }}>
      <svg viewBox="0 0 360 96" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`card-grad-${category}`} x1="0" x2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.82" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.66" />
          </linearGradient>
        </defs>
        <path d="M0 72 C70 32 118 84 180 48 S292 24 360 56 V96 H0 Z" fill={`url(#card-grad-${category})`} opacity="0.22" />
        {[34, 50, 66].map((y, index) => (
          <path
            key={y}
            d={`M-12 ${y} C78 ${y - 24}, 120 ${y + 20}, 190 ${y - 4} S302 ${y + 24}, 372 ${y - 10}`}
            fill="none"
            stroke={index % 2 ? secondary : accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="9 13"
            opacity="0.72"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-44" dur={`${4 + index}s`} repeatCount="indefinite" />
          </path>
        ))}
        <circle cx="306" cy="28" r="16" fill="rgba(8,17,31,0.72)" stroke={accent} strokeWidth="2">
          <animate attributeName="r" values="13;18;13" dur="3.2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="absolute left-3 top-3 mono rounded-full px-2 py-1 text-[9px] uppercase tracking-widest" style={{ background: 'rgba(8,17,31,0.62)', color: 'var(--text-faint)', border: '1px solid rgba(148,163,184,0.18)' }}>
        {category}
      </div>
    </div>
  )
}
