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
  visibleCalculators,
  type CalculatorCategory,
  type CalculatorMeta,
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
  const [searchFocused, setSearchFocused] = useState(false)
  const tools = useMemo(() => visibleCalculators(), [])
  const bySlug = useMemo(() => new Map(CALCULATORS.map((tool) => [tool.slug, tool])), [])
  const activeCategory: CalculatorCategory | 'all' = useMemo(() => {
    return activeCategoryRaw === 'all' || CATEGORY_ORDER.includes(activeCategoryRaw as CalculatorCategory)
      ? (activeCategoryRaw as CalculatorCategory | 'all')
      : 'all'
  }, [activeCategoryRaw])
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const resolveListed = (slug: string): CalculatorMeta | undefined => {
    const tool = bySlug.get(slug)
    if (!tool) return undefined
    if (tool.aliasOf) return bySlug.get(tool.aliasOf)
    return tool
  }

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

  const uniqueResolved = (slugs: string[]) => {
    const seen = new Set<string>()
    const out: CalculatorMeta[] = []
    for (const slug of slugs) {
      const tool = resolveListed(slug)
      if (!tool || seen.has(tool.slug)) continue
      seen.add(tool.slug)
      out.push(tool)
    }
    return out
  }

  const favoriteTools = uniqueResolved(favoriteSlugs)
  const recentTools = uniqueResolved(recentSlugs)

  const filtered = tools.filter((tool) => {
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

  const featured = tools.filter((tool) => FEATURED_CALCULATOR_SLUGS.includes(tool.slug))
  const activeLabel = activeCategory === 'all' ? null : getCategoryLabel(activeCategory, locale)
  const grouped = CATEGORY_ORDER
    .map((category) => ({
      category,
      label: getCategoryLabel(category, locale),
      items: filtered.filter((tool) => tool.category === category),
    }))
    .filter((group) => group.items.length > 0)
  const showRails = !deferredQuery && activeCategory === 'all'

  return (
    <div id="tools-top" className="space-y-8">
      <header>
        <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          {t(locale, 'tools.title')}
        </h1>
        <p className="max-w-2xl text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {t(locale, 'tools.subtitle')}
        </p>
      </header>

      <section className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr,auto]">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {t(locale, 'tools.search')}
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => startTransition(() => setQuery(e.target.value))}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={t(locale, 'tools.searchPlaceholder')}
              className="min-h-11 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{
                background: 'var(--bg)',
                border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--border)'}`,
                color: 'var(--text)',
              }}
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

        <div className="mono text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
          {filtered.length} {t(locale, 'tools.matches')}
          {activeLabel ? ` / ${activeLabel}` : ''}
          {deferredQuery ? ` / "${deferredQuery}"` : ''}
        </div>
      </section>

      {showRails && (favoriteTools.length > 0 || recentTools.length > 0) && (
        <section className="space-y-2">
          {favoriteTools.length > 0 && (
            <ChipRow label={`★ ${t(locale, 'tools.favorites')}`} accent>
              {favoriteTools.map((tool) => (
                <ToolChip key={tool.slug} locale={locale} slug={tool.slug} title={tool.title[locale]} />
              ))}
            </ChipRow>
          )}
          {recentTools.length > 0 && (
            <ChipRow
              label={t(locale, 'tools.recentlyViewed')}
              action={
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem(RECENT_TOOLS_KEY)
                    } catch {}
                    setRecentSlugs([])
                  }}
                  className="inline-flex min-h-11 items-center px-1 text-[11px] underline-offset-2 hover:underline"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {t(locale, 'tools.clearRecent')}
                </button>
              }
            >
              {recentTools.slice(0, 6).map((tool) => (
                <ToolChip key={tool.slug} locale={locale} slug={tool.slug} title={tool.title[locale]} />
              ))}
            </ChipRow>
          )}
        </section>
      )}

      {showRails && (
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'tools.featured')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {featured.slice(0, 8).map((tool) => (
              <ToolChip key={tool.slug} locale={locale} slug={tool.slug} title={tool.title[locale]} />
            ))}
          </div>
        </section>
      )}

      {activeCategory !== 'all' && (
        <button
          type="button"
          onClick={() => setActiveCategoryRaw('all')}
          className="inline-flex min-h-11 items-center text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {t(locale, 'tools.backToOverview')}
        </button>
      )}

      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.category} id={`tools-category-${group.category}`} style={{ scrollMarginTop: 96 }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  <span
                    className="mono rounded px-2 py-0.5 text-[10px]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                  >
                    {String(group.items.length).padStart(2, '0')}
                  </span>
                  {group.label}
                </h2>
                <a
                  href="#tools-top"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-[10px] uppercase tracking-widest"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {t(locale, 'tools.backToTop')}
                </a>
              </div>
              <div className="overflow-hidden rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {group.items.map((tool, index) => (
                  <ToolRow
                    key={tool.slug}
                    locale={locale}
                    slug={tool.slug}
                    title={tool.title[locale]}
                    desc={tool.desc[locale]}
                    first={index === 0}
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

function ToolRow({
  locale,
  slug,
  title,
  desc,
  first,
  isFavorite,
  onToggleFavorite,
}: {
  locale: Locale
  slug: string
  title: string
  desc: string
  first?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (slug: string) => void
}) {
  const labelAdd = t(locale, 'tools.favoriteAdd')
  const labelRemove = t(locale, 'tools.favoriteRemove')
  return (
    <div className="relative" style={first ? undefined : { borderTop: '1px solid var(--border)' }}>
      <Link href={`/${locale}/tools/${slug}`} className="block py-3 pl-4 pr-14 transition-colors hover:[background:var(--bg)]">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-5">
          <h3
            className="text-[15px] font-semibold link-hover-accent sm:w-72 sm:shrink-0"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            {title}
          </h3>
          <p className="line-clamp-2 text-sm sm:line-clamp-1" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {desc}
          </p>
        </div>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? labelRemove : labelAdd}
          title={isFavorite ? labelRemove : labelAdd}
          onClick={() => onToggleFavorite(slug)}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-base leading-none"
          style={{ color: isFavorite ? 'var(--accent)' : 'var(--text-faint)', background: 'transparent' }}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  )
}

function ChipRow({ label, accent, action, children }: { label: string; accent?: boolean; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent ? 'var(--accent)' : 'var(--text-faint)' }}>
        {label}
      </span>
      {children}
      {action}
    </div>
  )
}

function ToolChip({ locale, slug, title }: { locale: Locale; slug: string; title: string }) {
  return (
    <Link
      href={`/${locale}/tools/${slug}`}
      className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium transition-colors hover:[border-color:var(--accent)]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
    >
      {title}
    </Link>
  )
}
