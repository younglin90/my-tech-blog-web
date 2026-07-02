'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { NotFoundSearch } from '@/components/NotFoundSearch'
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, t, type Locale } from '@/lib/i18n'

interface RecentPost {
  slug: string
  title: string
  date: string
}

// 404는 [locale] 세그먼트 밖의 전역 페이지라 서버에서 locale을 알 수 없다.
// URL prefix → locale 쿠키 → 기본값 순으로 클라이언트에서 감지해 문구·링크를 현지화한다.
function detectLocale(): Locale {
  const fromPath = window.location.pathname.match(/^\/(ko|en|ja|zh|es)(?=\/|$)/)?.[1]
  if (fromPath) return fromPath as Locale
  const fromCookie = document.cookie.match(/(?:^|;\s*)locale=(ko|en|ja|zh|es)/)?.[1]
  if (fromCookie) return fromCookie as Locale
  return DEFAULT_LOCALE
}

export function NotFoundContent({ recent }: { recent: RecentPost[] }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    setLocale(detectLocale())
  }, [])

  return (
    <div className="py-16">
      <div className="mb-12 text-center">
        <p
          className="text-[7rem] font-bold leading-none tracking-tighter"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--border)' }}
        >
          404
        </p>
        <p className="mt-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {t(locale, 'notFound.title')}
        </p>
        <p className="mt-2 max-w-sm mx-auto text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'notFound.description')}
        </p>
        <div className="mt-6 flex justify-center">
          <NotFoundSearch locale={locale} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={`/${locale}`}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {t(locale, 'common.backToHome')}
          </Link>
          <Link
            href={`/${locale}/tags`}
            className="rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {t(locale, 'notFound.browseTags')}
          </Link>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-faint)' }}>
          {t(locale, 'notFound.otherLanguages')}:{' '}
          {LOCALES.filter((l) => l !== locale).map((l, i, arr) => (
            <span key={l}>
              <Link href={`/${l}`} className="underline">{LOCALE_LABELS[l]}</Link>
              {i < arr.length - 1 && ' · '}
            </span>
          ))}
        </p>
      </div>

      {recent.length > 0 && (
        <div className="mx-auto max-w-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'notFound.recentPosts')}
          </p>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recent.map((post) => (
              <div key={post.slug} className="py-3">
                <Link href={`/${locale}/posts/${post.slug}`} className="link-hover-accent text-sm font-medium">
                  {post.title}
                </Link>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {format(parseISO(post.date), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
