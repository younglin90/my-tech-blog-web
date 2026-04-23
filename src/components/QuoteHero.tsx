'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { QUOTES_BY_LOCALE, type Locale } from '@/lib/quotes'
import { localePathPrefix, t } from '@/lib/i18n'

export function QuoteHero() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const quoteList = QUOTES_BY_LOCALE[locale as Locale] ?? QUOTES_BY_LOCALE.ko

  const [seed, setSeed] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSeed(Math.floor(Math.random() * quoteList.length))
  }, [quoteList.length])

  const item = quoteList[seed % quoteList.length]
  const words = item.q.split(' ')
  const accentCount = Math.min(2, Math.max(1, Math.floor(words.length * 0.18)))
  const head = words.slice(0, words.length - accentCount).join(' ')
  const tail = words
    .slice(words.length - accentCount)
    .join(' ')
    .replace(/[.!?"”']+$/, '')
  const trailMatch = item.q.match(/[.!?"”']+$/)
  const trail = trailMatch ? trailMatch[0] : ''

  const shuffleTitle =
    locale === 'ko' ? '다음 격언'
      : locale === 'ja' ? '次の格言'
      : locale === 'zh' ? '下一句'
      : locale === 'es' ? 'Siguiente cita'
      : 'Next quote'

  return (
    <div
      className="mb-10"
      style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 18, position: 'relative' }}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
          ~/fortune.txt
        </div>
        <button
          onClick={() => setSeed(Math.floor(Math.random() * quoteList.length))}
          disabled={!mounted}
          className="mono transition-colors duration-100"
          title={shuffleTitle}
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            letterSpacing: '0.05em',
            cursor: mounted ? 'pointer' : 'default',
          }}
        >
          ↻ shuffle
        </button>
      </div>
      <h1
        className="display"
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          textWrap: 'pretty',
          color: 'var(--text)',
        }}
      >
        <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>“</span>
        {head}
        {tail && (
          <>
            {' '}
            <span style={{ color: 'var(--accent)' }}>{tail}</span>
          </>
        )}
        {trail && trail.replace(/["”']/g, '')}
        <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>”</span>
      </h1>
      <div
        className="mono"
        style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.05em' }}
      >
        — {item.a}
      </div>
      <p style={{ marginTop: 18, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 580 }}>
        {t(locale, 'home.subtitle')}
      </p>
    </div>
  )
}
