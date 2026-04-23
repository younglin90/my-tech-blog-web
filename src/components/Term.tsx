'use client'

import { usePathname } from 'next/navigation'
import { localePathPrefix } from '@/lib/i18n'
import glossary from '@/lib/glossary.json'

interface Entry { ko: string; en: string; wiki?: string }

// MDX에서 사용: <Term name="Reynolds">Reynolds 수</Term>
// 마우스오버 시 정의 툴팁 + 클릭 시 /glossary#reynolds 로 이동.
export function Term({ name, children }: { name: string; children?: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const entry = (glossary as Record<string, Entry>)[name]
  if (!entry) return <>{children ?? name}</>
  const def = locale === 'ko' ? entry.ko : entry.en

  return (
    <a
      href={`/${locale}/glossary#${name.toLowerCase()}`}
      title={def}
      className="inline-block"
      style={{
        color: 'var(--accent)',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '3px',
      }}
    >
      {children ?? name}
    </a>
  )
}
