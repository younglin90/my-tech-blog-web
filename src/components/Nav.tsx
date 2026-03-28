'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Posts' },
  { href: '/tags', label: 'Tags' },
  { href: '/about', label: 'About' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center text-sm">
      {links.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="hidden rounded-md px-2.5 py-1.5 transition-colors duration-100 sm:block"
            style={{
              color: active ? 'var(--text)' : 'var(--text-muted)',
              background: active ? 'var(--surface)' : 'transparent',
              fontWeight: active ? 500 : 400,
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
