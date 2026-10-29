'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { Search } from '@/components/Search'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { localePathPrefix } from '@/lib/i18n'

export function SiteHeader() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  return (
    <header className="site-header">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4 sm:px-7">
        <Link href={`/${locale}`} className="display shrink-0 whitespace-nowrap" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          {locale === 'ko' ? '영린' : 'Younglin'}
          <span style={{ color: 'var(--accent)' }}>{"'s"}</span> CFD Blog
        </Link>
        <div className="flex-1" />
        <Nav />
        <div className="flex shrink-0 items-center">
          <Search />
          <LanguageSwitcher current={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
