'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shuffle } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { loadPostIndexClient } from '@/lib/post-index'

interface Props {
  locale: Locale
  label: string
}

// 사용자가 클릭하면 post-index에서 무작위 포스트로 이동.
// 키보드 단축키 'R'(소문자)도 지원 — input/textarea/modifier 키 입력 중엔 비활성.
// 마지막 본 random은 localStorage 'cfd-lab-random-recent'에 잠시 저장해 같은 글
// 연속 노출을 피한다 (단순 마지막 1개만 회피).
export function RandomPostLink({ locale, label }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const lastRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      lastRef.current = localStorage.getItem('cfd-lab-random-recent')
    } catch {}
  }, [])

  const go = async () => {
    if (loading) return
    setLoading(true)
    try {
      const payload = await loadPostIndexClient()
      // 현재 locale 우선, 없으면 ko fallback
      const candidates = payload.items
        .filter((p) => !p.draft && p.locale === locale)
      const pool = candidates.length > 0
        ? candidates
        : payload.items.filter((p) => !p.draft && p.locale === 'ko')
      if (pool.length === 0) return
      const filtered = pool.length > 1 ? pool.filter((p) => p.slug !== lastRef.current) : pool
      const pick = filtered[Math.floor(Math.random() * filtered.length)]
      lastRef.current = pick.slug
      try { localStorage.setItem('cfd-lab-random-recent', pick.slug) } catch {}
      router.push(pick.url)
    } finally {
      setLoading(false)
    }
  }

  // R 키 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'r' && e.key !== 'R') return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      e.preventDefault()
      go()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  return (
    <button
      type="button"
      onClick={go}
      disabled={loading}
      className="link-hover-text inline-flex min-h-11 items-center gap-1 disabled:opacity-50"
      title={`${label} (R)`}
    >
      <Shuffle className="h-2.5 w-2.5" strokeWidth={2} />
      {label}
    </button>
  )
}
