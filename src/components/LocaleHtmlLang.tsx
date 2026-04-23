'use client'

// Root layout이 <html lang="en">로 고정되어 있지만, 실제 페이지 locale에 맞춰
// document.documentElement.lang을 동적으로 갱신해 a11y/SEO를 보완한다.
// (Next.js App Router에서 [locale] segment의 layout은 <html>을 감쌀 수 없음.)
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, HREFLANG } from '@/lib/i18n'

export function LocaleHtmlLang() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  useEffect(() => {
    document.documentElement.lang = HREFLANG[locale] ?? locale
  }, [locale])

  return null
}
