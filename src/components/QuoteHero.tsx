'use client'

import { useState, useEffect } from 'react'
import { QUOTES } from '@/lib/quotes'

export function QuoteHero() {
  // Avoid hydration mismatch — start with deterministic index, then randomize after mount
  const [seed, setSeed] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSeed(Math.floor(Math.random() * QUOTES.length))
  }, [])

  const item = QUOTES[seed % QUOTES.length]
  const words = item.q.split(' ')
  const accentCount = Math.min(2, Math.max(1, Math.floor(words.length * 0.18)))
  const head = words.slice(0, words.length - accentCount).join(' ')
  const tail = words.slice(words.length - accentCount).join(' ').replace(/[.!?"”']+$/, '')
  const trailMatch = item.q.match(/[.!?"”']+$/)
  const trail = trailMatch ? trailMatch[0] : ''

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
          onClick={() => setSeed(Math.floor(Math.random() * QUOTES.length))}
          disabled={!mounted}
          className="mono transition-colors duration-100"
          title="다음 격언"
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
        압축성 다상유동 연구자의 작업 노트. Riemann solver 유도, interface capturing 기법, 논문 리뷰까지 —
        실무에서 마주치는 디테일만 기록합니다.
      </p>
    </div>
  )
}
