'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

const STORAGE_KEY = 'cfd-lab-reading-positions'
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000 // 14일
const SAVE_THROTTLE_MS = 1500
const RESTORE_THRESHOLD_PX = 400 // 이 이상 스크롤된 위치만 복원 제안
const COMPLETE_THRESHOLD = 0.94  // 읽기 완료로 간주, 위치 삭제

interface SavedPosition {
  y: number
  pct: number   // 0-1
  ts: number    // 저장 시각 (ms)
}

type Store = Record<string, SavedPosition>

function loadStore(): Store {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as Store
    const now = Date.now()
    // 오래된 항목 자동 정리
    const cleaned: Store = {}
    for (const [k, v] of Object.entries(obj)) {
      if (now - v.ts < MAX_AGE_MS) cleaned[k] = v
    }
    return cleaned
  } catch {
    return {}
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {}
}

// 포스트 페이지에 마운트되어 읽기 위치를 자동 저장·복원한다.
// - 1.5초마다 throttle하여 scrollY와 진행률을 localStorage에 저장
// - 마운트 시 저장된 위치가 있으면 우하단에 "이어서 읽기 (53%)" 토스트 표시
// - 사용자가 94% 이상 스크롤하면 완독으로 간주하여 위치 삭제
// - 14일 지난 위치는 자동 정리
export function ReadingPosition({ postId }: { postId: string }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [resume, setResume] = useState<SavedPosition | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const lastSaveRef = useRef(0)
  const interactedRef = useRef(false)

  // 마운트 시 저장된 위치 확인 → 복원 제안
  useEffect(() => {
    const store = loadStore()
    const saved = store[postId]
    if (saved && saved.y > RESTORE_THRESHOLD_PX) {
      setResume(saved)
    }
  }, [postId])

  // 스크롤 위치 throttled 저장 + 완독 시 삭제
  useEffect(() => {
    const onScroll = () => {
      // 사용자가 스크롤하기 시작하면 복원 토스트 자동 숨김
      if (!interactedRef.current && window.scrollY > 100) {
        interactedRef.current = true
        setResume(null)
      }

      const now = Date.now()
      if (now - lastSaveRef.current < SAVE_THROTTLE_MS) return
      lastSaveRef.current = now

      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(1, window.scrollY / docHeight) : 0

      const store = loadStore()
      if (pct >= COMPLETE_THRESHOLD) {
        // 완독 → 위치 삭제
        if (store[postId]) {
          delete store[postId]
          saveStore(store)
        }
      } else if (window.scrollY > RESTORE_THRESHOLD_PX) {
        store[postId] = { y: window.scrollY, pct, ts: now }
        saveStore(store)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [postId])

  if (!resume || dismissed) return null

  const pct = Math.round(resume.pct * 100)
  const days = Math.max(1, Math.round((Date.now() - resume.ts) / (24 * 60 * 60 * 1000)))

  return (
    <div
      role="dialog"
      aria-label={t(locale, 'reading.resume')}
      className="fixed z-40 flex items-center gap-3 rounded-lg shadow-lg sm:bottom-8 sm:left-8"
      style={{
        bottom: '5rem',
        left: '1rem',
        right: '1rem',
        maxWidth: 360,
        margin: '0 auto',
        padding: '10px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      }}
    >
      <button
        onClick={() => {
          interactedRef.current = true
          window.scrollTo({ top: resume.y, behavior: 'smooth' })
          setResume(null)
        }}
        className="flex-1 text-left text-sm"
        style={{ color: 'var(--text)' }}
      >
        <div className="font-medium" style={{ color: 'var(--accent)' }}>
          ↓ {t(locale, 'reading.resume')}
        </div>
        <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'reading.atPercent', { pct: String(pct), days: String(days) })}
        </div>
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label={t(locale, 'reading.dismiss')}
        className="text-lg"
        style={{ color: 'var(--text-faint)', padding: '0 4px' }}
      >
        ×
      </button>
    </div>
  )
}
