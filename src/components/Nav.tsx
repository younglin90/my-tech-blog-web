'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

// 상단 내비게이션. 모바일(< sm)은 MobileNav 하단 바가 맡는다.
const links = [
  { path: '', tKey: 'nav.posts' },
  { path: '/tags', tKey: 'nav.tags' },
  { path: '/series', tKey: 'nav.series' },
  { path: '/tools', tKey: 'nav.tools' },
  { path: '/viz', tKey: 'nav.viz' },
  { path: '/glossary', tKey: 'nav.glossary' },
  { path: '/about', tKey: 'nav.about' },
]

export function Nav() {
  const pathname = usePathname() ?? '/'
  const { locale, rest } = localePathPrefix(pathname)

  return (
    <nav className="hidden items-center sm:flex" aria-label="Main navigation">
      {links.map(({ path, tKey }) => {
        const active = path === '' ? rest === '/' || rest.startsWith('/posts') : rest.startsWith(path)
        return (
          <Link
            key={path}
            href={`/${locale}${path}`}
            aria-current={active ? 'page' : undefined}
            className="site-nav-link"
          >
            {t(locale, tKey)}
          </Link>
        )
      })}
    </nav>
  )
}
