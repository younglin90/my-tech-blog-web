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
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.09), rgba(15,29,46,0.95))',
          border: '1px solid var(--border)',
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <div>
            <div className="mono mb-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent)' }}>$</span> ls tools/
            </div>
            <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {t(locale, 'tools.title')}
            </h1>
            <p className="max-w-2xl text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {t(locale, 'tools.subtitle')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label={t(locale, 'tools.statsTools')} value={String(CALCULATORS.length)} />
            <StatCard label={t(locale, 'tools.statsCategories')} value={String(CATEGORY_ORDER.length)} />
            <StatCard label={t(locale, 'tools.statsRuntime')} value={t(locale, 'tools.browserOnly')} />
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
          {CATEGORY_ORDER.map((category) => {
            const count = CALCULATORS.filter((tool) => tool.category === category).length
            return (
              <FilterChip
                key={category}
                active={activeCategory === category}
                onClick={() => setActiveCategoryRaw(category)}
              >
                {getCategoryLabel(category, locale)} / {count}
              </FilterChip>
            )
          })}
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
                {group.label} / {group.items.length}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div className="mono mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>{value}</div>
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
  return (
    <div className="group relative">
      <Link
        href={`/${locale}/tools/${slug}`}
        className="block rounded-xl p-4 transition-colors duration-100"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
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
