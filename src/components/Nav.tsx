'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

const internalLinkDefs = [
  { path: '', cmd: 'ls', tKey: 'nav.posts' },
  { path: '/tags', cmd: 'grep', tKey: 'nav.tags' },
  { path: '/series', cmd: 'tree', tKey: 'nav.series' },
  { path: '/tools', cmd: 'tool', tKey: 'nav.tools' },
  { path: '/viz', cmd: 'viz', tKey: 'nav.viz' },
  { path: '/glossary', cmd: 'dict', tKey: 'nav.glossary' },
  { path: '/bookmarks', cmd: 'fd', tKey: 'nav.bookmarks' },
  { path: '/about', cmd: 'whoami', tKey: 'nav.about' },
]

export function Nav() {
  const pathname = usePathname() ?? '/'
  const { locale, rest } = localePathPrefix(pathname)

  return (
    <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Main navigation">
      {internalLinkDefs.map(({ path, cmd, tKey }) => {
        const href = `/${locale}${path}`
        const active = path === '' ? rest === '/' : rest.startsWith(path)
        return (
          <Link
            key={path}
            href={href}
            className="hidden sm:inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors duration-100 whitespace-nowrap"
            aria-current={active ? 'page' : undefined}
            style={{
              border: '1px solid',
              borderColor: active ? 'var(--accent)' : 'var(--border)',
              background: active ? 'var(--accent-glow)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text)',
              lineHeight: 1,
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: active ? 'var(--accent)' : 'var(--text-faint)',
                lineHeight: 1,
              }}
            >
              {cmd}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1 }}>
              {t(locale, tKey)}
            </span>
          </Link>
        )
      })}
      <Link
        href="https://github.com/younglin90"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t(locale, 'nav.github')}
        title={t(locale, 'nav.github')}
        className="hidden sm:inline-flex items-center justify-center rounded-md transition-colors duration-100"
        style={{
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text)',
          width: 34,
          height: 34,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.22 9.16 7.68 10.64.56.1.77-.25.77-.55 0-.27-.01-1-.02-1.97-3.13.68-3.79-1.51-3.79-1.51-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1.01 1.73 2.64 1.23 3.28.94.1-.73.39-1.23.71-1.51-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.29-.51-1.43.11-2.98 0 0 .95-.3 3.11 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.45 3.11-1.15 3.11-1.15.62 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.33-2.64 5.28-5.15 5.56.4.34.76 1.03.76 2.07 0 1.49-.01 2.69-.01 3.06 0 .3.21.66.78.55C20.03 20.9 23.25 16.7 23.25 11.75 23.25 5.48 18.27.5 12 .5z" />
        </svg>
      </Link>
    </nav>
  )
}
