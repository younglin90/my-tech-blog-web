'use client'

import { usePathname } from 'next/navigation'
import { Github } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { Subscribe } from '@/components/Subscribe'
import { SupportLinks } from '@/components/SupportLinks'

export function AuthorBio() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const name = locale === 'ko' ? "영린's CFD Blog" : "Younglin's CFD Blog"

  return (
    <aside
      className="mt-12 flex flex-col gap-5 rounded-xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: 22 }}
        >
          Y
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{name}</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{t(locale, 'author.role')}</p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'author.bio')}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href="https://github.com/younglin90"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-75"
              style={{ color: 'var(--accent)' }}
            >
              <Github className="h-3.5 w-3.5" />
              github
            </a>
          </div>
        </div>
      </div>
      <Subscribe />
      <SupportLinks />
    </aside>
  )
}
