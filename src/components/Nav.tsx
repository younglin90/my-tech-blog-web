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
    <nav className="flex items-center text-sm" aria-label="Main navigation">
      {links.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`hidden rounded-md px-2.5 py-1.5 transition-colors duration-100 sm:block ${active ? '' : 'nav-link'}`}
            aria-current={active ? 'page' : undefined}
            style={{
              color: active ? 'var(--text)' : undefined,
              background: active ? 'var(--surface)' : 'transparent',
              fontWeight: active ? 500 : 400,
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
