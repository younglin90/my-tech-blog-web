'use client'

import { useEffect } from 'react'
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

// CF Pages middleware가 우선 처리하지만 정적 fallback으로 client redirect도 둔다.
// 빌드 시 /index.html로 출력되며 JS 활성화 시 즉시 적절한 locale로 이동한다.
export default function RootRedirect() {
  useEffect(() => {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)locale=(ko|en|ja|zh|es)/)
    const cookieLocale = cookieMatch?.[1] as Locale | undefined

    let target: Locale = DEFAULT_LOCALE
    if (cookieLocale) {
      target = cookieLocale
    } else {
      const lang = (navigator.language || 'en').slice(0, 2).toLowerCase()
      if ((LOCALES as readonly string[]).includes(lang)) target = lang as Locale
      else target = 'en'
    }
    window.location.replace(`/${target}/`)
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#666', fontSize: 13 }}>
      <noscript>
        <p>
          JavaScript is disabled. Choose a language:{' '}
          <a href="/ko/">한국어</a> · <a href="/en/">English</a> ·{' '}
          <a href="/ja/">日本語</a> · <a href="/zh/">中文</a> · <a href="/es/">Español</a>
        </p>
      </noscript>
      <p>Redirecting...</p>
    </div>
  )
}
