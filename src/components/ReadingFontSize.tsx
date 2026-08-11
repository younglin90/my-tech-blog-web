'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

const KEY = 'cfd-lab-reading-scale'
const SCALES = [
  { id: 'sm', factor: 1, label: 'A', size: 12 },
  { id: 'md', factor: 1.1, label: 'A', size: 14 },
  { id: 'lg', factor: 1.2, label: 'A', size: 16 },
] as const

type ScaleId = typeof SCALES[number]['id']

function applyScale(id: ScaleId) {
  const s = SCALES.find((x) => x.id === id) ?? SCALES[0]
  document.documentElement.style.setProperty('--reading-scale', String(s.factor))
}

// 포스트 글자 크기 토글 (A / A / A — 작게/보통/크게).
// CSS 변수 --reading-scale을 prose font-size에 곱해 적용.
// localStorage로 선호 유지 (페이지 이동 후에도 동일 크기).
export function ReadingFontSize() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [active, setActive] = useState<ScaleId>('sm')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    let stored: ScaleId = 'sm'
    try {
      const raw = localStorage.getItem(KEY) as ScaleId | null
      if (raw && SCALES.some((s) => s.id === raw)) stored = raw
    } catch {}
    setActive(stored)
    // applyScale은 여기서 부르지 않는다 — 루트 layout의 pre-paint 스크립트가
    // 이미 첫 페인트 전에 --reading-scale을 세팅했다. 여기서 또 부르면 의미는 같지만
    // hydration 시점에 한 번 더 스타일을 건드려 본문 리플로우를 유발한다.
  }, [])

  const select = (id: ScaleId) => {
    setActive(id)
    applyScale(id)
    try { localStorage.setItem(KEY, id) } catch {}
  }

  if (!hydrated) return null

  return (
    <div
      role="group"
      aria-label={t(locale, 'reading.fontSize')}
      className="inline-flex min-h-11 items-center rounded-md"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {SCALES.map((s) => {
        const isActive = s.id === active
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => select(s.id)}
            aria-pressed={isActive}
            title={`${t(locale, 'reading.fontSize')} ${s.id.toUpperCase()}`}
            className="flex items-center justify-center transition-colors"
            style={{
              width: 44,
              minHeight: 44,
              fontSize: s.size,
              fontFamily: 'var(--font-display)',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--accent)' : 'var(--text-faint)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              borderLeft: s.id === 'sm' ? 'none' : '1px solid var(--border)',
            }}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
