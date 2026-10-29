'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { VisitorCount } from '@/components/VisitorCount'
import { localePathPrefix, t } from '@/lib/i18n'

export function SiteFooter() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const links: [string, string][] = [
    [`/${locale}/bookmarks`, t(locale, 'nav.bookmarks')],
    [`/${locale}/privacy`, t(locale, 'footer.privacy')],
    [locale === 'ko' ? '/feed.xml' : `/feed-${locale}.xml`, 'RSS'],
    ['https://github.com/younglin90', 'GitHub'],
  ]

  return (
    <footer className="mt-24 border-t pt-6 text-xs" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-faint)' }}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <span>{t(locale, 'footer.copyright')}</span>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map(([href, label]) =>
            href.startsWith('http') ? (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="link-hover-text">{label}</a>
            ) : (
              <Link key={href} href={href} className="link-hover-text">{label}</Link>
            ),
          )}
        </nav>
      </div>
      <div className="mt-3">
        <VisitorCount />
      </div>
    </footer>
  )
}
