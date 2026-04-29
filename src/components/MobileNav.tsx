'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Activity, Bookmark, BookOpen, FileText, Layers, Menu, Search, Tag, User, Wrench, X } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'

const primaryLinks = [
  { path: '', tKey: 'nav.posts', Icon: FileText },
  { path: '/series', tKey: 'nav.series', Icon: Layers },
  { path: '/tools', tKey: 'nav.tools', Icon: Wrench },
]

const moreLinks = [
  { path: '/viz', tKey: 'nav.viz', Icon: Activity },
  { path: '/glossary', tKey: 'nav.glossary', Icon: BookOpen },
  { path: '/tags', tKey: 'nav.tags', Icon: Tag },
  { path: '/bookmarks', tKey: 'nav.bookmarks', Icon: Bookmark },
  { path: '/about', tKey: 'nav.about', Icon: User },
]

export function MobileNav() {
  const pathname = usePathname() ?? '/'
  const { locale, rest } = localePathPrefix(pathname)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreLinks.some(({ path }) => rest.startsWith(path))

  const openSearch = () => {
    setMoreOpen(false)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
  }

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 w-full bg-black/45"
            aria-label="Close navigation menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="mobile-more-nav"
            className="absolute bottom-[calc(64px+env(safe-area-inset-bottom))] left-3 right-3 overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                {t(locale, 'nav.more')}
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {moreLinks.map(({ path, tKey, Icon }) => {
                const href = `/${locale}${path}`
                const active = rest.startsWith(path)
                return (
                  <Link
                    key={path}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex min-h-16 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium"
                    style={{
                      background: active ? 'var(--accent-glow)' : 'var(--bg)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2 : 1.5} />
                    <span className="min-w-0 truncate">{t(locale, tKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex w-full max-w-full overflow-hidden sm:hidden"
        style={{
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {primaryLinks.map(({ path, tKey, Icon }) => {
          const href = `/${locale}${path}`
          const active = path === '' ? rest === '/' : rest.startsWith(path)
          return (
            <Link
              key={path}
              href={href}
              onClick={() => setMoreOpen(false)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-100"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              <span className="truncate">{t(locale, tKey)}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={openSearch}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
          <span className="truncate">{t(locale, 'nav.search')}</span>
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-100"
          style={{ color: moreActive || moreOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-nav"
        >
          <Menu className="h-5 w-5" strokeWidth={moreActive || moreOpen ? 2 : 1.5} />
          <span className="truncate">{t(locale, 'nav.more')}</span>
        </button>
      </nav>
    </>
  )
}
