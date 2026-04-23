'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

const linkDefs = [
  { path: '', cmd: 'ls', tKey: 'nav.posts' },
  { path: '/tags', cmd: 'grep', tKey: 'nav.tags' },
  { path: '/bookmarks', cmd: 'fd', tKey: 'nav.bookmarks' },
  { path: '/about', cmd: 'whoami', tKey: 'nav.about' },
]

export function Nav() {
  const pathname = usePathname() ?? '/'
  const { locale, rest } = localePathPrefix(pathname)

  return (
    <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Main navigation">
      {linkDefs.map(({ path, cmd, tKey }) => {
        const href = `/${locale}${path}`
        const active = path === '' ? rest === '/' : rest.startsWith(path)
        return (
          <Link
            key={path}
            href={href}
            className="hidden sm:inline-flex items-baseline gap-2 rounded-md px-3 py-1.5 transition-colors duration-100"
            aria-current={active ? 'page' : undefined}
            style={{
              border: '1px solid',
              borderColor: active ? 'var(--accent)' : 'var(--border)',
              background: active ? 'var(--accent-glow)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text)',
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-faint)' }}>
              {cmd}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{t(locale, tKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
