'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { Search } from '@/components/Search'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { localePathPrefix, t } from '@/lib/i18n'

function formatPath(pathname: string): string {
  if (pathname === '/') return 'home'
  const segs = pathname.split('/').filter(Boolean)
  return segs
    .map((s, i) => {
      const decoded = decodeURIComponent(s)
      if (i > 0 && decoded.length > 28) return decoded.slice(0, 24) + '…'
      return decoded
    })
    .join('/')
}

export function TerminalHeader() {
  const pathname = usePathname() ?? '/'
  const path = formatPath(pathname)
  const { locale } = localePathPrefix(pathname)

  return (
    <header className="mb-12 sm:mb-16">
      <div
        className="flex items-center gap-3 rounded-t-[10px] px-4 py-[9px]"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
        }}
      >
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="inline-block rounded-full" style={{ width: 11, height: 11, background: '#f87171' }} />
          <span className="inline-block rounded-full" style={{ width: 11, height: 11, background: '#fbbf24' }} />
          <span className="inline-block rounded-full" style={{ width: 11, height: 11, background: '#34d399' }} />
        </div>
        <span className="truncate" style={{ color: 'var(--text-muted)' }}>
          cfd-lab:~/{path}
        </span>
        <span className="ml-auto shrink-0" style={{ color: 'var(--accent)' }}>● {t(locale, 'terminal.online')}</span>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-b-[10px] px-5 py-5"
        style={{
          background: 'var(--code-bg)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href={`/${locale}`} className="flex min-h-11 items-center gap-3.5 text-left">
          <span className="mono" style={{ fontSize: 18, color: 'var(--accent)', fontWeight: 600 }}>$_</span>
          <div>
            <div
              className="display"
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: 'var(--text)',
              }}
            >
              {locale === 'ko'
                ? <>영린<span style={{ color: 'var(--accent)' }}>{"'s"}</span> CFD Blog</>
                : <>Younglin<span style={{ color: 'var(--accent)' }}>{"'s"}</span> CFD Blog</>}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: 'var(--text-muted)',
                marginTop: 4,
                letterSpacing: '0.05em',
              }}
            >
              {t(locale, 'terminal.tagline')}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Search />
          <Nav />
          <LanguageSwitcher current={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
