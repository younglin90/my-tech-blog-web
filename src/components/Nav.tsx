'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

const internalLinkDefs = [
  { path: '', cmd: 'ls', tKey: 'nav.posts' },
  { path: '/tags', cmd: 'grep', tKey: 'nav.tags' },
  { path: '/series', cmd: 'tree', label: 'series' },
  { path: '/tools', cmd: 'tool', label: 'tools' },
  { path: '/viz', cmd: 'viz', label: 'viz' },
  { path: '/glossary', cmd: 'dict', label: 'glossary' },
  { path: '/bookmarks', cmd: 'fd', tKey: 'nav.bookmarks' },
  { path: '/about', cmd: 'whoami', tKey: 'nav.about' },
]

const externalLinkDefs = [
  { href: '/feed.xml', cmd: 'rss', label: 'rss' },
  { href: 'https://github.com/younglin90', cmd: 'gh', label: 'GitHub' },
]

export function Nav() {
  const pathname = usePathname() ?? '/'
  const { locale, rest } = localePathPrefix(pathname)

  return (
    <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Main navigation">
      {internalLinkDefs.map(({ path, cmd, tKey, label }) => {
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
            <span style={{ fontSize: 13, fontWeight: 500 }}>{tKey ? t(locale, tKey) : label}</span>
          </Link>
        )
      })}
      {externalLinkDefs.map(({ href, cmd, label }) => {
        const active = false
        return (
          <Link
            key={href}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
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
            <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
