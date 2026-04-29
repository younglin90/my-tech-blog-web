'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { VisitorCount } from '@/components/VisitorCount'
import { RandomPostLink } from '@/components/RandomPostLink'
import { localePathPrefix, t } from '@/lib/i18n'

export function TerminalFooter() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  return (
    <footer
      className="mt-20 flex flex-col gap-4 rounded-lg px-5 py-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span>
          <span style={{ color: 'var(--accent)' }}>$</span> {t(locale, 'footer.uptime')}
        </span>
        <VisitorCount />
        <span>{t(locale, 'footer.copyright')}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" style={{ color: 'var(--text-faint)' }}>
        <Link href={`/${locale}/tags`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.tags').toLowerCase()}</Link>
        <Link href={`/${locale}/series`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.series').toLowerCase()}</Link>
        <Link href={`/${locale}/tools`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.tools').toLowerCase()}</Link>
        <Link href={`/${locale}/viz`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.viz').toLowerCase()}</Link>
        <Link href={`/${locale}/glossary`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.glossary').toLowerCase()}</Link>
        <Link href={`/${locale}/bookmarks`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.bookmarks').toLowerCase()}</Link>
        <Link href={`/${locale}/about`} className="link-hover-text inline-flex min-h-11 items-center">{t(locale, 'nav.about').toLowerCase()}</Link>
        <RandomPostLink locale={locale} label={t(locale, 'footer.random')} />
        <a href="/feed.xml" className="link-hover-text-accent inline-flex min-h-11 items-center">{t(locale, 'footer.rss')}</a>
        <a href="https://github.com/younglin90" target="_blank" rel="noopener noreferrer" className="link-hover-text inline-flex min-h-11 items-center">
          {t(locale, 'footer.github')}
        </a>
        <span className="ml-auto hidden sm:inline">
          {t(locale, 'footer.shortcutsHint')}
        </span>
      </div>
    </footer>
  )
}
