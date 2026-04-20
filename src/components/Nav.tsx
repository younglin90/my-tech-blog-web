'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Posts', cmd: 'ls' },
  { href: '/tags', label: 'Tags', cmd: 'grep' },
  { href: '/bookmarks', label: 'Saved', cmd: 'fd' },
  { href: '/about', label: 'About', cmd: 'whoami' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Main navigation">
      {links.map(({ href, label, cmd }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
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
            <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
